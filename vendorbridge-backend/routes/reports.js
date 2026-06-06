const express = require('express');
const router = express.Router();
const RFQ = require('../models/RFQ');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const Vendor = require('../models/Vendor');
const Quotation = require('../models/Quotation');
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
      Vendor.countDocuments(),
      Vendor.countDocuments({ status: 'active' }),
      RFQ.countDocuments(),
      RFQ.countDocuments({ status: { $in: ['sent', 'under_comparison'] } }),
      RFQ.countDocuments({ status: 'pending_approval' }),
      PurchaseOrder.countDocuments(),
      PurchaseOrder.find().populate('vendorId', 'name').sort({ createdAt: -1 }).limit(5),
      Invoice.countDocuments(),
      Invoice.find().populate('vendorId', 'name').sort({ createdAt: -1 }).limit(5),
      Invoice.countDocuments({ status: { $in: ['draft', 'sent'] } })
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

// GET /api/reports/spending — Monthly spend trend
router.get('/spending', auth, roleCheck('admin', 'manager', 'officer'), async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySpend = await Invoice.aggregate([
      { $match: { status: { $in: ['sent', 'paid'] }, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = monthlySpend.map(item => ({
      month: `${months[item._id.month - 1]} ${item._id.year}`,
      amount: item.total,
      count: item.count
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/vendor-performance — Vendor analytics
router.get('/vendor-performance', auth, roleCheck('admin', 'manager', 'officer'), async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: 'active' })
      .select('name category rating totalOrders onTimeDeliveries quoteWins totalQuotes')
      .limit(20);

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
    const spendByCategory = await Invoice.aggregate([
      { $match: { status: { $in: ['sent', 'paid'] } } },
      {
        $lookup: {
          from: 'vendors', localField: 'vendorId', foreignField: '_id', as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $group: {
          _id: '$vendor.category',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const formatted = spendByCategory.map(item => ({
      category: item._id,
      amount: item.total,
      count: item.count
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/reports/rfq-stats — RFQ statistics
router.get('/rfq-stats', auth, roleCheck('admin', 'manager', 'officer'), async (req, res) => {
  try {
    const stats = await RFQ.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formatted = {};
    stats.forEach(s => { formatted[s._id] = s.count; });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
