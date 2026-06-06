import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save, Send } from 'lucide-react';

const UNITS = ['pcs', 'kg', 'liters', 'meters', 'boxes', 'units', 'hours', 'days', 'set'];

export default function QuotationSubmitPage() {
  const { rfqId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [existingQuotation, setExistingQuotation] = useState(null);
  const [form, setForm] = useState({
    items: [], deliveryTimeline: 7, taxRate: 18, notes: '', validUntil: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const rfqRes = await api.get(`/rfqs/${rfqId}`);
        setRfq(rfqRes.data);

        // Pre-fill items from RFQ
        const items = rfqRes.data.items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          unitPrice: '',
          totalPrice: 0
        }));

        // Check for existing quotation
        const quotRes = await api.get('/quotations', { params: { rfqId } });
        if (quotRes.data.length > 0) {
          const existing = quotRes.data[0];
          setExistingQuotation(existing);
          setForm({
            items: existing.items,
            deliveryTimeline: existing.deliveryTimeline,
            taxRate: existing.taxRate,
            notes: existing.notes || '',
            validUntil: existing.validUntil ? existing.validUntil.split('T')[0] : ''
          });
        } else {
          setForm(f => ({ ...f, items }));
        }
      } catch (err) {
        toast.error('Failed to load RFQ.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [rfqId]);

  const updateItem = (i, field, value) => {
    setForm(f => {
      const items = f.items.map((item, idx) => {
        if (idx !== i) return item;
        const updated = { ...item, [field]: value };
        if (field === 'unitPrice' || field === 'quantity') {
          const price = field === 'unitPrice' ? parseFloat(value) || 0 : parseFloat(updated.unitPrice) || 0;
          const qty = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(updated.quantity) || 0;
          updated.totalPrice = price * qty;
        }
        return updated;
      });
      return { ...f, items };
    });
  };

  const subtotal = form.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const taxAmount = (subtotal * (form.taxRate || 18)) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (form.items.some(item => !item.unitPrice)) {
      toast.error('Please enter unit price for all items.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        rfqId, items: form.items, deliveryTimeline: form.deliveryTimeline,
        taxRate: form.taxRate, notes: form.notes, validUntil: form.validUntil
      };

      if (existingQuotation) {
        await api.put(`/quotations/${existingQuotation._id}`, payload);
        toast.success('Quotation updated!');
      } else {
        await api.post('/quotations', payload);
        toast.success('Quotation submitted!');
      }
      navigate('/rfqs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quotation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!rfq) return null;

  const isPastDeadline = new Date(rfq.deadline) < new Date();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/rfqs')} className="btn-ghost btn-sm p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="page-title">{existingQuotation ? 'Update Quotation' : 'Submit Quotation'}</h1>
          <p className="page-subtitle">For: {rfq.rfqNumber} — {rfq.title}</p>
        </div>
      </div>

      {isPastDeadline && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          ⚠️ The deadline for this RFQ has passed. You may not be able to submit quotations.
        </div>
      )}

      {/* RFQ Summary */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">RFQ Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Deadline:</span> <span className="font-medium">{new Date(rfq.deadline).toLocaleDateString()}</span></div>
          <div><span className="text-gray-500">Priority:</span> <span className="font-medium capitalize">{rfq.priority}</span></div>
          {rfq.description && <div className="col-span-2"><span className="text-gray-500">Description:</span> <span>{rfq.description}</span></div>}
        </div>
      </div>

      {/* Pricing Table */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Pricing Details *</h2>
        <div className="space-y-3">
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="col-span-12 sm:col-span-4">
                <p className="text-xs text-gray-500 mb-1">Product</p>
                <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                <p className="text-xs text-gray-400">{item.quantity} {item.unit}</p>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="label text-xs">Unit Price (₹) *</label>
                <input type="number" min="0" step="0.01" className="input text-sm"
                  placeholder="0.00"
                  value={item.unitPrice || ''}
                  onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="label text-xs">Quantity</label>
                <input type="number" min="1" className="input text-sm"
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)} />
              </div>
              <div className="col-span-12 sm:col-span-2">
                <label className="label text-xs">Total</label>
                <p className="text-sm font-semibold text-gray-900 py-2">
                  ₹{(item.totalPrice || 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">GST Rate (%)</span>
              <input type="number" min="0" max="28" className="input w-20 text-sm"
                value={form.taxRate}
                onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))} />
            </div>
            <span>₹{taxAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Total Amount</span>
            <span className="text-primary-600">₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Delivery & Notes */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">Delivery & Terms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Delivery Timeline (days) *</label>
            <input type="number" min="1" className="input"
              value={form.deliveryTimeline}
              onChange={e => setForm(f => ({ ...f, deliveryTimeline: parseInt(e.target.value) || 1 }))} />
          </div>
          <div>
            <label className="label">Valid Until</label>
            <input type="date" className="input" value={form.validUntil}
              onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes / Comments</label>
            <textarea className="input min-h-[80px] resize-y" placeholder="Additional terms, conditions or comments..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate('/rfqs')} className="btn-secondary">Cancel</button>
        <button onClick={handleSubmit} disabled={saving || isPastDeadline} className="btn-primary flex-1 sm:flex-none">
          <Send className="w-4 h-4" />
          {saving ? 'Submitting...' : existingQuotation ? 'Update Quotation' : 'Submit Quotation'}
        </button>
      </div>
    </div>
  );
}
