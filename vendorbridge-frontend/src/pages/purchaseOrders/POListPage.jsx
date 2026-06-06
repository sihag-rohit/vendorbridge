import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { ShoppingCart, Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function POListPage() {
  const [pos, setPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get('/purchase-orders', { params: statusFilter ? { status: statusFilter } : {} })
      .then(r => setPOs(r.data))
      .catch(() => toast.error('Failed to fetch purchase orders.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{pos.length} total purchase orders</p>
        </div>
      </div>

      <div className="card">
        <select className="input sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="generated">Generated</option>
          <option value="sent">Sent</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in_progress">In Progress</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {pos.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No purchase orders"
          description="Purchase orders are auto-generated when RFQs are approved." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>RFQ</th>
                  <th>Vendor</th>
                  <th>Total Amount</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pos.map(po => (
                  <tr key={po.id}>
                    <td><span className="font-mono font-medium text-primary-700">{po.poNumber}</span></td>
                    <td><span className="text-sm text-gray-600">{po.rfq?.rfqNumber || '—'}</span></td>
                    <td>
                      <p className="font-medium text-sm">{po.vendor?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{po.vendor?.category || ''}</p>
                    </td>
                    <td><span className="font-semibold">₹{po.totalAmount?.toLocaleString()}</span></td>
                    <td>
                      <span className="text-sm">
                        {po.deliveryDate ? format(new Date(po.deliveryDate), 'MMM d, yyyy') : '—'}
                      </span>
                    </td>
                    <td><StatusBadge status={po.status} /></td>
                    <td>
                      <Link to={`/purchase-orders/${po.id}`}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 inline-flex" title="View">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
