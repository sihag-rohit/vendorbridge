import { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Activity, Filter } from 'lucide-react';
import { format } from 'date-fns';

const actionColors = {
  rfq_created: 'bg-blue-100 text-blue-600',
  rfq_updated: 'bg-indigo-100 text-indigo-600',
  rfq_approved: 'bg-emerald-100 text-emerald-600',
  rfq_rejected: 'bg-red-100 text-red-600',
  quotation_submitted: 'bg-purple-100 text-purple-600',
  quotation_selected: 'bg-amber-100 text-amber-600',
  vendor_created: 'bg-teal-100 text-teal-600',
  vendor_updated: 'bg-teal-100 text-teal-600',
  invoice_generated: 'bg-violet-100 text-violet-600',
  invoice_emailed: 'bg-pink-100 text-pink-600',
  po_status_updated: 'bg-orange-100 text-orange-600',
  user_login: 'bg-gray-100 text-gray-600',
  user_registered: 'bg-green-100 text-green-600',
};

const entityTypeIcons = {
  rfq: '📋', vendor: '🏢', quotation: '💬',
  purchase_order: '📦', invoice: '🧾', user: '👤', approval: '✅'
};

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    api.get('/activity-logs', { params: entityFilter ? { entityType: entityFilter } : {} })
      .then(r => setLogs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [entityFilter]);

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">Full audit trail of all procurement actions</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="input sm:w-48" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
            <option value="">All Activities</option>
            <option value="rfq">RFQs</option>
            <option value="vendor">Vendors</option>
            <option value="quotation">Quotations</option>
            <option value="purchase_order">Purchase Orders</option>
            <option value="invoice">Invoices</option>
            <option value="user">Users</option>
            <option value="approval">Approvals</option>
          </select>
        </div>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={Activity} title="No activity logs"
          description="Actions and events will appear here as the system is used." />
      ) : (
        <div className="card divide-y divide-gray-50 p-0">
          {logs.map(log => (
            <div key={log._id} className="flex gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
              <div className="text-lg flex-shrink-0 w-8 text-center mt-0.5">
                {entityTypeIcons[log.entityType] || '📌'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`badge text-xs ${actionColors[log.action] || 'badge-gray'}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  {log.entityNumber && (
                    <span className="text-xs font-mono text-gray-500">{log.entityNumber}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{log.description}</p>
                <div className="flex items-center gap-3 mt-1">
                  {log.userId && (
                    <span className="text-xs text-gray-400">
                      👤 {log.userName || 'Unknown'} <span className="text-gray-300">·</span> {log.userRole}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    🕐 {format(new Date(log.createdAt), 'MMM d, yyyy · h:mm a')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
