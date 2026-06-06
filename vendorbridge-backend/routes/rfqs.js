const express = require('express');
const router = express.Router();
const { RFQ, RfqItem, RfqAttachment, Vendor, User, RfqVendor } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logActivity, notifyUsers } = require('../utils/helpers');

// GET /api/rfqs
router.get('/', auth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let where = {};
    let includeVendor = { model: Vendor, as: 'assignedVendors', attributes: ['id', 'name', 'email', 'category'] };

    // Vendors only see RFQs assigned to them
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findByPk(req.user.vendorId);
      if (vendor) {
        includeVendor.where = { id: vendor.id };
      } else {
        return res.json([]);
      }
    }

    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { rfqNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const rfqs = await RFQ.findAll({
      where,
      include: [
        includeVendor,
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
        { model: Vendor, as: 'selectedVendor', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(rfqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/rfqs/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: 'assignedVendors', attributes: ['id', 'name', 'email', 'category', 'gstNumber', 'phone'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'name', 'email'] },
        { model: Vendor, as: 'selectedVendor', attributes: ['id', 'name', 'email'] },
        { model: RfqItem, as: 'items' },
        { model: RfqAttachment, as: 'attachments' }
      ]
    });

    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });
    res.json(rfq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/rfqs
router.post('/', auth, roleCheck('admin', 'officer'), async (req, res) => {
  const transaction = await require('../config/database').transaction();
  try {
    const rfqData = { ...req.body, createdById: req.user.id };
    
    // Items are created separately in SQL
    const items = rfqData.items || [];
    delete rfqData.items;

    const assignedVendors = rfqData.assignedVendors || [];
    delete rfqData.assignedVendors;

    const attachments = rfqData.attachments || [];
    delete rfqData.attachments;

    const rfq = await RFQ.create(rfqData, { transaction });

    // Create Items
    for (const item of items) {
      await RfqItem.create({ ...item, rfqId: rfq.id }, { transaction });
    }

    // Assign Vendors
    for (const vendorId of assignedVendors) {
      await RfqVendor.create({ rfqId: rfq.id, vendorId: vendorId }, { transaction });
    }

    // Add Attachments
    for (const file of attachments) {
      await RfqAttachment.create({ ...file, rfqId: rfq.id }, { transaction });
    }

    await transaction.commit();

    await logActivity({
      entityType: 'rfq', entityId: rfq.id, entityNumber: rfq.rfqNumber,
      action: 'rfq_created', description: `RFQ "${rfq.title}" (${rfq.rfqNumber}) created`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    // If sent to vendors, notify them
    if (rfq.status === 'sent' && assignedVendors.length > 0) {
      const vendorUsers = await User.findAll({ where: { vendorId: assignedVendors } });
      const io = req.app.get('io');
      await notifyUsers(io, vendorUsers.map(u => u.id), {
        title: 'New RFQ Received',
        message: `You have been invited to submit a quotation for "${rfq.title}"`,
        type: 'rfq_sent', entityType: 'rfq', entityId: rfq.id, entityNumber: rfq.rfqNumber
      });
    }

    res.status(201).json(rfq);
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/rfqs/:id
router.put('/:id', auth, roleCheck('admin', 'officer'), async (req, res) => {
  const transaction = await require('../config/database').transaction();
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });

    const updateData = { ...req.body };
    const assignedVendors = updateData.assignedVendors;
    delete updateData.assignedVendors;

    await rfq.update(updateData, { transaction });

    // Update assigned vendors if provided
    if (assignedVendors) {
      await RfqVendor.destroy({ where: { rfqId: rfq.id }, transaction });
      for (const vendorId of assignedVendors) {
        await RfqVendor.create({ rfqId: rfq.id, vendorId: vendorId }, { transaction });
      }
    }

    await transaction.commit();

    await logActivity({
      entityType: 'rfq', entityId: rfq.id, entityNumber: rfq.rfqNumber,
      action: 'rfq_updated', description: `RFQ "${rfq.title}" updated — status: ${rfq.status}`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    // Notify vendors when RFQ is sent
    if (req.body.status === 'sent') {
      const currentAssigned = assignedVendors || [];
      if (currentAssigned.length > 0) {
        const vendorUsers = await User.findAll({ where: { vendorId: currentAssigned } });
        const io = req.app.get('io');
        await notifyUsers(io, vendorUsers.map(u => u.id), {
          title: 'RFQ Sent to You',
          message: `Please submit your quotation for "${rfq.title}" by ${new Date(rfq.deadline).toLocaleDateString()}`,
          type: 'rfq_sent', entityType: 'rfq', entityId: rfq.id, entityNumber: rfq.rfqNumber
        });
      }
    }

    const updatedRfq = await RFQ.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: 'assignedVendors', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] }
      ]
    });

    res.json(updatedRfq);
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/rfqs/:id
router.delete('/:id', auth, roleCheck('admin', 'officer'), async (req, res) => {
  try {
    const rfq = await RFQ.findByPk(req.params.id);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });

    // Manually delete dependent records to avoid SQLite constraint errors
    const { QuotationItem, Quotation, PoItem, PurchaseOrder, InvoiceItem, Invoice } = require('../models');
    
    // 1. Invoices
    const invoices = await Invoice.findAll({ where: { rfqId: rfq.id } });
    for (const inv of invoices) {
      await InvoiceItem.destroy({ where: { invoiceId: inv.id } });
      await inv.destroy();
    }
    
    // 2. Purchase Orders
    const pos = await PurchaseOrder.findAll({ where: { rfqId: rfq.id } });
    for (const po of pos) {
      await PoItem.destroy({ where: { purchaseOrderId: po.id } });
      await po.destroy();
    }
    
    // 3. Quotations
    const quotes = await Quotation.findAll({ where: { rfqId: rfq.id } });
    for (const q of quotes) {
      await QuotationItem.destroy({ where: { quotationId: q.id } });
      await q.destroy();
    }
    
    // 4. RFQ Dependencies
    await RfqVendor.destroy({ where: { rfqId: rfq.id } });
    await RfqAttachment.destroy({ where: { rfqId: rfq.id } });
    await RfqItem.destroy({ where: { rfqId: rfq.id } });

    // Finally delete the RFQ
    await rfq.destroy();

    await logActivity({
      entityType: 'rfq', entityId: rfq.id, entityNumber: rfq.rfqNumber,
      action: 'rfq_deleted', description: `RFQ "${rfq.title}" deleted`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    res.json({ message: 'RFQ deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
