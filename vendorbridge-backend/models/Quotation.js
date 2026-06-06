const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: String,
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
});

const quotationSchema = new mongoose.Schema({
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [quotationItemSchema],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  deliveryTimeline: { type: Number, required: true }, // days
  deliveryDate: Date,
  notes: String,
  termsConditions: String,
  validUntil: Date,
  status: {
    type: String,
    enum: ['pending', 'submitted', 'under_review', 'accepted', 'rejected'],
    default: 'pending'
  },
  submittedAt: Date,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Calculate totals before save
quotationSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.taxAmount = (this.subtotal * this.taxRate) / 100;
    this.totalAmount = this.subtotal + this.taxAmount;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
