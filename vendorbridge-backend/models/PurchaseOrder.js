const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  description: String,
  quantity: { type: Number, required: true },
  unit: String,
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true }
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, unique: true },
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [poItemSchema],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  deliveryDate: { type: Date },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  status: {
    type: String,
    enum: ['generated', 'sent', 'acknowledged', 'in_progress', 'delivered', 'cancelled'],
    default: 'generated'
  },
  termsConditions: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-generate PO number
purchaseOrderSchema.pre('save', async function (next) {
  if (!this.poNumber) {
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    const year = new Date().getFullYear();
    this.poNumber = `PO-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
