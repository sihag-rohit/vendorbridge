const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['rfq', 'vendor', 'quotation', 'purchase_order', 'invoice', 'user', 'approval'],
    required: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  entityNumber: String,
  action: { type: String, required: true },
  description: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userRole: String,
  metadata: { type: mongoose.Schema.Types.Mixed },
  ipAddress: String
}, { timestamps: true });

// Index for faster queries
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
