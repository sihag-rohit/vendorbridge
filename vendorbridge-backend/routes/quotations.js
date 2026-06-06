const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const RFQ = require('../models/RFQ');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logActivity, notifyUsers, createNotification } = require('../utils/helpers');

// GET /api/quotations — list quotations
router.get('/', auth, async (req, res) => {
  try {
    const { rfqId, vendorId, status } = req.query;
    let query = {};

    if (rfqId) query.rfqId = rfqId;
    if (status) query.status = status;

    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findById(req.user.vendorId);
      if (vendor) query.vendorId = vendor._id;
      else return res.json([]);
    } else if (vendorId) {
      query.vendorId = vendorId;
    }

    const quotations = await Quotation.find(query)
      .populate('vendorId', 'name category email rating')
      .populate('rfqId', 'title rfqNumber deadline')
      .sort({ createdAt: -1 });

    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/quotations/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('vendorId', 'name category email gstNumber phone address rating')
      .populate('rfqId', 'title rfqNumber deadline items')
      .populate('submittedBy', 'name');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/quotations — vendor submits quotation
router.post('/', auth, roleCheck('vendor'), async (req, res) => {
  try {
    const { rfqId, items, deliveryTimeline, notes, taxRate, validUntil } = req.body;

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });

    let vendorId = req.body.vendorId;
    if (req.user.role === 'vendor') {
      vendorId = req.user.vendorId;
    }

    // Check if quotation already exists
    const existing = await Quotation.findOne({ rfqId, vendorId });
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
      rfqId, vendorId, items: processedItems,
      subtotal, taxRate: tax, taxAmount, totalAmount,
      deliveryTimeline, notes, validUntil,
      status: 'submitted', submittedAt: new Date(), submittedBy: req.user._id
    });

    // Update vendor stats
    await Vendor.findByIdAndUpdate(vendorId, { $inc: { totalQuotes: 1 } });

    // Update RFQ status
    if (rfq.status === 'sent') {
      await RFQ.findByIdAndUpdate(rfqId, { status: 'under_comparison' });
    }

    await logActivity({
      entityType: 'quotation', entityId: quotation._id,
      action: 'quotation_submitted', description: `Quotation submitted for ${rfq.rfqNumber}`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role,
      metadata: { totalAmount, vendorId }
    });

    // Notify officers
    const officers = await User.find({ role: { $in: ['officer', 'admin'] } });
    const io = req.app.get('io');
    await notifyUsers(io, officers.map(u => u._id), {
      title: 'New Quotation Received',
      message: `A vendor submitted a quotation for ${rfq.rfqNumber}: "${rfq.title}"`,
      type: 'quotation_submitted', entityType: 'rfq', entityId: rfqId, entityNumber: rfq.rfqNumber
    });

    const populated = await Quotation.findById(quotation._id)
      .populate('vendorId', 'name category email rating')
      .populate('rfqId', 'title rfqNumber');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/quotations/:id — update quotation
router.put('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('rfqId');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    if (new Date() > new Date(quotation.rfqId.deadline)) {
      return res.status(400).json({ message: 'Deadline has passed. Cannot update quotation.' });
    }

    // Recalculate if items changed
    if (req.body.items) {
      req.body.items = req.body.items.map(item => ({
        ...item, totalPrice: item.quantity * item.unitPrice
      }));
      req.body.subtotal = req.body.items.reduce((sum, i) => sum + i.totalPrice, 0);
      const tax = req.body.taxRate || quotation.taxRate;
      req.body.taxAmount = (req.body.subtotal * tax) / 100;
      req.body.totalAmount = req.body.subtotal + req.body.taxAmount;
    }

    const updated = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('vendorId', 'name category email rating')
      .populate('rfqId', 'title rfqNumber');

    await logActivity({
      entityType: 'quotation', entityId: updated._id,
      action: 'quotation_updated', description: `Quotation updated for ${updated.rfqId.rfqNumber}`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/quotations/:id/select — select winning quotation
router.put('/:id/select', auth, roleCheck('admin', 'officer'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('rfqId').populate('vendorId');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });

    // Update selected quotation to accepted
    const updatedQuotation = await Quotation.findByIdAndUpdate(req.params.id, { status: 'under_review' }, { new: true });

    // Reject all other quotations for this RFQ
    await Quotation.updateMany(
      { rfqId: quotation.rfqId._id, _id: { $ne: req.params.id } },
      { status: 'rejected' }
    );

    // Update RFQ with selected vendor and quotation
    await RFQ.findByIdAndUpdate(quotation.rfqId._id, {
      selectedVendor: quotation.vendorId._id,
      selectedQuotation: quotation._id,
      status: 'pending_approval'
    });

    await logActivity({
      entityType: 'quotation', entityId: quotation._id,
      action: 'quotation_selected', description: `Quotation from ${quotation.vendorId.name} selected for ${quotation.rfqId.rfqNumber}`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    // Notify managers
    const managers = await User.find({ role: 'manager' });
    const io = req.app.get('io');
    await notifyUsers(io, managers.map(u => u._id), {
      title: 'Approval Required',
      message: `RFQ ${quotation.rfqId.rfqNumber} is pending your approval`,
      type: 'approval_requested', entityType: 'rfq', entityId: quotation.rfqId._id, entityNumber: quotation.rfqId.rfqNumber
    });

    res.json({ message: 'Quotation selected. Sent for approval.', quotation: updatedQuotation });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
