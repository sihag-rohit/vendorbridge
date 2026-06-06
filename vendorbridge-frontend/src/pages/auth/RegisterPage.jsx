import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Phone, ArrowRight, Building2, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'vendor', phone: '',
    vendorCategory: '', gstNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(formData);
      toast.success('Registration successful!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex animated-bg relative overflow-hidden">
      
      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-[10%] left-[15%] text-white/20"
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
          <Building2 size={120} />
        </motion.div>
        <motion.div className="absolute bottom-[20%] right-[15%] text-white/20"
          animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
          <Store size={150} />
        </motion.div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl card glass-morphism shadow-2xl p-6 sm:p-10"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Join VendorBridge</h2>
            <p className="text-gray-600 mt-2">Create your account to start receiving RFQs</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-700 rounded-lg text-sm mb-6 border border-red-100 font-medium">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Company / Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input required className="input !pl-10 bg-white/80" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="label">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input type="email" required className="input !pl-10 bg-white/80" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="label">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input required className="input !pl-10 bg-white/80" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input type="password" required className="input !pl-10 bg-white/80" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="label">Vendor Category *</label>
                <select required className="input bg-white/80" value={formData.vendorCategory} onChange={e => setFormData({...formData, vendorCategory: e.target.value})}>
                  <option value="">Select category...</option>
                  <option value="IT & Software">IT & Software</option>
                  <option value="Hardware & Electronics">Hardware & Electronics</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Logistics & Transport">Logistics & Transport</option>
                  <option value="Consulting Services">Consulting Services</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="label">GST / Tax ID</label>
                <input className="input bg-white/80" placeholder="Optional" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-8 text-lg font-bold">
              {loading ? (
                <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Registering...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">Create Account <ArrowRight className="w-5 h-5" /></span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-800 transition-colors">
              Sign In
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
