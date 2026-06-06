import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, Building2, FileText, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

export default function PODetailPage() {
  const { user } = useAuth();
  const isVendor = user?.role === 'vendor';
  const isOfficer = user?.role === 'officer';
  const { id } = useParams();
  const navigate = useNavigate();
  const [po, setPO] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get(`/purchase-orders/${id}`)
      .then(r => setPO(r.data))
      .catch(() => { toast.error('PO not found.'); navigate('/purchase-orders'); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerateInvoice = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/invoices', { poId: id, taxRate: po.taxRate });
      toast.success('Invoice generated!');
      navigate(`/invoices/${res.data.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate invoice.';
      if (err.response?.data?.invoice) {
        toast.error('Invoice already exists for this PO.');
        navigate(`/invoices/${err.response.data.invoice.id}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      const res = await api.put(`/purchase-orders/${id}/status`, { status });
      setPO(res.data);
      toast.success('Status updated.');
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  if (loading) return <PageLoader />;
  if (!po) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/purchase-orders')} className="btn-ghost btn-sm p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-gray-500">{po.poNumber}</span>
            <StatusBadge status={po.status} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Order</h1>
        </div>
        <div className="flex gap-2">
          {po.invoice ? (
            <button onClick={() => navigate(`/invoices/${po.invoice.id}`)} className="btn-secondary text-primary-700 bg-primary-50 border-primary-200 hover:bg-primary-100">
              <Receipt className="w-4 h-4" />
              View Invoice ({po.invoice.invoiceNumber})
            </button>
          ) : isOfficer && (
            <button onClick={handleGenerateInvoice} disabled={generating} className="btn-primary">
              <Receipt className="w-4 h-4" />
              {generating ? 'Generating...' : 'Generate Invoice'}
            </button>
          )}
        </div>
      </div>

      {/* PO Header */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> {isVendor ? 'My Company' : 'Vendor'}
            </p>
            <p className="font-semibold text-gray-900">{po.vendor?.name || '—'}</p>
            {po.vendor?.email && <p className="text-sm text-gray-500">{po.vendor.email}</p>}
            {po.vendor?.phone && <p className="text-sm text-gray-500">{po.vendor.phone}</p>}
            {po.vendor?.gstNumber && <p className="text-xs text-gray-400 mt-1">GST: {po.vendor.gstNumber}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> PO Details
            </p>
            <p className="font-semibold text-gray-900">{po.poNumber}</p>
            <p className="text-sm text-gray-500">RFQ: {po.rfq?.rfqNumber || '—'}</p>
            <p className="text-sm text-gray-500">Created: {format(new Date(po.createdAt), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Delivery Date</p>
            <p className="font-semibold text-gray-900">
              {po.deliveryDate ? format(new Date(po.deliveryDate), 'MMM d, yyyy') : 'TBD'}
            </p>
            {isVendor ? (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">Update Status</p>
                <select className="input text-sm" value={po.status}
                  onChange={e => handleStatusUpdate(e.target.value)}>
                  <option value="generated" disabled>Generated</option>
                  <option value="sent" disabled>Sent</option>
                  <option value="acknowledged">Acknowledge Receipt</option>
                  <option value="in_progress">Mark In Progress</option>
                  <option value="delivered">Mark Delivered</option>
                </select>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-1">Update Status</p>
                <select className="input text-sm" value={po.status}
                  onChange={e => handleStatusUpdate(e.target.value)}>
                  <option value="generated">Generated</option>
                  <option value="sent">Sent</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="in_progress">In Progress</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary-600" /> Order Items
        </h2>
        <table className="table w-full">
          <thead>
            <tr><th>#</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
          </thead>
          <tbody>
            {po.items?.map((item, i) => (
              <tr key={i}>
                <td className="text-gray-400">{i + 1}</td>
                <td><p className="font-medium">{item.productName}</p></td>
                <td>{item.quantity} {item.unit || 'pcs'}</td>
                <td>₹{item.unitPrice?.toLocaleString()}</td>
                <td className="font-semibold">₹{item.totalPrice?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 pt-4 border-t space-y-2 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{po.subtotal?.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">GST ({po.taxRate}%)</span><span>₹{po.taxAmount?.toLocaleString()}</span></div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Total</span><span className="text-primary-600">₹{po.totalAmount?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
