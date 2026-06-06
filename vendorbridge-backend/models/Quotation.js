const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Quotation extends Model {}
class QuotationItem extends Model {}

Quotation.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  rfqId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subtotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  taxRate: {
    type: DataTypes.FLOAT,
    defaultValue: 18
  },
  taxAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  deliveryTimeline: {
    type: DataTypes.INTEGER, // days
    allowNull: false
  },
  deliveryDate: {
    type: DataTypes.DATE
  },
  notes: {
    type: DataTypes.TEXT
  },
  termsConditions: {
    type: DataTypes.TEXT
  },
  validUntil: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('pending', 'submitted', 'under_review', 'accepted', 'rejected'),
    defaultValue: 'pending'
  },
  submittedAt: {
    type: DataTypes.DATE
  },
  submittedById: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  modelName: 'Quotation'
});

QuotationItem.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  quotationId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false
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
  modelName: 'QuotationItem',
  timestamps: false
});

module.exports = { Quotation, QuotationItem };
