import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import { PriorityBadge } from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, Building2, GitCompareArrows, Package, User, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function RFQDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [rfqRes, quotRes, logRes] = await Promise.all([
          api.get(`/rfqs/${id}`),
          api.get('/quotations', { params: { rfqId: id } }),
          api.get(`/activity-logs/entity/${id}`)
        ]);
        setRfq(rfqRes.data);
        setQuotations(quotRes.data);
        setActivityLogs(logRes.data);
      } catch (err) {
        toast.error('Failed to load RFQ details.');
        navigate('/rfqs');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return <PageLoader />;
  if (!rfq) return null;

  const canCompare = ['under_comparison', 'pending_approval', 'approved', 'rejected'].includes(rfq.status);
  const canSubmitQuote = user?.role === 'vendor' && rfq.status === 'sent';

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/rfqs')} className="btn-ghost btn-sm p-2 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-mono text-gray-500">{rfq.rfqNumber}</span>
            <StatusBadge status={rfq.status} />
            <PriorityBadge priority={rfq.priority} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{rfq.title}</h1>
          {rfq.description && <p className="text-gray-500 mt-1">{rfq.description}</p>}
        </div>

        {canCompare && (user?.role !== 'vendor') && (
          <Link to={`/rfqs/${id}/compare`} className="btn-primary">
            <GitCompareArrows className="w-4 h-4" /> Compare Quotes
          </Link>
        )}
        {canSubmitQuote && (
          <Link to={`/quotations/submit/${id}`} className="btn-primary">
            Submit Quotation
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Deadline</span>
              </div>
              <p className={`font-semibold ${new Date(rfq.deadline) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                {format(new Date(rfq.deadline), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Assigned Vendors</span>
              </div>
              <p className="font-semibold text-gray-900">{rfq.assignedVendors?.length || 0} vendors</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Quotations Received</span>
              </div>
              <p className="font-semibold text-gray-900">{quotations.length}</p>
            </div>
            <div className="card">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <User className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Created By</span>
              </div>
              <p className="font-semibold text-gray-900">{rfq.createdBy?.name}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-600" /> Requested Items
            </h2>
            <table className="table w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product / Service</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Est. Price</th>
                </tr>
              </thead>
              <tbody>
                {rfq.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="text-gray-400">{i + 1}</td>
                    <td>
                      <p className="font-medium">{item.productName}</p>
                      {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>{item.estimatedPrice ? `₹${Number(item.estimatedPrice).toLocaleString()}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Approval Info */}
          {rfq.approvalRemarks && (
            <div className={`card border-l-4 ${rfq.status === 'approved' ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                {rfq.status === 'approved' ? '✅ Approval' : '❌ Rejection'} Remarks
              </p>
              <p className="text-sm text-gray-600">{rfq.approvalRemarks}</p>
              {rfq.approvedBy && (
                <p className="text-xs text-gray-400 mt-2">By {rfq.approvedBy.name} · {rfq.approvedAt && format(new Date(rfq.approvedAt), 'MMM d, yyyy')}</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Vendors + Timeline */}
        <div className="space-y-6">
          {/* Assigned Vendors */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Assigned Vendors</h3>
            <div className="space-y-2">
              {rfq.assignedVendors?.map(v => {
                const hasQuote = quotations.find(q => q.vendorId?._id === v._id);
                return (
                  <div key={v._id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xs font-semibold">
                      {v.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{v.name}</p>
                      <p className="text-xs text-gray-400">{v.category}</p>
                    </div>
                    {hasQuote && <span className="badge-green badge text-xs">Quoted</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Timeline */}
          {activityLogs.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-600" /> Activity Timeline
              </h3>
              <div className="space-y-4">
                {activityLogs.slice(0, 8).map(log => (
                  <div key={log._id} className="timeline-item">
                    <div className="timeline-dot bg-primary-100 text-primary-600">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{log.description}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-xs text-gray-400">{log.userName}</p>
                        <span className="text-gray-300">·</span>
                        <p className="text-xs text-gray-400">
                          {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
