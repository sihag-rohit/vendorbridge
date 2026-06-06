const sequelize = require('../config/database');
const User = require('./User');
const Vendor = require('./Vendor');
const { RFQ, RfqItem, RfqAttachment } = require('./RFQ');
const { Quotation, QuotationItem } = require('./Quotation');
const { PurchaseOrder, PoItem } = require('./PurchaseOrder');
const { Invoice, InvoiceItem } = require('./Invoice');
const ApprovalLog = require('./ApprovalLog');
const Notification = require('./Notification');
const ActivityLog = require('./ActivityLog');

// User & Vendor
Vendor.hasMany(User, { foreignKey: 'vendorId', as: 'users' });
User.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });

Vendor.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// RFQ Relations
RFQ.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
RFQ.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
RFQ.hasMany(RfqItem, { foreignKey: 'rfqId', as: 'items', onDelete: 'CASCADE' });
RfqItem.belongsTo(RFQ, { foreignKey: 'rfqId' });
RFQ.hasMany(RfqAttachment, { foreignKey: 'rfqId', as: 'attachments', onDelete: 'CASCADE' });
RfqAttachment.belongsTo(RFQ, { foreignKey: 'rfqId' });

// We need an intermediate table for RFQ <-> Vendor (assigned vendors)
const RfqVendor = sequelize.define('RfqVendor', {}, { timestamps: false });
RFQ.belongsToMany(Vendor, { through: RfqVendor, as: 'assignedVendors', foreignKey: 'rfqId' });
Vendor.belongsToMany(RFQ, { through: RfqVendor, as: 'rfqs', foreignKey: 'vendorId' });

RFQ.belongsTo(Vendor, { foreignKey: 'selectedVendorId', as: 'selectedVendor' });
RFQ.belongsTo(Quotation, { foreignKey: 'selectedQuotationId', as: 'selectedQuotation' });

// Quotation Relations
Quotation.belongsTo(RFQ, { foreignKey: 'rfqId', as: 'rfq' });
RFQ.hasMany(Quotation, { foreignKey: 'rfqId', as: 'quotations' });
Quotation.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Quotation.hasMany(QuotationItem, { foreignKey: 'quotationId', as: 'items', onDelete: 'CASCADE' });
QuotationItem.belongsTo(Quotation, { foreignKey: 'quotationId' });
Quotation.belongsTo(User, { foreignKey: 'submittedById', as: 'submittedBy' });

// Purchase Order Relations
PurchaseOrder.belongsTo(RFQ, { foreignKey: 'rfqId', as: 'rfq' });
PurchaseOrder.belongsTo(Quotation, { foreignKey: 'quotationId', as: 'quotation' });
PurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
PurchaseOrder.hasMany(PoItem, { foreignKey: 'purchaseOrderId', as: 'items', onDelete: 'CASCADE' });
PoItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId' });
PurchaseOrder.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
PurchaseOrder.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });

// Invoice Relations
Invoice.belongsTo(PurchaseOrder, { foreignKey: 'poId', as: 'po' });
PurchaseOrder.hasOne(Invoice, { foreignKey: 'poId', as: 'invoice' });
Invoice.belongsTo(RFQ, { foreignKey: 'rfqId', as: 'rfq' });
Invoice.belongsTo(Vendor, { foreignKey: 'vendorId', as: 'vendor' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'items', onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId' });
Invoice.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// Activity & Approvals
ApprovalLog.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });
ApprovalLog.belongsTo(User, { foreignKey: 'submittedById', as: 'submittedBy' });

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'User' });

module.exports = {
  sequelize,
  User,
  Vendor,
  RFQ,
  RfqItem,
  RfqAttachment,
  RfqVendor,
  Quotation,
  QuotationItem,
  PurchaseOrder,
  PoItem,
  Invoice,
  InvoiceItem,
  ApprovalLog,
  Notification,
  ActivityLog
};
