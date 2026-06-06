const express = require('express');
const router = express.Router();
const { ActivityLog, User } = require('../models');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// GET /api/activity-logs
router.get('/', auth, roleCheck('admin', 'manager', 'officer'), async (req, res) => {
  try {
    const { entityType, entityId, limit = 100 } = req.query;
    let where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const logs = await ActivityLog.findAll({
      where,
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email', 'role'] }], // Assuming User association exists
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/activity-logs/entity/:entityId
router.get('/entity/:entityId', auth, async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      where: { entityId: req.params.entityId },
      include: [{ model: User, as: 'User', attributes: ['id', 'name', 'email', 'role'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
