import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, ShieldCheck, Box, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex animated-bg relative overflow-hidden">
      
      {/* Floating Elements Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute top-[20%] left-[10%] text-white/20"
          animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
          <Box size={120} />
        </motion.div>
        <motion.div className="absolute bottom-[15%] right-[10%] text-white/20"
          animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}>
          <ShieldCheck size={160} />
        </motion.div>
        <motion.div className="absolute top-[30%] right-[25%] text-white/10"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
          <Users size={100} />
        </motion.div>
      </div>

      {/* Hero Section */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-20 relative z-10 text-white">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-6xl font-extrabold mb-6 leading-tight drop-shadow-lg">
            Smart Procurement, <br/>
            <span className="text-primary-200">Simplified.</span>
          </h1>
          <p className="text-xl text-primary-100 max-w-xl leading-relaxed mb-8">
            Connect with top vendors, automate RFQs, and manage invoices in one intelligent ERP platform.
          </p>
          <div className="flex gap-4">
            <div className="glass-morphism px-6 py-3 rounded-xl flex items-center gap-3">
              <ShieldCheck className="text-emerald-300" />
              <span className="font-medium">Secure Approvals</span>
            </div>
            <div className="glass-morphism px-6 py-3 rounded-xl flex items-center gap-3">
              <Box className="text-blue-300" />
              <span className="font-medium">Live RFQ Tracking</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Login Form Section */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md card glass-morphism shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="mx-auto w-24 h-24 rounded-full border-2 border-gray-200 flex items-center justify-center bg-gray-50 mb-4 overflow-hidden">
              <span className="text-gray-400 font-medium">Photo</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to VendorBridge ERP</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-700 rounded-lg text-sm mb-6 border border-red-100 font-medium">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input type="email" required className="input !pl-10 bg-white/80" 
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vendorbridge.com" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input type="password" required className="input !pl-10 bg-white/80"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4 text-lg">
              {loading ? (
                <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Authenticating...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">Sign In <ArrowRight className="w-5 h-5" /></span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-800 transition-colors">
              Create Vendor Account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
