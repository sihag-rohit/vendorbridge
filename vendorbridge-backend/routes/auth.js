const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Vendor } = require('../models');
const auth = require('../middleware/auth');
const { logActivity } = require('../utils/helpers');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, vendorCategory, gstNumber, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const allowedRoles = ['admin', 'officer', 'vendor', 'manager'];
    const userRole = allowedRoles.includes(role) ? role : 'officer';

    const user = await User.create({ name, email, password, role: userRole });

    if (userRole === 'vendor') {
      const vendor = await Vendor.create({
        name: name,
        email: email,
        phone: phone || '',
        category: vendorCategory || 'Other',
        gstNumber: gstNumber || '',
        addressStreet: address || '',
        contactPerson: name,
        status: 'active',
        createdById: user.id
      });
      user.vendorId = vendor.id;
      await user.save();
    }

    await logActivity({
      entityType: 'user', entityId: user.id,
      action: 'user_registered', description: `New user ${name} registered as ${userRole}`,
      userId: user.id, userName: name, userRole: userRole
    });

    const token = generateToken(user.id);
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    await logActivity({
      entityType: 'user', entityId: user.id,
      action: 'user_login', description: `${user.name} logged in`,
      userId: user.id, userName: user.name, userRole: user.role
    });

    const token = generateToken(user.id);
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Vendor, as: 'vendor' }]
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'No account found with that email.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save({ validate: false });

    res.json({ message: 'Password reset token generated.', resetToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { [require('sequelize').Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const token = generateToken(user.id);
    res.json({ message: 'Password reset successful.', token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, password, phone, vendorCategory, gstNumber, address } = req.body;
    
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
    }
    if (password) {
      user.password = password;
    }
    await user.save();

    let updatedVendor = null;
    if (user.role === 'vendor' && user.vendorId) {
      const vendor = await Vendor.findByPk(user.vendorId);
      if (vendor) {
        vendor.name = name || vendor.name;
        vendor.email = email || vendor.email;
        vendor.contactPerson = name || vendor.contactPerson;
        if (phone !== undefined) vendor.phone = phone;
        if (vendorCategory !== undefined) vendor.category = vendorCategory;
        if (gstNumber !== undefined) vendor.gstNumber = gstNumber;
        if (address !== undefined) vendor.addressStreet = address;
        await vendor.save();
        updatedVendor = vendor;
      }
    }

    const updatedUser = await User.findByPk(user.id); // Get fresh data
    const userDataToReturn = {
      ...updatedUser.toJSON(),
      vendor: updatedVendor
    };

    res.json(userDataToReturn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/users — Admin only
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    const users = await User.findAll({
      include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'name'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/auth/users/:id — Admin toggle active
router.put('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await user.update(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
