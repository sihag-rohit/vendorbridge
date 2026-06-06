const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// Log an activity
const logActivity = async ({ entityType, entityId, entityNumber, action, description, userId, userName, userRole, metadata }) => {
  try {
    await ActivityLog.create({
      entityType, entityId, entityNumber, action, description,
      userId, userName, userRole, metadata
    });
  } catch (err) {
    console.error('Activity log error:', err.message);
  }
};

// Create notification and emit via socket
const createNotification = async (io, { userId, title, message, type, entityType, entityId, entityNumber }) => {
  try {
    const notification = await Notification.create({
      userId, title, message, type, entityType, entityId, entityNumber
    });
    // Emit real-time notification via socket
    if (io) {
      io.to(`user_${userId}`).emit('notification', notification);
    }
    return notification;
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// Send notifications to multiple users
const notifyUsers = async (io, userIds, notificationData) => {
  for (const userId of userIds) {
    await createNotification(io, { ...notificationData, userId });
  }
};

module.exports = { logActivity, createNotification, notifyUsers };
