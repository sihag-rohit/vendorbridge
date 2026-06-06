const express = require('express');
const router = express.Router();
const RFQ = require('../models/RFQ');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logActivity, notifyUsers } = require('../utils/helpers');

// GET /api/rfqs
router.get('/', auth, async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};

    // Vendors only see RFQs assigned to them
    if (req.user.role === 'vendor') {
      const vendor = await require('../models/Vendor').findById(req.user.vendorId);
      if (vendor) query.assignedVendors = vendor._id;
      else return res.json([]);
    }

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { rfqNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const rfqs = await RFQ.find(query)
      .populate('assignedVendors', 'name email category')
      .populate('createdBy', 'name email')
      .populate('selectedVendor', 'name')
      .sort({ createdAt: -1 });

    res.json(rfqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/rfqs/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id)
      .populate('assignedVendors', 'name email category gstNumber phone')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email')
      .populate('selectedVendor', 'name email');

    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });
    res.json(rfq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/rfqs
router.post('/', auth, roleCheck('admin', 'officer'), async (req, res) => {
  try {
    const rfq = await RFQ.create({ ...req.body, createdBy: req.user._id });

    await logActivity({
      entityType: 'rfq', entityId: rfq._id, entityNumber: rfq.rfqNumber,
      action: 'rfq_created', description: `RFQ "${rfq.title}" (${rfq.rfqNumber}) created`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    // If sent to vendors, notify them
    if (rfq.status === 'sent' && rfq.assignedVendors.length > 0) {
      const vendorUsers = await User.find({ vendorId: { $in: rfq.assignedVendors } });
      const io = req.app.get('io');
      await notifyUsers(io, vendorUsers.map(u => u._id), {
        title: 'New RFQ Received',
        message: `You have been invited to submit a quotation for "${rfq.title}"`,
        type: 'rfq_sent', entityType: 'rfq', entityId: rfq._id, entityNumber: rfq.rfqNumber
      });
    }

    res.status(201).json(rfq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/rfqs/:id
router.put('/:id', auth, roleCheck('admin', 'officer'), async (req, res) => {
  try {
    const rfq = await RFQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedVendors', 'name email')
      .populate('createdBy', 'name');

    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });

    await logActivity({
      entityType: 'rfq', entityId: rfq._id, entityNumber: rfq.rfqNumber,
      action: 'rfq_updated', description: `RFQ "${rfq.title}" updated — status: ${rfq.status}`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    // Notify vendors when RFQ is sent
    if (req.body.status === 'sent') {
      const vendorUsers = await User.find({ vendorId: { $in: rfq.assignedVendors } });
      const io = req.app.get('io');
      await notifyUsers(io, vendorUsers.map(u => u._id), {
        title: 'RFQ Sent to You',
        message: `Please submit your quotation for "${rfq.title}" by ${new Date(rfq.deadline).toLocaleDateString()}`,
        type: 'rfq_sent', entityType: 'rfq', entityId: rfq._id, entityNumber: rfq.rfqNumber
      });
    }

    res.json(rfq);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/rfqs/:id
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const rfq = await RFQ.findByIdAndDelete(req.params.id);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found.' });

    await logActivity({
      entityType: 'rfq', entityId: rfq._id, entityNumber: rfq.rfqNumber,
      action: 'rfq_deleted', description: `RFQ "${rfq.title}" deleted`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    res.json({ message: 'RFQ deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
