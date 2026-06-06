const express = require('express');
const router = express.Router();
const { Vendor } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { logActivity } = require('../utils/helpers');

// GET /api/vendors
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { gstNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const vendors = await Vendor.findAll({ where: query, order: [['createdAt', 'DESC']] });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/vendors/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/vendors
router.post('/', auth, roleCheck('admin', 'officer'), async (req, res) => {
  try {
    const vendor = await Vendor.create({ ...req.body, createdById: req.user.id });

    await logActivity({
      entityType: 'vendor', entityId: vendor.id, entityNumber: vendor.name,
      action: 'vendor_created', description: `Vendor "${vendor.name}" created`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    res.status(201).json(vendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/vendors/:id
router.put('/:id', auth, roleCheck('admin', 'officer'), async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });
    
    await vendor.update(req.body);

    await logActivity({
      entityType: 'vendor', entityId: vendor.id, entityNumber: vendor.name,
      action: 'vendor_updated', description: `Vendor "${vendor.name}" updated`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    res.json(vendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/vendors/:id
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found.' });
    
    await vendor.destroy();

    await logActivity({
      entityType: 'vendor', entityId: vendor.id, entityNumber: vendor.name,
      action: 'vendor_deleted', description: `Vendor "${vendor.name}" deleted`,
      userId: req.user.id, userName: req.user.name, userRole: req.user.role
    });

    res.json({ message: 'Vendor deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
