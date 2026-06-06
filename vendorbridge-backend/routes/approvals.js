const express = require('express');
const router = express.Router();
const { RFQ, Quotation, PurchaseOrder, PoItem, Invoice, ApprovalLog, User, Vendor, QuotationItem } = require('../models');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logActivity, createNotification } = require('../utils/helpers');

// GET /api/approvals — pending approvals for manager
router.get('/', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const rfqs = await RFQ.findAll({
      where: { status: 'pending_approval' },
      include: [
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
        { model: Vendor, as: 'selectedVendor', attributes: ['id', 'name', 'email', 'category'] },
        { model: Quotation, as: 'selectedQuotation' }
      ],
      order: [['updatedAt', 'DESC']]
    });
    res.json(rfqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/approvals/logs/:rfqId — approval timeline for an RFQ
router.get('/logs/:rfqId', auth, async (req, res) => {
  try {
    const logs = await ApprovalLog.findAll({
      where: { entityId: req.params.rfqId },
      include: [
        { model: User, as: 'approver', attributes: ['id', 'name', 'email', 'role'] },
        { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/approvals/:rfqId/approve
router.post('/:rfqId/approve', auth, roleCheck('admin', 'manager'), async (req, res) => {
  const transaction = await require('../config/database').transaction();
  try {
    const { remarks } = req.body;
    const rfq = await RFQ.findByPk(req.params.rfqId, {
      include: [
        { model: Quotation, as: 'selectedQuotation', include: [{ model: QuotationItem, as: 'items' }] },
        { model: Vendor, as: 'selectedVendor' },
        { model: User, as: 'createdBy' }
      ]
    });

    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });
    if (rfq.status !== 'pending_approval') {
      return res.status(400).json({ message: 'RFQ is not pending approval.' });
    }

    // Update RFQ
    await rfq.update({
      status: 'approved',
      approvedById: req.user.id,
      approvedAt: new Date(),
      approvalRemarks: remarks
    }, { transaction });

    // Update quotation status
    if (rfq.selectedQuotation) {
      await rfq.selectedQuotation.update({ status: 'accepted' }, { transaction });
    }

    // Log approval
    await ApprovalLog.create({
      entityType: 'rfq', entityId: rfq.id, entityModel: 'RFQ',
      entityNumber: rfq.rfqNumber, action: 'approved', remarks,
      approverId: req.user.id
    }, { transaction });

    // Auto-generate Purchase Order
    const q = rfq.selectedQuotation;
    let po = null;
    if (q) {
      po = await PurchaseOrder.create({
        rfqId: rfq.id,
        quotationId: q.id,
        vendorId: rfq.selectedVendor.id,
        subtotal: q.subtotal,
        taxRate: q.taxRate,
        taxAmount: q.taxAmount,
        totalAmount: q.totalAmount,
        deliveryDate: new Date(Date.now() + q.deliveryTimeline * 24 * 60 * 60 * 1000),
        createdById: req.user.id,
        approvedById: req.user.id
      }, { transaction });

      // Copy QuotationItems to PoItems
      for (const item of q.items) {
        await PoItem.create({
          purchaseOrderId: po.id,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }, { transaction });
      }
    }

    // Update vendor stats
    if (rfq.selectedVendor) {
      await rfq.selectedVendor.increment({ totalOrders: 1, quoteWins: 1 }, { transaction });
    }

    await transaction.commit();

    await logActivity({
      entityType: 'rfq', entityId: rfq.id, entityNumber: rfq.rfqNumber,
      action: 'rfq_approved', description: `RFQ ${rfq.rfqNumber} approved. ${po ? `PO ${po.poNumber} generated.` : ''}`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    // Notify officer who created the RFQ
    const io = req.app.get('io');
    await createNotification(io, {
      userId: rfq.createdBy.id,
      title: 'RFQ Approved!',
      message: `RFQ ${rfq.rfqNumber} has been approved. ${po ? `PO ${po.poNumber} generated.` : ''}`,
      type: 'approved', entityType: 'rfq', entityId: rfq.id, entityNumber: rfq.rfqNumber
    });

    // Notify vendor user
    if (rfq.selectedVendor) {
      const vendorUser = await User.findOne({ where: { vendorId: rfq.selectedVendor.id } });
      if (vendorUser && po) {
        await createNotification(io, {
          userId: vendorUser.id,
          title: 'Quotation Accepted!',
          message: `Your quotation for ${rfq.rfqNumber} has been accepted. PO ${po.poNumber} generated.`,
          type: 'quotation_accepted', entityType: 'purchase_order', entityId: po.id, entityNumber: po.poNumber
        });
      }
    }

    res.json({ message: 'RFQ approved. Purchase Order generated.', rfq, purchaseOrder: po });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

// POST /api/approvals/:rfqId/reject
router.post('/:rfqId/reject', auth, roleCheck('admin', 'manager'), async (req, res) => {
  const transaction = await require('../config/database').transaction();
  try {
    const { remarks } = req.body;
    if (!remarks) return res.status(400).json({ message: 'Rejection remarks are required.' });

    const rfq = await RFQ.findByPk(req.params.rfqId, { include: [{ model: User, as: 'createdBy' }] });
    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });

    await rfq.update({
      status: 'rejected',
      approvalRemarks: remarks,
      approvedById: req.user.id
    }, { transaction });

    await ApprovalLog.create({
      entityType: 'rfq', entityId: rfq.id, entityModel: 'RFQ',
      entityNumber: rfq.rfqNumber, action: 'rejected', remarks,
      approverId: req.user.id
    }, { transaction });

    await transaction.commit();

    await logActivity({
      entityType: 'rfq', entityId: rfq.id, entityNumber: rfq.rfqNumber,
      action: 'rfq_rejected', description: `RFQ ${rfq.rfqNumber} rejected. Remarks: ${remarks}`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    const io = req.app.get('io');
    await createNotification(io, {
      userId: rfq.createdBy.id,
      title: 'RFQ Rejected',
      message: `RFQ ${rfq.rfqNumber} was rejected. Remarks: ${remarks}`,
      type: 'rejected', entityType: 'rfq', entityId: rfq.id, entityNumber: rfq.rfqNumber
    });

    res.json({ message: 'RFQ rejected.', rfq });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
