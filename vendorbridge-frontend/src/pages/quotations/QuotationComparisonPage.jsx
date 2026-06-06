import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { ArrowLeft, CheckCircle, Award, Clock, DollarSign, ShieldCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { analyzeQuotations } from '../../services/aiService';

export default function QuotationComparisonPage() {
  const { id: rfqId } = useParams();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const handleAskAI = async () => {
    setAnalyzingAi(true);
    const toastId = toast.loading('AI is analyzing the quotations...');
    try {
      const formattedQuotes = quotes.map(q => ({
        vendorName: q.vendor?.name || 'Unknown Vendor',
        totalPrice: q.totalAmount,
        deliveryDays: q.deliveryTimeline,
        warrantyYears: q.warrantyYears || 0,
        vendorRating: q.vendor?.rating || 0
      }));
      const recommendation = await analyzeQuotations(rfq.title, formattedQuotes);
      setAiRecommendation(recommendation);
      toast.success('Analysis complete!', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'AI Analysis failed.', { id: toastId });
    } finally {
      setAnalyzingAi(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get(`/rfqs/${rfqId}`),
      api.get(`/quotations`, { params: { rfqId } })
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
      await api.put(`/quotations/${quoteId}/select`);
      toast.success('Quotation selected successfully!');
      navigate('/approvals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to select quotation');
      setSelecting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!rfq || quotes.length === 0) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold">No quotations submitted yet</h2>
      <p className="text-gray-400 mt-2">Vendors haven't submitted any quotes for this RFQ.</p>
      <button onClick={() => navigate(-1)} className="btn-primary mt-4">Go Back</button>
    </div>
  );

  // Full detail modal for a selected quote
  const QuoteDetailPanel = ({ quote, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-primary-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-primary-200 text-sm font-medium">Quotation from</p>
              <h2 className="text-2xl font-bold">{quote.vendor?.name}</h2>
              <p className="text-primary-200 text-sm mt-1">{quote.vendor?.category} &middot; ⭐ {quote.vendor?.rating?.toFixed(1) || 'N/A'} rating</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl font-bold leading-none">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-gray-700 mb-3">Price Breakdown</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">₹{Number(quote.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">GST / Tax ({quote.taxRate}%)</span>
              <span className="font-medium">₹{Number(quote.taxAmount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
              <span>Total Amount</span>
              <span className="text-primary-700 text-lg">₹{Number(quote.totalAmount).toLocaleString()}</span>
            </div>
          </div>

          {/* Delivery & Terms */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-500 font-semibold uppercase">Delivery</p>
              <p className="text-xl font-bold text-blue-700 mt-1">{quote.deliveryTimeline || 'N/A'} <span className="text-sm font-normal">days</span></p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-xs text-emerald-500 font-semibold uppercase">Status</p>
              <p className="text-base font-bold text-emerald-700 mt-1 capitalize">{quote.status?.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Quoted Items */}
          {quote.items && quote.items.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Quoted Items</h3>
              <div className="space-y-2">
                {quote.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg px-4 py-2 text-sm">
                    <span className="font-medium text-gray-700">{item.description || item.productName || `Item ${i+1}`}</span>
                    <span className="text-gray-500">{item.quantity} × ₹{Number(item.unitPrice).toLocaleString()} = <strong>₹{Number(item.totalPrice).toLocaleString()}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs text-amber-600 font-semibold uppercase mb-1">Notes / Terms</p>
              <p className="text-sm text-gray-700">{quote.notes}</p>
            </div>
          )}

          {/* Valid until */}
          {quote.validUntil && (
            <p className="text-xs text-gray-400 text-center">Valid until {new Date(quote.validUntil).toLocaleDateString()}</p>
          )}
        </div>
      </motion.div>
    </div>
  );

  const lowestPrice = Math.min(...quotes.map(q => q.totalAmount));
  const fastestDelivery = Math.min(...quotes.map(q => q.deliveryTimeline || Infinity));

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

      {/* AI Recommendation Section */}
      {aiRecommendation ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 p-6 shadow-md relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-indigo-900 mb-2">AI Recommendation</h3>
              <p className="text-indigo-800 leading-relaxed font-medium">
                {aiRecommendation}
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="flex justify-end">
          <button 
            onClick={handleAskAI} 
            disabled={analyzingAi || quotes.length === 0}
            className="btn-primary bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 gap-2 flex items-center"
          >
            <Sparkles className="w-5 h-5" />
            {analyzingAi ? 'Analyzing...' : 'Ask AI to Recommend Best Vendor'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {quotes.map((quote, index) => {
          const isLowestPrice = quote.totalAmount === lowestPrice;
          const isFastest = quote.deliveryTimeline === fastestDelivery;
          const isWinner = quote.status === 'selected' || quote.status === 'under_review';

          return (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, type: 'spring', stiffness: 80 }}
              key={quote.id} 
              onClick={() => setSelectedQuote(quote)}
              className={`card relative overflow-hidden transition-all duration-300 cursor-pointer ${isWinner ? 'border-4 border-emerald-500 shadow-emerald-500/30 shadow-2xl scale-105 z-10' : 'hover:shadow-2xl hover:-translate-y-2 border-2 border-transparent hover:border-primary-200'}`}
            >
              {/* Winner Banner */}
              {isWinner && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white px-6 py-1.5 font-bold text-sm tracking-widest uppercase shadow-md transform translate-x-4 translate-y-4 rotate-45">
                  Winner
                </div>
              )}

              <div className="text-center mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">{quote.vendor?.name || 'Unknown Vendor'}</h3>
                <p className="text-sm text-gray-500 font-medium">⭐ {quote.vendor?.rating?.toFixed(1) || 'N/A'}</p>
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
                    <span className="font-bold">
                      {quote.deliveryTimeline ? `${quote.deliveryTimeline} Days` : '—'}
                    </span>
                    {isFastest && <span className="badge badge-blue ml-2 animate-pulse">Fastest</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 font-medium flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Notes / Terms</span>
                  <span className="font-semibold text-sm truncate max-w-[140px] text-right" title={quote.notes || '—'}>
                    {quote.notes || '—'}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="text-gray-600 font-medium text-sm">Tax ({quote.taxRate}%)</span>
                  <span className="font-semibold text-sm">₹{Number(quote.taxAmount).toLocaleString()}</span>
                </div>
              </div>

              {(rfq.status === 'under_comparison' || rfq.status === 'sent') && quote.status !== 'rejected' && (
                <button 
                  onClick={() => handleSelectWinner(quote.id)}
                  disabled={selecting}
                  className="btn-primary w-full py-4 text-lg font-bold group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 group-hover:scale-125 transition-transform" /> Select Winner
                  </span>
                </button>
              )}
              {isWinner && (
                <div className="w-full py-3 text-center bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-emerald-700 font-bold flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Selected — Pending Approval
                  </span>
                </div>
              )}
              {quote.status === 'rejected' && (
                <div className="w-full py-3 text-center bg-red-50 border border-red-200 rounded-xl">
                  <span className="text-red-600 font-semibold text-sm">Not Selected</span>
                </div>
              )}

              <p className="text-center text-xs text-gray-400 mt-3">Click card for full details</p>
            </motion.div>
          );
        })}
      </div>

      {/* Full detail modal */}
      {selectedQuote && (
        <QuoteDetailPanel quote={selectedQuote} onClose={() => setSelectedQuote(null)} />
      )}
    </div>
  );
}
