import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { ArrowLeft, CheckCircle, Award, Clock, DollarSign, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function QuotationComparisonPage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/rfqs/${rfqId}`),
      api.get(`/rfqs/${rfqId}/quotations`)
    ]).then(([r, q]) => {
      setRfq(r.data);
      setQuotes(q.data);
    }).catch(() => {
      toast.error('Failed to load comparison');
      navigate('/rfqs');
    }).finally(() => setLoading(false));
  }, [rfqId, navigate]);

  const handleSelectWinner = async (quoteId) => {
    if (!window.confirm('Are you sure you want to select this quotation? This will notify the vendor.')) return;
    setSelecting(true);
    try {
      await api.post(`/quotations/${quoteId}/select`);
      toast.success('Quotation selected successfully!');
      navigate('/approvals');
    } catch (err) {
      toast.error('Failed to select quotation');
      setSelecting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!rfq || quotes.length === 0) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold">No quotations submitted yet</h2>
      <button onClick={() => navigate(-1)} className="btn-primary mt-4">Go Back</button>
    </div>
  );

  const lowestPrice = Math.min(...quotes.map(q => q.totalAmount));
  const fastestDelivery = Math.min(...quotes.map(q => q.deliveryTimelineDays));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm p-2 bg-white shadow-sm rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="page-title text-3xl font-extrabold text-gray-900">Quotation Comparison</h1>
          <p className="page-subtitle text-lg">Compare bids and award the contract</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="card gradient-hero text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
          <Award size={300} />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">{rfq.title}</h2>
            <div className="flex gap-4 text-primary-200 text-sm font-medium">
              <span>RFQ Ref: <span className="text-white font-mono">{rfq.rfqNumber}</span></span>
              <span>Deadline: <span className="text-white">{new Date(rfq.deadline).toLocaleDateString()}</span></span>
            </div>
          </div>
          <StatusBadge status={rfq.status} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {quotes.map((quote, index) => {
          const isLowestPrice = quote.totalAmount === lowestPrice;
          const isFastest = quote.deliveryTimelineDays === fastestDelivery;
          const isWinner = quote.status === 'selected';

          return (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, type: 'spring', stiffness: 80 }}
              key={quote._id} 
              className={`card relative overflow-hidden transition-all duration-300 ${isWinner ? 'border-4 border-emerald-500 shadow-emerald-500/30 shadow-2xl scale-105 z-10' : 'hover:shadow-2xl hover:-translate-y-2 border-2 border-transparent hover:border-primary-200'}`}
            >
              {/* Winner Banner */}
              {isWinner && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-1.5 font-bold text-sm tracking-widest uppercase shadow-md transform translate-x-4 translate-y-4 rotate-45">
                  Winner
                </div>
              )}

              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">{quote.vendorId.name}</h3>
                <p className="text-sm text-gray-500 font-medium">⭐ {quote.vendorId.performanceMetrics?.rating?.toFixed(1) || 'N/A'}</p>
                <div className="mt-4 inline-flex items-center justify-center p-4 bg-primary-50 rounded-2xl">
                  <span className="text-3xl font-extrabold text-primary-700">₹{quote.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-5 mb-8">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 font-medium flex items-center gap-2"><DollarSign className="w-4 h-4"/> Pricing</span>
                  {isLowestPrice ? (
                    <span className="badge badge-green font-bold animate-pulse"><Award className="w-3 h-3 mr-1" /> Lowest</span>
                  ) : <span className="font-semibold">Standard</span>}
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 font-medium flex items-center gap-2"><Clock className="w-4 h-4"/> Delivery</span>
                  <div className="text-right">
                    <span className="font-bold">{quote.deliveryTimelineDays} Days</span>
                    {isFastest && <span className="badge badge-blue ml-2 animate-pulse">Fastest</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 font-medium flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Terms</span>
                  <span className="font-semibold text-sm truncate max-w-[120px]">{quote.paymentTerms}</span>
                </div>
              </div>

              {rfq.status === 'published' && (
                <button 
                  onClick={() => handleSelectWinner(quote._id)}
                  disabled={selecting}
                  className="btn-primary w-full py-4 text-lg font-bold group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 group-hover:scale-125 transition-transform" /> Select Winner
                  </span>
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
