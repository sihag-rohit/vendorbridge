const mongoose = require('mongoose');

const rfqItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: 'pcs' },
  estimatedPrice: Number
});

const rfqSchema = new mongoose.Schema({
  rfqNumber: { type: String, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String },
  items: [rfqItemSchema],
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['draft', 'sent', 'under_comparison', 'pending_approval', 'approved', 'rejected', 'closed'],
    default: 'draft'
  },
  assignedVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
  selectedVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  selectedQuotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', default: null },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvalRemarks: String,
  approvedAt: Date,
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

// Auto-generate RFQ number before save
rfqSchema.pre('save', async function (next) {
  if (!this.rfqNumber) {
    const count = await mongoose.model('RFQ').countDocuments();
    this.rfqNumber = `RFQ-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('RFQ', rfqSchema);
