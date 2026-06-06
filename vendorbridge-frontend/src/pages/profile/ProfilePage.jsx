import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Building2, Phone, Hash, MapPin, Save, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', 
    phone: '', vendorCategory: '', gstNumber: '', address: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        phone: user.vendor?.phone || '',
        vendorCategory: user.vendor?.category || '',
        gstNumber: user.vendor?.gstNumber || '',
        address: user.vendor?.addressStreet || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Remove empty password from payload so it isn't updated
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      const res = await api.put('/auth/profile', payload);
      updateUser(res.data);
      setFormData(prev => ({ ...prev, password: '' })); // clear password field
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const isVendor = user?.role === 'vendor';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal and account information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="col-span-1"
        >
          <div className="card text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-primary-600"></div>
            <div className="relative mt-8 mb-4">
              <div className="w-24 h-24 bg-white rounded-full mx-auto p-1 shadow-lg flex items-center justify-center">
                <div className="w-full h-full bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-3xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold capitalize">
              <ShieldCheck className="w-4 h-4" />
              {user?.role?.replace('_', ' ')}
            </div>
          </div>
        </motion.div>

        {/* Edit Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="col-span-1 md:col-span-2"
        >
          <form onSubmit={handleSubmit} className="card space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Personal Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input type="text" name="name" className="input !pl-10" value={formData.name} onChange={handleChange} required />
                </div>
              </div>
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input type="email" name="email" className="input !pl-10" value={formData.email} onChange={handleChange} required />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="label">New Password (leave blank to keep current)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                  <input type="password" name="password" className="input !pl-10" placeholder="••••••••" value={formData.password} onChange={handleChange} />
                </div>
              </div>
            </div>

            {isVendor && (
              <>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mt-8">Vendor Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                      <input type="text" name="phone" className="input !pl-10" value={formData.phone} onChange={handleChange} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Business Category</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                      <input type="text" name="vendorCategory" className="input !pl-10" value={formData.vendorCategory} onChange={handleChange} />
                    </div>
                  </div>
                  <div>
                    <label className="label">GSTIN Number</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                      <input type="text" name="gstNumber" className="input !pl-10" value={formData.gstNumber} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Street Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea name="address" rows={2} className="input !pl-10 py-2.5" value={formData.address} onChange={handleChange}></textarea>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
              <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
