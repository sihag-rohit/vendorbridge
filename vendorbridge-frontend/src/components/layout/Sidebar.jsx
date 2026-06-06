import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, FileText, CheckSquare, 
  ShoppingCart, Receipt, Activity, BarChart2, LogOut, ClipboardList
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'officer', 'vendor', 'manager'] },
  { name: 'Vendors', path: '/vendors', icon: Users, roles: ['admin'] },
  { name: 'RFQs', path: '/rfqs', icon: FileText, roles: ['officer', 'vendor'] },
  { name: 'Quotations', path: '/quotations', icon: ClipboardList, roles: ['officer', 'vendor'] },
  { name: 'Approvals', path: '/approvals', icon: CheckSquare, roles: ['manager'] },
  { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart, roles: ['officer', 'vendor'] },
  { name: 'Invoices', path: '/invoices', icon: Receipt, roles: ['officer', 'vendor'] },
  { name: 'Reports', path: '/reports', icon: BarChart2, roles: ['admin', 'manager'] },
  { name: 'Activity Log', path: '/activity-logs', icon: Activity, roles: ['admin'] },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-slate-900 border-r border-white/10 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center h-20 px-8 bg-black/20 border-b border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600 rounded-full blur-[60px] opacity-20 -mt-10 -mr-10"></div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white relative z-10 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-sm">VB</span>
            VendorBridge
          </h1>
        </div>

        <div className="p-4">
          <div className="mb-6 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Logged in as</p>
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-primary-400 font-medium capitalize mt-0.5">{user?.role.replace('_', ' ')}</p>
          </div>

          <nav className="space-y-1.5">
            {filteredNav.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`sidebar-link relative group ${isActive ? 'active' : ''}`}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-primary-300 scale-110' : 'text-gray-400 group-hover:scale-110'}`} />
                  <span className="font-medium tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Decorative bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent pointer-events-none z-0"></div>
        
        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all border border-white/5 hover:border-red-500/30 font-medium tracking-wide group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
