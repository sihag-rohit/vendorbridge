const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class PurchaseOrder extends Model {}
class PoItem extends Model {}

PurchaseOrder.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  poNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  rfqId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  quotationId: {
    type: DataTypes.INTEGER,
    allowNull: false
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
  deliveryDate: {
    type: DataTypes.DATE
  },
  // Address flattened
  deliveryStreet: { type: DataTypes.STRING },
  deliveryCity: { type: DataTypes.STRING },
  deliveryState: { type: DataTypes.STRING },
  deliveryPincode: { type: DataTypes.STRING },
  deliveryCountry: { type: DataTypes.STRING, defaultValue: 'India' },
  
  status: {
    type: DataTypes.ENUM('generated', 'sent', 'acknowledged', 'in_progress', 'delivered', 'cancelled'),
    defaultValue: 'generated'
  },
  termsConditions: {
    type: DataTypes.TEXT
  },
  createdById: {
    type: DataTypes.INTEGER
  },
  approvedById: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  modelName: 'PurchaseOrder',
  hooks: {
    beforeCreate: async (po) => {
      if (!po.poNumber) {
        const count = await PurchaseOrder.count();
        const year = new Date().getFullYear();
        po.poNumber = `PO-${year}-${String(count + 1).padStart(5, '0')}`;
      }
    }
  }
});

PoItem.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  purchaseOrderId: {
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
  modelName: 'PoItem',
  timestamps: false
});

module.exports = { PurchaseOrder, PoItem };
