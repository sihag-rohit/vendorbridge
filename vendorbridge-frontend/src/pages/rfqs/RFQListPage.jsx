import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { FileText, Plus, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function RFQListPage() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useAuth();

  const canCreate = user.role === 'admin' || user.role === 'officer';

  useEffect(() => {
    fetchRFQs();
  }, [statusFilter]);

  async function fetchRFQs() {
    try {
      const { data } = await api.get('/rfqs', { params: statusFilter ? { status: statusFilter } : {} });
      setRfqs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredRfqs = rfqs.filter(rfq => 
    rfq.title.toLowerCase().includes(search.toLowerCase()) || 
    rfq.rfqNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Requests for Quotation (RFQs)</h1>
          <p className="page-subtitle">Manage and track your procurement requests</p>
        </div>
        {canCreate && (
          <Link to="/rfqs/new" className="btn-primary">
            <Plus className="w-5 h-5" /> Create RFQ
          </Link>
        )}
      </div>

      <div className="card bg-white/60 backdrop-blur-md border border-white/20 shadow-sm flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search RFQs..." 
            className="input !pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select 
            className="input w-auto min-w-[150px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
            <option value="awarded">Awarded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filteredRfqs.length === 0 ? (
        <EmptyState 
          icon={FileText} 
          title="No RFQs found" 
          description={search || statusFilter ? "Try adjusting your search filters." : "Get started by creating a new RFQ."}
        />
      ) : (
        <div className="card p-0 overflow-hidden shadow-xl border-0">
          <div className="table-container border-0 rounded-none">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>RFQ Reference</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                {filteredRfqs.map((rfq) => (
                  <motion.tr variants={itemVariants} key={rfq.id} className="cursor-pointer hover:bg-primary-50/50 transition-colors" onClick={() => window.location.href = `/rfqs/${rfq.id}`}>
                    <td>
                      <div className="font-semibold text-gray-900">{rfq.title}</div>
                      <div className="text-xs font-mono text-primary-600 mt-1">{rfq.rfqNumber}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        rfq.priority === 'high' ? 'badge-red' : 
                        rfq.priority === 'medium' ? 'badge-yellow' : 'badge-green'
                      } uppercase`}>
                        {rfq.priority}
                      </span>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-gray-900">{new Date(rfq.deadline).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(rfq.deadline) > new Date() ? 
                          `${formatDistanceToNow(new Date(rfq.deadline))} left` : 
                          'Expired'}
                      </div>
                    </td>
                    <td><StatusBadge status={rfq.status} /></td>
                    <td>
                      <Link to={`/rfqs/${rfq.id}`} className="text-primary-600 font-semibold hover:text-primary-800 text-sm" onClick={e => e.stopPropagation()}>
                        View Details →
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
