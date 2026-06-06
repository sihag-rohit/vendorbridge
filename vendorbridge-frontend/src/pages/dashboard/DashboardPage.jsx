import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Users, FileText, CheckCircle, Clock, ShoppingCart, DollarSign, TrendingUp, Activity, ShieldAlert, BarChart, PackageOpen } from 'lucide-react';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/ui/StatusBadge';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, subtitle, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, type: 'spring', stiffness: 100 }}
    className="card-hover relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 bg-${color}-500`} />
    <div className="flex items-center gap-4 relative z-10">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${color}-100 text-${color}-600 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <motion.h3 
          initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: delay + 0.2, type: 'spring' }}
          className="text-3xl font-bold text-gray-900 mt-1"
        >
          {value}
        </motion.h3>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  </motion.div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' } }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentRfqs, setRecentRfqs] = useState([]);
  const [spendData, setSpendData] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdminOrOfficer = user.role === 'admin' || user.role === 'officer' || user.role === 'manager';

  useEffect(() => {
    const requests = [
      api.get('/reports/dashboard-stats').then(r => setStats(r.data)),
      api.get('/rfqs').then(r => setRecentRfqs(r.data.slice(0, 5))),
    ];

    if (isAdminOrOfficer) {
      requests.push(
        api.get('/reports/spending').then(r => {
          const data = r.data;
          if (data && data.length > 0) {
            setSpendData(data.map(d => ({ name: d.month, actual: d.amount })));
          } else {
            setSpendData([]);
          }
        }).catch(() => setSpendData([])),
        api.get('/reports/vendor-performance').then(r => {
          const vendors = r.data;
          if (vendors && vendors.length > 0) {
            const avgDelivery = Math.round(vendors.reduce((s, v) => s + v.onTimeDeliveryRate, 0) / vendors.length);
            const avgWin = Math.round(vendors.reduce((s, v) => s + v.WinRate, 0) / vendors.length);
            setHealthScore({ overall: Math.round((avgDelivery + avgWin + 80) / 3), delivery: avgDelivery, approval: avgWin, compliance: 80 });
          } else {
            setHealthScore(null);
          }
        }).catch(() => setHealthScore(null))
      );
    }

    Promise.all(requests).finally(() => setLoading(false));
  }, [isAdminOrOfficer]);

  if (loading) return <PageLoader />;

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-8">
      
      <motion.div variants={itemVariants} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, <span className="text-primary-600">{user.name}</span> 👋
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Here's what's happening with your procurement today.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdminOrOfficer ? (
          <>
            <StatCard title="Active Vendors" value={stats?.totalVendors || 0} icon={Users} color="blue" delay={0.1} subtitle="Registered partners" />
            <StatCard title="Open RFQs" value={stats?.activeRfqs || 0} icon={FileText} color="indigo" delay={0.2} subtitle="Awaiting quotes" />
            <StatCard title="Pending Approvals" value={stats?.pendingApprovals || 0} icon={Clock} color="amber" delay={0.3} subtitle="Needs review" />
            <StatCard title="Total POs" value={stats?.totalPOs || 0} icon={ShoppingCart} color="emerald" delay={0.4} subtitle="Generated orders" />
          </>
        ) : user.role === 'vendor' ? (
          <>
            <StatCard title="New RFQs" value={stats?.newRfqs || 0} icon={FileText} color="blue" delay={0.1} />
            <StatCard title="Submitted Quotes" value={stats?.submittedQuotes || 0} icon={CheckCircle} color="indigo" delay={0.2} />
            <StatCard title="Active POs" value={stats?.activePOs || 0} icon={ShoppingCart} color="emerald" delay={0.3} />
            <StatCard title="Unpaid Invoices" value={stats?.unpaidInvoices || 0} icon={DollarSign} color="amber" delay={0.4} />
          </>
        ) : (
          <>
            <StatCard title="Pending Approvals" value={stats?.pendingApprovals || 0} icon={Clock} color="amber" delay={0.1} />
            <StatCard title="Approved RFQs" value={stats?.approvedRfqs || 0} icon={CheckCircle} color="emerald" delay={0.2} />
          </>
        )}
      </div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 card p-0 overflow-hidden border-0 shadow-lg">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="text-primary-500" /> Recent RFQs</h2>
            <Link to="/rfqs" className="text-sm font-semibold text-primary-600 hover:text-primary-800">View All →</Link>
          </div>
          {recentRfqs.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center text-gray-400">
              <PackageOpen className="w-12 h-12 mb-3 text-gray-200" />
              <p className="font-medium text-gray-500">No RFQs yet</p>
              <p className="text-sm mt-1 text-gray-400">
                {isAdminOrOfficer ? 'Create your first RFQ to get started.' : 'RFQs assigned to you will appear here.'}
              </p>
              {isAdminOrOfficer && (
                <Link to="/rfqs/new" className="mt-4 bg-primary-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-primary-700">Create RFQ →</Link>
              )}
            </div>
          ) : (
            <div className="table-container border-0 rounded-none">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Deadline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <motion.tbody variants={containerVariants}>
                  {recentRfqs.map((rfq) => (
                    <motion.tr variants={itemVariants} key={rfq.id} className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = `/rfqs/${rfq.id}`}>
                      <td>
                        <p className="font-semibold text-gray-900">{rfq.title}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{rfq.rfqNumber}</p>
                      </td>
                      <td>
                        <span className="text-sm font-medium">{new Date(rfq.deadline).toLocaleDateString()}</span>
                      </td>
                      <td><StatusBadge status={rfq.status} /></td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          )}
        </div>

        {isAdminOrOfficer ? (
          <div className="card border-0 shadow-lg bg-gradient-to-br from-indigo-900 to-primary-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/3 -translate-y-1/3">
              <TrendingUp size={200} />
            </div>
            <h2 className="text-xl font-bold mb-6 relative z-10">Quick Actions</h2>
            <div className="space-y-4 relative z-10">
              <Link to="/rfqs/new" className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all group backdrop-blur-sm border border-white/10">
                <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform"><FileText size={20} /></div>
                <span className="font-medium">Create New RFQ</span>
              </Link>
              <Link to="/vendors" className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all group backdrop-blur-sm border border-white/10">
                <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform"><Users size={20} /></div>
                <span className="font-medium">Add Vendor</span>
              </Link>
              <Link to="/reports" className="flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all group backdrop-blur-sm border border-white/10">
                <div className="bg-white/20 p-2 rounded-lg group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
                <span className="font-medium">View Reports</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-lg flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-indigo-50 to-primary-50">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Ready for Orders?</h3>
            <p className="text-gray-500 text-sm">Browse open RFQs and submit your best quotation to get started.</p>
            <Link to="/rfqs" className="mt-4 bg-primary-600 text-white rounded-lg px-5 py-2 text-sm font-semibold hover:bg-primary-700">Browse RFQs →</Link>
          </div>
        )}
      </motion.div>

      {isAdminOrOfficer && (
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card p-6 border-0 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart className="text-primary-500" /> Spend Trend
              </h2>
              {spendData.length > 0 && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase">Live Data</span>}
            </div>
            {spendData.length === 0 ? (
              <div className="h-[250px] flex flex-col items-center justify-center text-center text-gray-400">
                <BarChart className="w-12 h-12 mb-3 text-gray-200" />
                <p className="font-medium text-gray-500">No spending data yet</p>
                <p className="text-sm mt-1">Charts will appear once Purchase Orders & Invoices are created.</p>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip 
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Area type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card p-6 border-0 shadow-lg bg-gradient-to-b from-white to-gray-50">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
              <ShieldAlert className="text-emerald-500" /> Procurement Health
            </h2>
            {healthScore === null ? (
              <div className="flex flex-col items-center justify-center text-center py-6 text-gray-400">
                <div className="w-28 h-28 rounded-full border-8 border-gray-100 flex items-center justify-center mb-4">
                  <span className="text-4xl font-extrabold text-gray-200">--</span>
                </div>
                <p className="text-sm font-medium text-gray-500">No data yet</p>
                <p className="text-xs mt-1 text-gray-400">Score calculates once vendors complete orders.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                      <circle cx="64" cy="64" r="56" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * (healthScore.overall / 100))} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-4xl font-extrabold text-gray-900">{healthScore.overall}</span>
                      <span className="text-sm text-gray-500 block">/ 100</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium">On-time Delivery</span>
                      <span className="font-bold text-gray-900">{healthScore.delivery}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${healthScore.delivery}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium">Quote Win Rate</span>
                      <span className="font-bold text-gray-900">{healthScore.approval}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${healthScore.approval}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 font-medium">Vendor Compliance</span>
                      <span className="font-bold text-gray-900">{healthScore.compliance}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${healthScore.compliance}%` }}></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
