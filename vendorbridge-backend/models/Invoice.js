const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Invoice extends Model {}
class InvoiceItem extends Model {}

Invoice.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  poId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rfqId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  taxRate: {
    type: DataTypes.FLOAT,
    defaultValue: 18
  },
  taxAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled'),
    defaultValue: 'draft'
  },
  billingCompanyName: { type: DataTypes.STRING },
  billingStreet: { type: DataTypes.STRING },
  billingCity: { type: DataTypes.STRING },
  billingState: { type: DataTypes.STRING },
  billingPincode: { type: DataTypes.STRING },
  billingGstNumber: { type: DataTypes.STRING },
  
  paymentTerms: {
    type: DataTypes.STRING,
    defaultValue: 'Net 30'
  },
  notes: {
    type: DataTypes.TEXT
  },
  emailSentAt: {
    type: DataTypes.DATE
  },
  paidAt: {
    type: DataTypes.DATE
  },
  createdById: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  modelName: 'Invoice',
  hooks: {
    beforeCreate: async (invoice) => {
      if (!invoice.invoiceNumber) {
        const count = await Invoice.count();
        const year = new Date().getFullYear();
        invoice.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
      }
    }
  }
});

InvoiceItem.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  invoiceId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING
  },
  unitPrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'InvoiceItem',
  timestamps: false
});

module.exports = { Invoice, InvoiceItem };
