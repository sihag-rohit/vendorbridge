const mongoose = require('mongoose');

const approvalLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['rfq', 'purchase_order', 'invoice'],
    required: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'entityModel' },
  entityModel: { type: String, enum: ['RFQ', 'PurchaseOrder', 'Invoice'] },
  entityNumber: String, // rfqNumber, poNumber, etc.
  action: {
    type: String,
    enum: ['submitted_for_approval', 'approved', 'rejected', 'resubmitted'],
    required: true
  },
  remarks: { type: String },
  approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('ApprovalLog', approvalLogSchema);
