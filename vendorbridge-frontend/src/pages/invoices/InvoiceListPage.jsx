import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Receipt, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get('/invoices', { params: statusFilter ? { status: statusFilter } : {} })
      .then(r => setInvoices(r.data))
      .catch(() => toast.error('Failed to fetch invoices.'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} total invoices</p>
        </div>
      </div>

      <div className="card">
        <select className="input sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={Receipt} title="No invoices"
          description="Invoices are generated from approved purchase orders." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td><span className="font-mono font-medium text-primary-700">{inv.invoiceNumber}</span></td>
                    <td><span className="text-sm text-gray-600">{inv.po?.poNumber || '—'}</span></td>
                    <td>
                      <p className="font-medium text-sm">{inv.vendor?.name || '—'}</p>
                      <p className="text-xs text-gray-400">{inv.vendor?.category || ''}</p>
                    </td>
                    <td><span className="font-semibold">₹{inv.totalAmount?.toLocaleString()}</span></td>
                    <td><span className="text-sm">{format(new Date(inv.createdAt), 'MMM d, yyyy')}</span></td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <Link to={`/invoices/${inv.id}`}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 inline-flex">
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
