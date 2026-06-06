const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ApprovalLog extends Model {}

ApprovalLog.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  entityType: {
    type: DataTypes.ENUM('rfq', 'purchase_order', 'invoice'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  entityModel: {
    type: DataTypes.ENUM('RFQ', 'PurchaseOrder', 'Invoice')
  },
  entityNumber: {
    type: DataTypes.STRING
  },
  action: {
    type: DataTypes.ENUM('submitted_for_approval', 'approved', 'rejected', 'resubmitted'),
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT
  },
  approverId: {
    type: DataTypes.INTEGER
  },
  submittedById: {
    type: DataTypes.INTEGER
  }
}, {
  sequelize,
  modelName: 'ApprovalLog'
});

module.exports = ApprovalLog;
