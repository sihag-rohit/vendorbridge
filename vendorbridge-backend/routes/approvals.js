const express = require('express');
const router = express.Router();
const RFQ = require('../models/RFQ');
const Quotation = require('../models/Quotation');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const ApprovalLog = require('../models/ApprovalLog');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logActivity, notifyUsers, createNotification } = require('../utils/helpers');

// GET /api/approvals — pending approvals for manager
router.get('/', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const rfqs = await RFQ.find({ status: 'pending_approval' })
      .populate('createdBy', 'name email')
      .populate('selectedVendor', 'name email category')
      .populate('selectedQuotation')
      .sort({ updatedAt: -1 });
    res.json(rfqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/approvals/logs/:rfqId — approval timeline for an RFQ
router.get('/logs/:rfqId', auth, async (req, res) => {
  try {
    const logs = await ApprovalLog.find({ entityId: req.params.rfqId })
      .populate('approverId', 'name email role')
      .populate('submittedById', 'name email')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/approvals/:rfqId/approve
router.post('/:rfqId/approve', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { remarks } = req.body;
    const rfq = await RFQ.findById(req.params.rfqId)
      .populate('selectedQuotation')
      .populate('selectedVendor')
      .populate('createdBy');

    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });
    if (rfq.status !== 'pending_approval') {
      return res.status(400).json({ message: 'RFQ is not pending approval.' });
    }

    // Update RFQ
    rfq.status = 'approved';
    rfq.approvedBy = req.user._id;
    rfq.approvedAt = new Date();
    rfq.approvalRemarks = remarks;
    await rfq.save();

    // Update quotation status
    if (rfq.selectedQuotation) {
      await Quotation.findByIdAndUpdate(rfq.selectedQuotation._id, { status: 'accepted' });
    }

    // Log approval
    await ApprovalLog.create({
      entityType: 'rfq', entityId: rfq._id, entityModel: 'RFQ',
      entityNumber: rfq.rfqNumber, action: 'approved', remarks,
      approverId: req.user._id
    });

    // Auto-generate Purchase Order
    const q = rfq.selectedQuotation;
    const po = await PurchaseOrder.create({
      rfqId: rfq._id,
      quotationId: q._id,
      vendorId: rfq.selectedVendor._id,
      items: q.items,
      subtotal: q.subtotal,
      taxRate: q.taxRate,
      taxAmount: q.taxAmount,
      totalAmount: q.totalAmount,
      deliveryDate: new Date(Date.now() + q.deliveryTimeline * 24 * 60 * 60 * 1000),
      createdBy: req.user._id,
      approvedBy: req.user._id
    });

    // Update vendor stats
    await Vendor.findByIdAndUpdate(rfq.selectedVendor._id, { $inc: { totalOrders: 1, quoteWins: 1 } });

    await logActivity({
      entityType: 'rfq', entityId: rfq._id, entityNumber: rfq.rfqNumber,
      action: 'rfq_approved', description: `RFQ ${rfq.rfqNumber} approved. PO ${po.poNumber} generated.`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    // Notify officer who created the RFQ
    const io = req.app.get('io');
    await createNotification(io, {
      userId: rfq.createdBy._id,
      title: 'RFQ Approved!',
      message: `RFQ ${rfq.rfqNumber} has been approved. PO ${po.poNumber} generated.`,
      type: 'approved', entityType: 'rfq', entityId: rfq._id, entityNumber: rfq.rfqNumber
    });

    // Notify vendor user
    const vendorUser = await User.findOne({ vendorId: rfq.selectedVendor._id });
    if (vendorUser) {
      await createNotification(io, {
        userId: vendorUser._id,
        title: 'Quotation Accepted!',
        message: `Your quotation for ${rfq.rfqNumber} has been accepted. PO ${po.poNumber} generated.`,
        type: 'quotation_accepted', entityType: 'purchase_order', entityId: po._id, entityNumber: po.poNumber
      });
    }

    res.json({ message: 'RFQ approved. Purchase Order generated.', rfq, purchaseOrder: po });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/approvals/:rfqId/reject
router.post('/:rfqId/reject', auth, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks) return res.status(400).json({ message: 'Rejection remarks are required.' });

    const rfq = await RFQ.findById(req.params.rfqId).populate('createdBy');
    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });

    rfq.status = 'rejected';
    rfq.approvalRemarks = remarks;
    rfq.approvedBy = req.user._id;
    await rfq.save();

    await ApprovalLog.create({
      entityType: 'rfq', entityId: rfq._id, entityModel: 'RFQ',
      entityNumber: rfq.rfqNumber, action: 'rejected', remarks,
      approverId: req.user._id
    });

    await logActivity({
      entityType: 'rfq', entityId: rfq._id, entityNumber: rfq.rfqNumber,
      action: 'rfq_rejected', description: `RFQ ${rfq.rfqNumber} rejected. Remarks: ${remarks}`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    const io = req.app.get('io');
    await createNotification(io, {
      userId: rfq.createdBy._id,
      title: 'RFQ Rejected',
      message: `RFQ ${rfq.rfqNumber} was rejected. Remarks: ${remarks}`,
      type: 'rejected', entityType: 'rfq', entityId: rfq._id, entityNumber: rfq.rfqNumber
    });

    res.json({ message: 'RFQ rejected.', rfq });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
