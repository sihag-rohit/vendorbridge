const express = require('express');
const router = express.Router();
const { RFQ, PurchaseOrder, Invoice, Vendor, Quotation, sequelize } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// GET /api/reports/dashboard — Dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [
      totalVendors, activeVendors,
      totalRFQs, activeRFQs, pendingApprovals,
      totalPOs, recentPOs,
      totalInvoices, recentInvoices, pendingInvoices
    ] = await Promise.all([
      Vendor.count(),
      Vendor.count({ where: { status: 'active' } }),
      RFQ.count(),
      RFQ.count({ where: { status: { [Op.in]: ['sent', 'under_comparison'] } } }),
      RFQ.count({ where: { status: 'pending_approval' } }),
      PurchaseOrder.count(),
      PurchaseOrder.findAll({
        include: [{ model: Vendor, as: 'vendor', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      Invoice.count(),
      Invoice.findAll({
        include: [{ model: Vendor, as: 'vendor', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        limit: 5
      }),
      Invoice.count({ where: { status: { [Op.in]: ['draft', 'sent'] } } })
    ]);

    res.json({
      vendors: { total: totalVendors, active: activeVendors },
      rfqs: { total: totalRFQs, active: activeRFQs, pendingApproval: pendingApprovals },
      purchaseOrders: { total: totalPOs, recent: recentPOs },
      invoices: { total: totalInvoices, recent: recentInvoices, pending: pendingInvoices }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/dashboard-stats — Flat stats used by the frontend Dashboard
router.get('/dashboard-stats', auth, async (req, res) => {
  try {
    if (req.user.role === 'vendor') {
      // Vendor-specific stats
      const vendorId = req.user.vendorId;
      const [newRfqs, submittedQuotes, activePOs, unpaidInvoices] = await Promise.all([
        RFQ.count({
          where: { status: 'sent' },
          include: [{ model: Vendor, as: 'assignedVendors', where: { id: vendorId }, attributes: [] }]
        }),
        Quotation.count({ where: { vendorId } }),
        PurchaseOrder.count({ where: { vendorId, status: { [Op.notIn]: ['cancelled'] } } }),
        Invoice.count({ where: { vendorId, status: { [Op.in]: ['draft', 'sent'] } } })
      ]);
      return res.json({ newRfqs, submittedQuotes, activePOs, unpaidInvoices });
    }

    // Admin / Officer / Manager flat stats
    const [totalVendors, activeRfqs, pendingApprovals, totalPOs, approvedRfqs] = await Promise.all([
      Vendor.count({ where: { status: 'active' } }),
      RFQ.count({ where: { status: { [Op.in]: ['draft', 'sent', 'under_comparison', 'pending_approval'] } } }),
      RFQ.count({ where: { status: 'pending_approval' } }),
      PurchaseOrder.count(),
      RFQ.count({ where: { status: 'approved' } }),
    ]);

    res.json({ totalVendors, activeRfqs, pendingApprovals, totalPOs, approvedRfqs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/spending — Monthly spend trend
router.get('/spending', auth, roleCheck('admin', 'manager', 'officer'), async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySpend = await Invoice.findAll({
      where: {
        status: { [Op.in]: ['sent', 'paid'] },
        createdAt: { [Op.gte]: sixMonthsAgo }
      },
      attributes: [
        [sequelize.fn('strftime', '%Y', sequelize.col('createdAt')), 'year'],
        [sequelize.fn('strftime', '%m', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('sum', sequelize.col('totalAmount')), 'total'],
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      group: ['year', 'month'],
      order: [['year', 'ASC'], ['month', 'ASC']],
      raw: true
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = monthlySpend.map(item => {
      const monthIndex = parseInt(item.month, 10) - 1;
      return {
        month: `${months[monthIndex]} ${item.year}`,
        amount: item.total || 0,
        count: item.count
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/vendor-performance — Vendor analytics
router.get('/vendor-performance', auth, roleCheck('admin', 'manager', 'officer'), async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      where: { status: 'active' },
      attributes: ['name', 'category', 'rating', 'totalOrders', 'onTimeDeliveries', 'quoteWins', 'totalQuotes'],
      limit: 20
    });

    const performance = vendors.map(v => ({
      name: v.name,
      category: v.category,
      rating: v.rating,
      totalOrders: v.totalOrders,
      onTimeDeliveryRate: v.totalOrders > 0 ? Math.round((v.onTimeDeliveries / v.totalOrders) * 100) : 0,
      quoteWinRate: v.totalQuotes > 0 ? Math.round((v.quoteWins / v.totalQuotes) * 100) : 0
    }));

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/category-spend — Spend by category
router.get('/category-spend', auth, roleCheck('admin', 'manager', 'officer'), async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      where: { status: { [Op.in]: ['sent', 'paid'] } },
      include: [{ model: Vendor, as: 'vendor', attributes: ['category'] }],
      attributes: ['totalAmount'],
      raw: false
    });

    // Group by vendor category in JS (SQLite-safe)
    const grouped = {};
    for (const invoice of invoices) {
      const category = invoice.vendor ? invoice.vendor.category : 'Other';
      if (!grouped[category]) grouped[category] = { category, amount: 0, count: 0 };
      grouped[category].amount += parseFloat(invoice.totalAmount) || 0;
      grouped[category].count += 1;
    }

    const formatted = Object.values(grouped).sort((a, b) => b.amount - a.amount);
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/rfq-stats — RFQ statistics
router.get('/rfq-stats', auth, roleCheck('admin', 'manager', 'officer'), async (req, res) => {
  try {
    const stats = await RFQ.findAll({
      attributes: [
        'status',
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const formatted = {};
    stats.forEach(s => { formatted[s.status] = s.count; });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
