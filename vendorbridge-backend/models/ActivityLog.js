const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class ActivityLog extends Model {}

ActivityLog.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  entityType: {
    type: DataTypes.ENUM('rfq', 'vendor', 'quotation', 'purchase_order', 'invoice', 'user', 'approval'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER
  },
  entityNumber: {
    type: DataTypes.STRING
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER
  },
  userName: {
    type: DataTypes.STRING
  },
  userRole: {
    type: DataTypes.STRING
  },
  metadata: {
    type: DataTypes.JSON // For arbitrary mixed data
  },
  ipAddress: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: 'ActivityLog',
  indexes: [
    { fields: ['entityType', 'entityId'] },
    { fields: ['userId'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = ActivityLog;
