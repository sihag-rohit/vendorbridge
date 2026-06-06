const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['rfq_created', 'rfq_sent', 'rfq_closed', 'quotation_submitted', 'quotation_accepted', 'quotation_rejected', 'approval_requested', 'approved', 'rejected', 'po_generated', 'invoice_generated', 'invoice_paid', 'general'],
    default: 'general'
  },
  entityType: { type: String },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  entityNumber: String,
  isRead: { type: Boolean, default: false },
  readAt: Date
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
