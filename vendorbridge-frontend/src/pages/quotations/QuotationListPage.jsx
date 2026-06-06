import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function QuotationListPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/quotations')
      .then(r => setQuotations(r.data))
      .catch(() => toast.error('Failed to fetch quotations.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">{quotations.length} total quotations</p>
        </div>
      </div>

      {quotations.length === 0 ? (
        <EmptyState icon={FileText} title="No quotations"
          description="Quotations will appear here once submitted." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>RFQ Number</th>
                  <th>Vendor</th>
                  <th>Total Amount</th>
                  <th>Delivery</th>
                  <th>Submitted</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(quote => (
                  <tr key={quote.id}>
                    <td><span className="font-mono font-medium text-primary-700">{quote.rfq?.rfqNumber || '—'}</span></td>
                    <td>
                      <p className="font-medium text-sm">{quote.vendor?.name || '—'}</p>
                    </td>
                    <td><span className="font-semibold">₹{quote.totalAmount?.toLocaleString()}</span></td>
                    <td><span className="text-sm">{quote.deliveryTimeline} Days</span></td>
                    <td><span className="text-sm">{format(new Date(quote.createdAt), 'MMM d, yyyy')}</span></td>
                    <td><StatusBadge status={quote.status} /></td>
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
