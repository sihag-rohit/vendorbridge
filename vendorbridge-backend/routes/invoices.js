const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const auth = require('../middleware/auth');
const { logActivity, createNotification } = require('../utils/helpers');
const nodemailer = require('nodemailer');

// GET /api/invoices
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    if (req.user.role === 'vendor') {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(req.user.vendorId);
      if (vendor) query.vendorId = vendor._id;
      else return res.json([]);
    }

    const invoices = await Invoice.find(query)
      .populate('vendorId', 'name email category gstNumber')
      .populate('poId', 'poNumber')
      .populate('rfqId', 'title rfqNumber')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/invoices/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('vendorId', 'name email category gstNumber phone address')
      .populate('poId', 'poNumber deliveryDate deliveryAddress')
      .populate('rfqId', 'title rfqNumber')
      .populate('createdBy', 'name email');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/invoices — generate from PO
router.post('/', auth, async (req, res) => {
  try {
    const { poId, taxRate, notes, billingAddress, paymentTerms, dueDate } = req.body;

    const po = await PurchaseOrder.findById(poId).populate('vendorId').populate('rfqId');
    if (!po) return res.status(404).json({ message: 'Purchase Order not found.' });

    // Check if invoice already exists for this PO
    const existing = await Invoice.findOne({ poId });
    if (existing) return res.status(400).json({ message: 'Invoice already generated for this PO.', invoice: existing });

    const tax = taxRate || 18;
    const subtotal = po.subtotal;
    const taxAmount = (subtotal * tax) / 100;
    const totalAmount = subtotal + taxAmount;

    const invoice = await Invoice.create({
      poId, rfqId: po.rfqId?._id, vendorId: po.vendorId._id,
      items: po.items, subtotal, taxRate: tax, taxAmount, totalAmount,
      billingAddress, paymentTerms, notes, dueDate,
      status: 'draft', createdBy: req.user._id
    });

    await logActivity({
      entityType: 'invoice', entityId: invoice._id, entityNumber: invoice.invoiceNumber,
      action: 'invoice_generated', description: `Invoice ${invoice.invoiceNumber} generated from PO ${po.poNumber}`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('vendorId', 'name email category gstNumber phone address')
      .populate('poId', 'poNumber');

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/invoices/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'paid') update.paidAt = new Date();

    const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('vendorId', 'name')
      .populate('poId', 'poNumber');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    await logActivity({
      entityType: 'invoice', entityId: invoice._id, entityNumber: invoice.invoiceNumber,
      action: 'invoice_status_updated', description: `Invoice ${invoice.invoiceNumber} status: ${status}`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/invoices/:id/send-email
router.post('/:id/send-email', auth, async (req, res) => {
  try {
    const { recipientEmail, recipientName } = req.body;
    const invoice = await Invoice.findById(req.params.id)
      .populate('vendorId', 'name email')
      .populate('poId', 'poNumber');

    if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `VendorBridge <${process.env.EMAIL_USER}>`,
      to: recipientEmail || invoice.vendorId.email,
      subject: `Invoice ${invoice.invoiceNumber} from VendorBridge`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4F46E5; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">VendorBridge</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Invoice ${invoice.invoiceNumber}</h2>
            <p>Dear ${recipientName || invoice.vendorId.name},</p>
            <p>Please find your invoice details below:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #4F46E5; color: white;">
                <th style="padding: 10px; text-align: left;">Description</th>
                <th style="padding: 10px; text-align: right;">Amount</th>
              </tr>
              ${invoice.items.map(item => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px;">${item.productName} (${item.quantity} ${item.unit || 'pcs'})</td>
                  <td style="padding: 8px; text-align: right;">₹${item.totalPrice.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr><td style="padding: 8px; font-weight: bold;">Subtotal</td><td style="padding: 8px; text-align: right;">₹${invoice.subtotal.toLocaleString()}</td></tr>
              <tr><td style="padding: 8px;">GST (${invoice.taxRate}%)</td><td style="padding: 8px; text-align: right;">₹${invoice.taxAmount.toLocaleString()}</td></tr>
              <tr style="background: #f0f0f0; font-weight: bold; font-size: 1.1em;">
                <td style="padding: 10px;">Total Amount</td>
                <td style="padding: 10px; text-align: right;">₹${invoice.totalAmount.toLocaleString()}</td>
              </tr>
            </table>
            <p style="color: #666;">Payment Terms: ${invoice.paymentTerms || 'Net 30'}</p>
          </div>
          <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>VendorBridge ERP — Procurement & Vendor Management</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    await Invoice.findByIdAndUpdate(req.params.id, { status: 'sent', emailSentAt: new Date() });

    await logActivity({
      entityType: 'invoice', entityId: invoice._id, entityNumber: invoice.invoiceNumber,
      action: 'invoice_emailed', description: `Invoice ${invoice.invoiceNumber} sent to ${recipientEmail}`,
      userId: req.user._id, userName: req.user.name, userRole: req.user.role
    });

    res.json({ message: 'Invoice sent successfully via email.' });
  } catch (error) {
    res.status(500).json({ message: `Email sending failed: ${error.message}` });
  }
});

module.exports = router;
