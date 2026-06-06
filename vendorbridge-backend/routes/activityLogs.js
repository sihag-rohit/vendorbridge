const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// GET /api/activity-logs
router.get('/', auth, roleCheck('admin', 'manager', 'officer'), async (req, res) => {
  try {
    const { entityType, entityId, limit = 100 } = req.query;
    let query = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;

    const logs = await ActivityLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/activity-logs/entity/:entityId
router.get('/entity/:entityId', auth, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ entityId: req.params.entityId })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
