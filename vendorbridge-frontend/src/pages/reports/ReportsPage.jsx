import { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.name.toLowerCase().includes('amount') ? `₹${p.value?.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const [spending, setSpending] = useState([]);
  const [vendorPerf, setVendorPerf] = useState([]);
  const [categorySpend, setCategorySpend] = useState([]);
  const [rfqStats, setRfqStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/spending'),
      api.get('/reports/vendor-performance'),
      api.get('/reports/category-spend'),
      api.get('/reports/rfq-stats')
    ]).then(([s, v, c, r]) => {
      setSpending(s.data);
      setVendorPerf(v.data);
      setCategorySpend(c.data);
      setRfqStats(r.data);
    }).catch(err => toast.error('Failed to load reports.'))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = (data, filename) => {
    if (!data.length) { toast.error('No data to export.'); return; }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename}.csv downloaded!`);
  };

  const rfqStatusData = Object.entries(rfqStats).map(([status, count]) => ({
    name: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: count
  }));

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Procurement insights and trends</p>
        </div>
        <button onClick={() => exportCSV(spending, 'monthly-spending')} className="btn-secondary">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Monthly Spend Trend */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Monthly Procurement Spend</h2>
            <p className="text-sm text-gray-500">Last 6 months trend</p>
          </div>
          <TrendingUp className="w-5 h-5 text-primary-500" />
        </div>
        {spending.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={spending}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="amount" name="Amount (₹)" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-gray-400">
            <p>No spending data available yet</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFQ Status Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-gray-900">RFQ Status Distribution</h2>
            <BarChart3 className="w-5 h-5 text-primary-500" />
          </div>
          {rfqStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={rfqStatusData} cx="50%" cy="50%" innerRadius={60}
                  outerRadius={90} paddingAngle={3} dataKey="value">
                  {rfqStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">No RFQ data</div>
          )}
        </div>

        {/* Category Spend */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-gray-900">Spend by Category</h2>
            <button onClick={() => exportCSV(categorySpend, 'category-spend')} className="btn-ghost btn-sm">
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          {categorySpend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categorySpend} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Amount (₹)" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">No category data</div>
          )}
        </div>
      </div>

      {/* Vendor Performance */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Vendor Performance</h2>
            <p className="text-sm text-gray-500">On-time delivery & quote win rates</p>
          </div>
          <button onClick={() => exportCSV(vendorPerf, 'vendor-performance')} className="btn-secondary btn-sm">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {vendorPerf.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={vendorPerf.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '...' : v} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="onTimeDeliveryRate" name="On-Time Delivery (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="quoteWinRate" name="Quote Win Rate (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Vendor Performance Table */}
            <div className="mt-6 overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr><th>Vendor</th><th>Category</th><th>Orders</th><th>On-Time %</th><th>Win Rate %</th><th>Rating</th></tr>
                </thead>
                <tbody>
                  {vendorPerf.map(v => (
                    <tr key={v.name}>
                      <td className="font-medium">{v.name}</td>
                      <td>{v.category}</td>
                      <td>{v.totalOrders}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${v.onTimeDeliveryRate}%` }} />
                          </div>
                          <span className="text-xs font-medium">{v.onTimeDeliveryRate}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${v.quoteWinRate}%` }} />
                          </div>
                          <span className="text-xs font-medium">{v.quoteWinRate}%</span>
                        </div>
                      </td>
                      <td>
                        <span className="font-semibold text-amber-600">{v.rating?.toFixed(1)}</span>
                        <span className="text-gray-400 text-xs">/5</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400">
            No vendor performance data available yet
          </div>
        )}
      </div>
    </div>
  );
}
