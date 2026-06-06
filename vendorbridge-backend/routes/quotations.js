const express = require('express');
const router = express.Router();
const { Quotation, QuotationItem, RFQ, Vendor, User } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logActivity, notifyUsers } = require('../utils/helpers');

// GET /api/quotations — list quotations
router.get('/', auth, async (req, res) => {
  try {
    const { rfqId, vendorId, status } = req.query;
    let where = {};

    if (rfqId) where.rfqId = rfqId;
    if (status) where.status = status;

    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findByPk(req.user.vendorId);
      if (vendor) where.vendorId = vendor.id;
      else return res.json([]);
    } else if (vendorId) {
      where.vendorId = vendorId;
    }

    const quotations = await Quotation.findAll({
      where,
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'category', 'email', 'rating'] },
        { model: RFQ, as: 'rfq', attributes: ['id', 'title', 'rfqNumber', 'deadline'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/quotations/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'category', 'email', 'gstNumber', 'phone', 'addressStreet', 'addressCity', 'rating'] },
        { model: RFQ, as: 'rfq', attributes: ['id', 'title', 'rfqNumber', 'deadline'] },
        { model: User, as: 'submittedBy', attributes: ['id', 'name'] },
        { model: QuotationItem, as: 'items' }
      ]
    });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/quotations — vendor submits quotation
router.post('/', auth, roleCheck('vendor'), async (req, res) => {
  const transaction = await require('../config/database').transaction();
  try {
    const { rfqId, items, deliveryTimeline, notes, taxRate, validUntil } = req.body;

    const rfq = await RFQ.findByPk(rfqId);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });

    let vendorId = req.body.vendorId;
    if (req.user.role === 'vendor') {
      vendorId = req.user.vendorId;
    }

    // Check if quotation already exists
    const existing = await Quotation.findOne({ where: { rfqId, vendorId } });
    if (existing) {
      return res.status(400).json({ message: 'Quotation already submitted. Use PUT to update.' });
    }

    // Calculate totals
    const processedItems = items.map(item => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice
    }));
    const subtotal = processedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const tax = taxRate || 18;
    const taxAmount = (subtotal * tax) / 100;
    const totalAmount = subtotal + taxAmount;

    const quotation = await Quotation.create({
      rfqId, vendorId,
      subtotal, taxRate: tax, taxAmount, totalAmount,
      deliveryTimeline, notes, validUntil,
      status: 'submitted', submittedAt: new Date(), submittedById: req.user.id
    }, { transaction });

    // Create Items
    for (const item of processedItems) {
      await QuotationItem.create({ ...item, quotationId: quotation.id }, { transaction });
    }

    // Update vendor stats
    const vendor = await Vendor.findByPk(vendorId, { transaction });
    if (vendor) {
      await vendor.increment('totalQuotes', { by: 1, transaction });
    }

    // Update RFQ status
    if (rfq.status === 'sent') {
      await rfq.update({ status: 'under_comparison' }, { transaction });
    }

    await transaction.commit();

    await logActivity({
      entityType: 'quotation', entityId: quotation.id,
      action: 'quotation_submitted', description: `Quotation submitted for ${rfq.rfqNumber}`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role,
      metadata: { totalAmount, vendorId }
    });

    // Notify officers
    const officers = await User.findAll({ where: { role: { [Op.in]: ['officer', 'admin'] } } });
    const io = req.app.get('io');
    await notifyUsers(io, officers.map(u => u.id), {
      title: 'New Quotation Received',
      message: `A vendor submitted a quotation for ${rfq.rfqNumber}: "${rfq.title}"`,
      type: 'quotation_submitted', entityType: 'rfq', entityId: rfqId, entityNumber: rfq.rfqNumber
    });

    const populated = await Quotation.findByPk(quotation.id, {
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'category', 'email', 'rating'] },
        { model: RFQ, as: 'rfq', attributes: ['id', 'title', 'rfqNumber'] },
        { model: QuotationItem, as: 'items' }
      ]
    });

    res.status(201).json(populated);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/quotations/:id — update quotation
router.put('/:id', auth, async (req, res) => {
  const transaction = await require('../config/database').transaction();
  try {
    const quotation = await Quotation.findByPk(req.params.id, { include: [{ model: RFQ, as: 'rfq' }] });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    if (new Date() > new Date(quotation.rfq.deadline)) {
      return res.status(400).json({ message: 'Deadline has passed. Cannot update quotation.' });
    }

    const updateData = { ...req.body };

    // Recalculate if items changed
    if (req.body.items) {
      await QuotationItem.destroy({ where: { quotationId: quotation.id }, transaction });
      
      const processedItems = req.body.items.map(item => ({
        ...item, totalPrice: item.quantity * item.unitPrice, quotationId: quotation.id
      }));

      for (const item of processedItems) {
        await QuotationItem.create(item, { transaction });
      }

      updateData.subtotal = processedItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const tax = req.body.taxRate || quotation.taxRate;
      updateData.taxRate = tax;
      updateData.taxAmount = (updateData.subtotal * tax) / 100;
      updateData.totalAmount = updateData.subtotal + updateData.taxAmount;
    }

    await quotation.update(updateData, { transaction });
    await transaction.commit();

    await logActivity({
      entityType: 'quotation', entityId: quotation.id,
      action: 'quotation_updated', description: `Quotation updated for ${quotation.rfq.rfqNumber}`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    const updated = await Quotation.findByPk(quotation.id, {
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'category', 'email', 'rating'] },
        { model: RFQ, as: 'rfq', attributes: ['id', 'title', 'rfqNumber'] },
        { model: QuotationItem, as: 'items' }
      ]
    });

    res.json(updated);
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/quotations/:id/select — select winning quotation
router.put('/:id/select', auth, roleCheck('admin', 'officer'), async (req, res) => {
  const transaction = await require('../config/database').transaction();
  try {
    const quotation = await Quotation.findByPk(req.params.id, {
      include: [
        { model: RFQ, as: 'rfq' },
        { model: Vendor, as: 'vendor' }
      ]
    });
    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    // Update selected quotation to under_review
    await quotation.update({ status: 'under_review' }, { transaction });

    // Reject all other quotations for this RFQ
    await Quotation.update(
      { status: 'rejected' },
      { 
        where: { 
          rfqId: quotation.rfqId, 
          id: { [Op.ne]: req.params.id } 
        },
        transaction 
      }
    );

    // Update RFQ with selected vendor and quotation
    await RFQ.update({
      selectedVendorId: quotation.vendorId,
      selectedQuotationId: quotation.id,
      status: 'pending_approval'
    }, {
      where: { id: quotation.rfqId },
      transaction
    });

    await transaction.commit();

    await logActivity({
      entityType: 'quotation', entityId: quotation.id,
      action: 'quotation_selected', description: `Quotation from ${quotation.vendor.name} selected for ${quotation.rfq.rfqNumber}`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    // Notify managers
    const managers = await User.findAll({ where: { role: 'manager' } });
    const io = req.app.get('io');
    await notifyUsers(io, managers.map(u => u.id), {
      title: 'Approval Required',
      message: `RFQ ${quotation.rfq.rfqNumber} is pending your approval`,
      type: 'approval_requested', entityType: 'rfq', entityId: quotation.rfqId, entityNumber: quotation.rfq.rfqNumber
    });

    res.json({ message: 'Quotation selected. Sent for approval.', quotation });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
