import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Users, FileText, CheckCircle, Clock, ShoppingCart, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/ui/StatusBadge';
import { motion } from 'framer-motion';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard-stats').then(r => setStats(r.data)),
      api.get('/rfqs').then(r => setRecentRfqs(r.data.slice(0, 5)))
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-8">
      
      {/* Header */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, <span className="text-primary-600">{user.name}</span> 👋
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Here's what's happening with your procurement today.</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user.role === 'admin' || user.role === 'officer' ? (
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

      {/* Recent Activity / RFQs Table */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 card p-0 overflow-hidden border-0 shadow-lg">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="text-primary-500" /> Recent RFQs</h2>
            <Link to="/rfqs" className="text-sm font-semibold text-primary-600 hover:text-primary-800">View All →</Link>
          </div>
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
                  <motion.tr variants={itemVariants} key={rfq._id} className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = `/rfqs/${rfq._id}`}>
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
        </div>

        {/* Quick Actions (Admin/Officer) */}
        {(user.role === 'admin' || user.role === 'officer') && (
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
        )}
      </motion.div>
    </motion.div>
  );
}
