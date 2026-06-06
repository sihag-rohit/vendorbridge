import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, Filter, Plus, Mail, Phone, MapPin, Building2, ExternalLink } from 'lucide-react';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function VendorListPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { user } = useAuth();
  
  const canEdit = user.role === 'admin' || user.role === 'officer';

  useEffect(() => {
    fetchVendors();
  }, [categoryFilter]);

  const fetchVendors = async () => {
    try {
      const { data } = await api.get('/vendors', { params: categoryFilter ? { category: categoryFilter } : {} });
      setVendors(data);
    } catch (err) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) || 
    v.email.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(vendors.map(v => v.category))];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">Vendor Directory</h1>
          <p className="page-subtitle text-lg">Manage your trusted supply chain partners</p>
        </div>
        {canEdit && (
          <button className="btn-primary shadow-lg shadow-primary-500/30 hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" /> Add Vendor
          </button>
        )}
      </div>

      <div className="card glass-morphism flex flex-col sm:flex-row gap-4 justify-between sticky top-4 z-10 shadow-xl border-white/40">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search vendors by name or email..." 
            className="input !pl-10 border-0 bg-white/50 focus:bg-white transition-colors shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select 
            className="input w-auto min-w-[180px] border-0 bg-white/50 focus:bg-white cursor-pointer shadow-inner"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {filteredVendors.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <EmptyState 
            icon={Building2} 
            title="No vendors found" 
            description="Adjust your search filters or add a new vendor."
          />
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredVendors.map((vendor) => (
            <motion.div variants={itemVariants} key={vendor._id} className="card p-0 overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-transparent hover:border-primary-200 group">
              <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                <div className="absolute -bottom-6 left-6">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center border-2 border-white text-2xl font-bold text-primary-600 transform group-hover:-translate-y-2 transition-transform duration-300">
                    {vendor.name.charAt(0)}
                  </div>
                </div>
                <div className="absolute top-4 right-4"><StatusBadge status={vendor.status} /></div>
              </div>
              
              <div className="p-6 pt-10">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{vendor.name}</h3>
                <p className="text-sm font-medium text-primary-600 mb-4">{vendor.category}</p>
                
                <div className="space-y-2.5 text-sm text-gray-600">
                  <div className="flex items-center gap-3 hover:text-gray-900 transition-colors"><Mail className="w-4 h-4 text-gray-400" /> <span className="truncate">{vendor.email}</span></div>
                  <div className="flex items-center gap-3 hover:text-gray-900 transition-colors"><Phone className="w-4 h-4 text-gray-400" /> <span>{vendor.phone}</span></div>
                  {vendor.address && <div className="flex items-start gap-3 hover:text-gray-900 transition-colors"><MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" /> <span className="line-clamp-2">{vendor.address}</span></div>}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center group-hover:bg-primary-50 transition-colors">
                <div className="text-sm font-semibold">
                  ⭐ {vendor.performanceMetrics?.rating?.toFixed(1) || 'New'}
                </div>
                <button className="btn-ghost btn-sm text-primary-600 font-semibold group-hover:bg-white group-hover:shadow-sm">
                  View Profile <ExternalLink className="w-3 h-3 ml-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
