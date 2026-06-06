const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const auth = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');

// GET /api/purchase-orders
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    if (req.user.role === 'vendor') {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(req.user.vendorId);
      if (vendor) query.vendorId = vendor._id;
      else return res.json([]);
    }

    const pos = await PurchaseOrder.find(query)
      .populate('vendorId', 'name email category')
      .populate('rfqId', 'title rfqNumber')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/purchase-orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('vendorId', 'name email category gstNumber phone address')
      .populate('rfqId', 'title rfqNumber deadline')
      .populate('quotationId')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');
    if (!po) return res.status(404).json({ message: 'Purchase Order not found.' });
    res.json(po);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/purchase-orders/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('vendorId', 'name')
      .populate('rfqId', 'rfqNumber title');

    if (!po) return res.status(404).json({ message: 'PO not found.' });

    await logActivity({
      entityType: 'purchase_order', entityId: po._id, entityNumber: po.poNumber,
      action: 'po_status_updated', description: `PO ${po.poNumber} status updated to ${status}`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    res.json(po);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
