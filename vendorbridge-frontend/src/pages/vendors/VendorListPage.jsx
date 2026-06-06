import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, Filter, Plus, Mail, Phone, MapPin, Building2, ExternalLink, X, FileText, Activity } from 'lucide-react';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { calculateVendorRisk } from '../../services/aiService';

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
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', category: 'IT & Software', contactPerson: '', email: '', phone: '',
    gstNumber: '', addressStreet: '', addressCity: '', notes: ''
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  
  const canEdit = user.role === 'admin' || user.role === 'officer';

  useEffect(() => {
    fetchVendors();
  }, [categoryFilter]);

  async function fetchVendors() {
    try {
      const { data } = await api.get('/vendors', { params: categoryFilter ? { category: categoryFilter } : {} });
      setVendors(data);
    } catch (err) {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/vendors', addForm);
      toast.success('Vendor added successfully!');
      setIsAddModalOpen(false);
      setAddForm({ name: '', category: 'IT & Software', contactPerson: '', email: '', phone: '', gstNumber: '', addressStreet: '', addressCity: '', notes: '' });
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/vendors/${editForm.id}`, editForm);
      toast.success('Vendor updated successfully!');
      setIsEditModalOpen(false);
      setEditForm(null);
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update vendor.');
    } finally {
      setSubmitting(false);
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
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary shadow-lg shadow-primary-500/30 hover:scale-105 transition-transform"
          >
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
          {filteredVendors.map((vendor) => {
            const risk = calculateVendorRisk(vendor);
            return (
              <motion.div variants={itemVariants} key={vendor.id} className="card p-0 overflow-hidden hover:shadow-2xl transition-shadow duration-300 border border-transparent hover:border-primary-200 group">
                <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                  <div className="absolute -bottom-6 left-6">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center border-2 border-white text-2xl font-bold text-primary-600 transform group-hover:-translate-y-2 transition-transform duration-300">
                      {vendor.name.charAt(0)}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    <StatusBadge status={vendor.status} />
                    <span className={`badge badge-${risk.color} font-bold shadow-md`}>Risk: {risk.level}</span>
                  </div>
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
                <button 
                  onClick={() => setSelectedVendor(vendor)}
                  className="btn-ghost btn-sm text-primary-600 font-semibold group-hover:bg-white group-hover:shadow-sm"
                >
                  View Profile <ExternalLink className="w-3 h-3 ml-1" />
                </button>
              </div>
            </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* View Profile Modal */}
      <AnimatePresence>
        {selectedVendor && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-primary-50 to-indigo-50">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-2xl font-bold text-primary-600">
                    {selectedVendor.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedVendor.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary-600 font-medium bg-white px-3 py-1 rounded-full text-xs shadow-sm">
                        {selectedVendor.category}
                      </span>
                      <StatusBadge status={selectedVendor.status} />
                      <span className={`badge badge-${calculateVendorRisk(selectedVendor).color} shadow-sm font-bold`}>
                        Risk: {calculateVendorRisk(selectedVendor).level}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedVendor(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Contact Information
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Contact Person</span>
                        <span className="font-medium">{selectedVendor.contactPerson || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Email Address</span>
                        <span className="font-medium text-primary-600">{selectedVendor.email}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Phone Number</span>
                        <span className="font-medium">{selectedVendor.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Business Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Business Details
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">GST/Tax Number</span>
                        <span className="font-medium font-mono">{selectedVendor.gstNumber || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Address</span>
                        <span className="font-medium text-sm">{selectedVendor.address || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Performance Metrics
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-2xl text-center border border-indigo-100">
                      <div className="text-indigo-600 font-bold text-2xl mb-1">
                        ⭐ {selectedVendor.performanceMetrics?.rating?.toFixed(1) || '0.0'}
                      </div>
                      <div className="text-xs text-indigo-800 font-medium">Overall Rating</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl text-center border border-emerald-100">
                      <div className="text-emerald-600 font-bold text-2xl mb-1">
                        {selectedVendor.performanceMetrics?.onTimeDeliveryRate || 0}%
                      </div>
                      <div className="text-xs text-emerald-800 font-medium">On-Time Delivery</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-2xl text-center border border-blue-100">
                      <div className="text-blue-600 font-bold text-2xl mb-1">
                        {selectedVendor.performanceMetrics?.qualityScore || 0}%
                      </div>
                      <div className="text-xs text-blue-800 font-medium">Quality Score</div>
                    </div>
                  </div>
                </div>

                {selectedVendor.notes && (
                  <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100">
                    <h4 className="text-xs font-bold text-yellow-800 uppercase mb-1">Internal Notes</h4>
                    <p className="text-sm text-yellow-900">{selectedVendor.notes}</p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button onClick={() => setSelectedVendor(null)} className="btn-secondary">Close</button>
                {canEdit && (
                  <button 
                    onClick={() => {
                      setEditForm(selectedVendor);
                      setIsEditModalOpen(true);
                      setSelectedVendor(null);
                    }}
                    className="btn-primary"
                  >
                    Edit Vendor
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Vendor Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-primary-50 to-indigo-50">
                <h2 className="text-xl font-bold text-gray-900">Add New Vendor</h2>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Company Name *</label>
                      <input className="input" required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="Acme Corp" />
                    </div>
                    <div>
                      <label className="label">Category *</label>
                      <select className="input" value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}>
                        {['IT & Software', 'Office Supplies', 'Raw Materials', 'Logistics', 'Consulting', 'Manufacturing', 'Construction', 'Healthcare', 'Food & Beverage', 'Other'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Contact Person *</label>
                      <input className="input" required value={addForm.contactPerson} onChange={e => setAddForm({...addForm, contactPerson: e.target.value})} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="label">Email Address *</label>
                      <input type="email" className="input" required value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} placeholder="john@acme.com" />
                    </div>
                    <div>
                      <label className="label">Phone Number *</label>
                      <input className="input" required value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} placeholder="+91 9876543210" />
                    </div>
                    <div>
                      <label className="label">GST Number</label>
                      <input className="input" value={addForm.gstNumber} onChange={e => setAddForm({...addForm, gstNumber: e.target.value})} placeholder="Optional" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Address Details</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input className="input" value={addForm.addressStreet} onChange={e => setAddForm({...addForm, addressStreet: e.target.value})} placeholder="Street Address" />
                        <input className="input" value={addForm.addressCity} onChange={e => setAddForm({...addForm, addressCity: e.target.value})} placeholder="City" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Internal Notes</label>
                      <textarea className="input min-h-[80px]" value={addForm.notes} onChange={e => setAddForm({...addForm, notes: e.target.value})} placeholder="Any additional details..." />
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Adding...' : 'Add Vendor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Edit Vendor Modal */}
      <AnimatePresence>
        {isEditModalOpen && editForm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-primary-50 to-indigo-50">
                <h2 className="text-xl font-bold text-gray-900">Edit Vendor</h2>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Company Name *</label>
                      <input className="input" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Acme Corp" />
                    </div>
                    <div>
                      <label className="label">Category *</label>
                      <select className="input" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                        {['IT & Software', 'Office Supplies', 'Raw Materials', 'Logistics', 'Consulting', 'Manufacturing', 'Construction', 'Healthcare', 'Food & Beverage', 'Other'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Contact Person *</label>
                      <input className="input" required value={editForm.contactPerson} onChange={e => setEditForm({...editForm, contactPerson: e.target.value})} placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="label">Email Address *</label>
                      <input type="email" className="input" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="john@acme.com" />
                    </div>
                    <div>
                      <label className="label">Phone Number *</label>
                      <input className="input" required value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="+91 9876543210" />
                    </div>
                    <div>
                      <label className="label">GST Number</label>
                      <input className="input" value={editForm.gstNumber || ''} onChange={e => setEditForm({...editForm, gstNumber: e.target.value})} placeholder="Optional" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Address Details</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input className="input" value={editForm.addressStreet || ''} onChange={e => setEditForm({...editForm, addressStreet: e.target.value})} placeholder="Street Address" />
                        <input className="input" value={editForm.addressCity || ''} onChange={e => setEditForm({...editForm, addressCity: e.target.value})} placeholder="City" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select className="input" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Internal Notes</label>
                      <textarea className="input min-h-[80px]" value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} placeholder="Any additional details..." />
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
