import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Menu, X, Check, ExternalLink, ChevronRight, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const notifTypeColors = {
  rfq_created: 'bg-blue-100 text-blue-600',
  rfq_sent: 'bg-indigo-100 text-indigo-600',
  quotation_submitted: 'bg-emerald-100 text-emerald-600',
  quotation_accepted: 'bg-green-100 text-green-600',
  quotation_rejected: 'bg-red-100 text-red-600',
  approval_requested: 'bg-amber-100 text-amber-600',
  approved: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  po_generated: 'bg-purple-100 text-purple-600',
  invoice_generated: 'bg-teal-100 text-teal-600',
  general: 'bg-gray-100 text-gray-600',
};

export default function Navbar({ onMenuClick, sidebarOpen }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifsRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) await markRead(notif.id);
    setShowNotifs(false);
    if (notif.entityType === 'rfq') navigate(`/rfqs/${notif.entityId}`);
    else if (notif.entityType === 'purchase_order') navigate(`/purchase-orders/${notif.entityId}`);
    else if (notif.entityType === 'invoice') navigate(`/invoices/${notif.entityId}`);
  };

  const recentNotifs = notifications.slice(0, 8);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-50">
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="hidden sm:block">
          <p className="text-xs text-gray-400">Procurement</p>
          <h2 className="text-sm font-semibold text-gray-800">VendorBridge ERP</h2>
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            id="notifications-btn"
            onClick={() => setShowNotifs(v => !v)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-bounce-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slide-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                  <Link to="/notifications" onClick={() => setShowNotifs(false)} className="text-xs text-gray-500 hover:text-gray-700">
                    View all
                  </Link>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {recentNotifs.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No notifications yet
                  </div>
                ) : (
                  recentNotifs.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${!notif.isRead ? 'bg-primary-50/50' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.isRead ? 'bg-primary-500' : 'bg-gray-200'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfile(v => !v)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-gray-800 leading-none">{user?.name}</p>
              <p className="text-xs text-primary-600 font-medium capitalize mt-1">{user?.role?.replace('_', ' ')}</p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slide-in">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-primary-100 text-primary-700 text-xs font-semibold capitalize">
                  {user?.role?.replace('_', ' ')}
                </div>
              </div>
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Account
                </div>
                <Link to="/profile" onClick={() => setShowProfile(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <UserIcon className="w-4 h-4 text-gray-500" /> My Profile
                </Link>
                <button 
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                    navigate('/login');
                  }} 
                  className="w-full flex items-center gap-2 px-3 py-2 mt-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
