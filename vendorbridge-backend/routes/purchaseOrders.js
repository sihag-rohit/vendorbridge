const express = require('express');
const router = express.Router();
const { PurchaseOrder, PoItem, Vendor, RFQ, User, Quotation, Invoice } = require('../models');
const auth = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');

// GET /api/purchase-orders
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let where = {};
    if (status) where.status = status;

    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findByPk(req.user.vendorId);
      if (vendor) where.vendorId = vendor.id;
      else return res.json([]);
    }

    const pos = await PurchaseOrder.findAll({
      where,
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'email', 'category'] },
        { model: RFQ, as: 'rfq', attributes: ['id', 'title', 'rfqNumber'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(pos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/purchase-orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'email', 'category', 'gstNumber', 'phone', 'addressStreet', 'addressCity'] },
        { model: RFQ, as: 'rfq', attributes: ['id', 'title', 'rfqNumber', 'deadline'] },
        { model: Quotation, as: 'quotation' },
        { model: Invoice, as: 'invoice', attributes: ['id', 'invoiceNumber', 'status'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'name', 'email'] },
        { model: PoItem, as: 'items' }
      ]
    });
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
    const po = await PurchaseOrder.findByPk(req.params.id, {
      include: [
        { model: Vendor, as: 'vendor', attributes: ['id', 'name'] },
        { model: RFQ, as: 'rfq', attributes: ['id', 'rfqNumber', 'title'] }
      ]
    });

    if (!po) return res.status(404).json({ message: 'PO not found.' });

    await po.update({ status });

    await logActivity({
      entityType: 'purchase_order', entityId: po.id, entityNumber: po.poNumber,
      action: 'po_status_updated', description: `PO ${po.poNumber} status updated to ${status}`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    res.json(po);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
