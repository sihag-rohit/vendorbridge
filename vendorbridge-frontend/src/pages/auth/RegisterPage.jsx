import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Phone, ArrowRight, Building2, Store, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', role: 'officer', phone: '',
    country: '', additionalInfo: '', address: '', gstNumber: ''
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register({
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`
      });
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
          <div className="text-center mb-6">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <input 
                type="file" 
                id="photo-upload" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setPhoto(file);
                    setPhotoPreview(URL.createObjectURL(file));
                  }
                }} 
              />
              <label 
                htmlFor="photo-upload" 
                className="w-24 h-24 rounded-full border-2 border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-primary-400 hover:bg-gray-100 transition-colors group relative"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 font-medium group-hover:text-primary-500">Photo</span>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </label>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Registration</h2>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-700 rounded-lg text-sm mb-6 border border-red-100 font-medium">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">First Name</label>
                <input required className="input bg-white/80" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              
              <div>
                <label className="label">Last Name</label>
                <input required className="input bg-white/80" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              
              <div>
                <label className="label">Email Address</label>
                <input type="email" required className="input bg-white/80" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input required className="input bg-white/80" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div>
                <label className="label">Role</label>
                <select required className="input bg-white/80" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="officer">Procurement Officer</option>
                  <option value="vendor">Vendor</option>
                  <option value="manager">Manager / Approver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="label">Country</label>
                <input required className="input bg-white/80" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
              </div>

              <div>
                <label className="label">Password</label>
                <input type="password" required className="input bg-white/80" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              
              {formData.role === 'vendor' && (
                <>
                  <div>
                    <label className="label">Address (Vendor Only) *</label>
                    <input required className="input bg-white/80" placeholder="Street Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">GSTIN Number (Vendor Only) *</label>
                    <input required className="input bg-white/80" placeholder="e.g. 29ABCDE1234F2Z5" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="label">Additional Information ....</label>
              <textarea rows={4} className="input bg-white/80 resize-none" value={formData.additionalInfo} onChange={e => setFormData({...formData, additionalInfo: e.target.value})}></textarea>
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
