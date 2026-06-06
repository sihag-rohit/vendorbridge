import { useState, useEffect } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Building2, FileText } from 'lucide-react';
import { format } from 'date-fns';

function ApprovalModal({ rfq, action, onClose, onDone }) {
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (action === 'reject' && !remarks.trim()) {
      toast.error('Please provide rejection remarks.');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/approvals/${rfq._id}/${action}`, { remarks });
      toast.success(action === 'approve' ? 'RFQ approved! PO generated.' : 'RFQ rejected.');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const isApprove = action === 'approve';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-in">
        <div className={`p-6 rounded-t-2xl ${isApprove ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-3">
            {isApprove
              ? <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              : <XCircle className="w-8 h-8 text-red-600" />
            }
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isApprove ? 'Approve RFQ' : 'Reject RFQ'}
              </h3>
              <p className="text-sm text-gray-600">{rfq.rfqNumber} — {rfq.title}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {isApprove && rfq.selectedQuotation && (
            <div className="p-4 bg-gray-50 rounded-lg text-sm space-y-1">
              <p className="font-medium text-gray-700">Selected Quotation Details:</p>
              <p>Vendor: <strong>{rfq.selectedVendor?.name}</strong></p>
              <p>Total Amount: <strong>₹{rfq.selectedQuotation?.totalAmount?.toLocaleString()}</strong></p>
              <p>Delivery: <strong>{rfq.selectedQuotation?.deliveryTimeline} days</strong></p>
              <p className="text-emerald-600 font-medium">✅ PO will be auto-generated upon approval</p>
            </div>
          )}

          <div>
            <label className="label">{isApprove ? 'Approval Remarks (Optional)' : 'Rejection Reason *'}</label>
            <textarea
              className="input min-h-[80px]"
              placeholder={isApprove ? 'Add any notes or conditions...' : 'Explain why this is being rejected...'}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAction} disabled={loading}
              className={`flex-1 ${isApprove ? 'btn-success' : 'btn-danger'}`}>
              {loading ? 'Processing...' : isApprove ? '✓ Approve & Generate PO' : '✗ Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ApprovalPage() {
  const [pendingRFQs, setPendingRFQs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState(null); // { rfq, action }

  const fetchPending = async () => {
    try {
      const res = await api.get('/approvals');
      setPendingRFQs(res.data);
    } catch (err) {
      toast.error('Failed to fetch approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Workflow</h1>
          <p className="page-subtitle">{pendingRFQs.length} pending approvals</p>
        </div>
      </div>

      {pendingRFQs.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No pending approvals"
          description="All procurement requests have been reviewed. Check back later." />
      ) : (
        <div className="space-y-4">
          {pendingRFQs.map(rfq => (
            <div key={rfq._id} className="card border-l-4 border-l-amber-400">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-500">{rfq.rfqNumber}</span>
                    <StatusBadge status={rfq.status} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">{rfq.title}</h3>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Created By</p>
                      <p className="font-medium text-gray-700">{rfq.createdBy?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Selected Vendor</p>
                      <p className="font-medium text-gray-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {rfq.selectedVendor?.name || 'Not selected'}
                      </p>
                    </div>
                    {rfq.selectedQuotation && (
                      <>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Total Amount</p>
                          <p className="font-semibold text-primary-600">₹{rfq.selectedQuotation?.totalAmount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Delivery</p>
                          <p className="font-medium text-gray-700">{rfq.selectedQuotation?.deliveryTimeline} days</p>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    Submitted {format(new Date(rfq.updatedAt), 'MMM d, yyyy · h:mm a')}
                  </div>
                </div>

                <div className="flex gap-2 sm:flex-col">
                  <button
                    id={`approve-${rfq._id}`}
                    onClick={() => setModalState({ rfq, action: 'approve' })}
                    className="btn-success flex-1 sm:flex-none">
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                  <button
                    id={`reject-${rfq._id}`}
                    onClick={() => setModalState({ rfq, action: 'reject' })}
                    className="btn-danger flex-1 sm:flex-none">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalState && (
        <ApprovalModal
          rfq={modalState.rfq}
          action={modalState.action}
          onClose={() => setModalState(null)}
          onDone={fetchPending}
        />
      )}
    </div>
  );
}
