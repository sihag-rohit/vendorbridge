const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['IT & Software', 'Office Supplies', 'Raw Materials', 'Logistics', 'Consulting', 'Manufacturing', 'Construction', 'Healthcare', 'Food & Beverage', 'Other']
  },
  gstNumber: { type: String, trim: true, uppercase: true },
  contactPerson: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  totalOrders: { type: Number, default: 0 },
  onTimeDeliveries: { type: Number, default: 0 },
  quoteWins: { type: Number, default: 0 },
  totalQuotes: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true });

// Virtual for on-time delivery rate
vendorSchema.virtual('onTimeDeliveryRate').get(function () {
  if (this.totalOrders === 0) return 0;
  return Math.round((this.onTimeDeliveries / this.totalOrders) * 100);
});

// Virtual for quote win rate
vendorSchema.virtual('quoteWinRate').get(function () {
  if (this.totalQuotes === 0) return 0;
  return Math.round((this.quoteWins / this.totalQuotes) * 100);
});

vendorSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Vendor', vendorSchema);
