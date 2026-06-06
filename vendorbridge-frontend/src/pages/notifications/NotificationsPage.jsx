import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const typeIcons = {
  rfq_sent: '📋',
  rfq_created: '📝',
  quotation_submitted: '💬',
  quotation_accepted: '✅',
  quotation_rejected: '❌',
  approval_requested: '⏳',
  approved: '✅',
  rejected: '❌',
  po_generated: '📦',
  invoice_generated: '🧾',
  invoice_paid: '💰',
  general: '🔔',
};

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead, unreadCount } = useNotifications();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = async (notif) => {
    if (!notif.isRead) await markRead(notif.id);
    if (notif.entityType === 'rfq') navigate(`/rfqs/${notif.entityId}`);
    else if (notif.entityType === 'purchase_order') navigate(`/purchase-orders/${notif.entityId}`);
    else if (notif.entityType === 'invoice') navigate(`/invoices/${notif.entityId}`);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications"
          description="You'll see procurement updates, approvals, and alerts here." />
      ) : (
        <div className="card p-0 divide-y divide-gray-50">
          {notifications.map(notif => (
            <button key={notif.id} onClick={() => handleClick(notif)}
              className={`w-full text-left px-5 py-4 hover:bg-gray-50/80 transition-colors flex gap-4 ${!notif.isRead ? 'bg-primary-50/30' : ''}`}>
              <div className="text-2xl flex-shrink-0 mt-0.5">{typeIcons[notif.type] || '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notif.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full" />}
                    <p className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                {notif.entityNumber && (
                  <p className="text-xs text-primary-600 mt-1 font-medium">{notif.entityNumber}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
