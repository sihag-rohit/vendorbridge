const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class RFQ extends Model {}
class RfqItem extends Model {}
class RfqAttachment extends Model {}

RFQ.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  rfqNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'under_comparison', 'pending_approval', 'approved', 'rejected', 'closed'),
    defaultValue: 'draft'
  },
  selectedVendorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  selectedQuotationId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  approvedById: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  approvalRemarks: {
    type: DataTypes.TEXT
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  }
}, {
  sequelize,
  modelName: 'RFQ',
  hooks: {
    beforeCreate: async (rfq) => {
      if (!rfq.rfqNumber) {
        const count = await RFQ.count();
        rfq.rfqNumber = `RFQ-${String(count + 1).padStart(5, '0')}`;
      }
    }
  }
});

RfqItem.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  rfqId: {
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
    type: DataTypes.STRING,
    defaultValue: 'pcs'
  },
  estimatedPrice: {
    type: DataTypes.FLOAT
  }
}, {
  sequelize,
  modelName: 'RfqItem',
  timestamps: false
});

RfqAttachment.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  rfqId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: DataTypes.STRING,
  url: DataTypes.STRING,
  uploadedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'RfqAttachment',
  timestamps: false
});

module.exports = { RFQ, RfqItem, RfqAttachment };
