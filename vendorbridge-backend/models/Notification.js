const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Notification extends Model {}

Notification.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('rfq_created', 'rfq_sent', 'rfq_closed', 'quotation_submitted', 'quotation_accepted', 'quotation_rejected', 'approval_requested', 'approved', 'rejected', 'po_generated', 'invoice_generated', 'invoice_paid', 'general'),
    defaultValue: 'general'
  },
  entityType: {
    type: DataTypes.STRING
  },
  entityId: {
    type: DataTypes.INTEGER
  },
  entityNumber: {
    type: DataTypes.STRING
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  modelName: 'Notification',
  indexes: [
    { fields: ['userId', 'isRead'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Notification;
