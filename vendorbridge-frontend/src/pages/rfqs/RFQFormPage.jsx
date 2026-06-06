import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowLeft, Calendar, Package } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { generateRFQFromText } from '../../services/aiService';

const UNITS = ['pcs', 'kg', 'liters', 'meters', 'boxes', 'units', 'hours', 'days', 'set'];

export default function RFQFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    items: [{ productName: '', description: '', quantity: 1, unit: 'pcs', estimatedPrice: '' }],
    assignedVendors: [], status: 'draft'
  });
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return toast.error('Please describe what you need.');
    setGeneratingAi(true);
    const toastId = toast.loading('Generating RFQ with AI...');
    try {
      const generated = await generateRFQFromText(aiPrompt);
      setForm(prev => ({
        ...prev,
        title: generated.title || prev.title,
        description: generated.notes || prev.description,
        deadline: generated.delivery_days_suggested ? format(addDays(new Date(), generated.delivery_days_suggested), 'yyyy-MM-dd') : prev.deadline,
        items: [{
          productName: generated.product_service || '',
          description: '',
          quantity: generated.quantity || 1,
          unit: 'pcs',
          estimatedPrice: generated.budget_inr ? generated.budget_inr / (generated.quantity || 1) : ''
        }]
      }));
      toast.success('Form filled by AI!', { id: toastId });
      setAiPrompt('');
    } catch (err) {
      toast.error(err.message || 'AI Generation failed.', { id: toastId });
    } finally {
      setGeneratingAi(false);
    }
  };

  useEffect(() => {
    api.get('/vendors', { params: { status: 'active' } }).then(r => setVendors(r.data));
    if (isEdit) {
      api.get(`/rfqs/${id}`).then(r => {
        const rfq = r.data;
        setForm({
          title: rfq.title, description: rfq.description || '',
          priority: rfq.priority, deadline: format(new Date(rfq.deadline), 'yyyy-MM-dd'),
          items: rfq.items, status: rfq.status,
          assignedVendors: rfq.assignedVendors.map(v => v.id)
        });
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const addItem = () => setForm(f => ({
    ...f, items: [...f.items, { productName: '', description: '', quantity: 1, unit: 'pcs', estimatedPrice: '' }]
  }));

  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const updateItem = (i, field, value) => setForm(f => ({
    ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item)
  }));

  const toggleVendor = (vendorId) => setForm(f => ({
    ...f, assignedVendors: f.assignedVendors.includes(vendorId)
      ? f.assignedVendors.filter(v => v !== vendorId)
      : [...f.assignedVendors, vendorId]
  }));

  const handleSubmit = async (e, sendNow = false) => {
    e.preventDefault();
    if (!form.title) { toast.error('RFQ title is required.'); return; }
    if (form.items.length === 0 || !form.items[0].productName) { toast.error('At least one product is required.'); return; }

    setSaving(true);
    const payload = { ...form, status: sendNow ? 'sent' : form.status };
    try {
      if (isEdit) {
        await api.put(`/rfqs/${id}`, payload);
        toast.success('RFQ updated!');
      } else {
        await api.post('/rfqs', payload);
        toast.success(sendNow ? 'RFQ created and sent to vendors!' : 'RFQ saved as draft!');
      }
      navigate('/rfqs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save RFQ.');
    } finally {
      setSaving(false);
    }
  };

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.category.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/rfqs')} className="btn-ghost btn-sm p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit RFQ' : 'Create New RFQ'}</h1>
          <p className="page-subtitle">Fill in the procurement request details</p>
        </div>
      </div>

      {/* AI Smart Fill Banner */}
      {!isEdit && (
        <div className="card gradient-primary p-6 text-white">
          <h2 className="text-lg font-semibold mb-2">AI Smart Fill</h2>
          <p className="text-white/80 text-sm mb-4">Describe what you need in plain English and let AI fill out the form for you.</p>
          <div className="flex gap-3">
            <input 
              type="text" 
              className="input bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white focus:ring-white/30" 
              placeholder="e.g., I need 50 office laptops for the new tech team, budget around 3000000 INR, delivery in 14 days."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !generatingAi && (e.preventDefault(), handleAiGenerate())}
              disabled={generatingAi}
            />
            <button 
              type="button" 
              onClick={handleAiGenerate}
              disabled={generatingAi || !aiPrompt.trim()}
              className="bg-white text-primary-900 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {generatingAi ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary-600" /> RFQ Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">RFQ Title *</label>
                <input className="input" placeholder="e.g., Office Furniture Procurement Q1 2024"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input min-h-[80px] resize-y" placeholder="Additional details about the procurement..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Deadline *</label>
                <input type="date" className="input"
                  value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  min={format(new Date(), 'yyyy-MM-dd')} required />
              </div>
              <div>
                <label className="label">Priority</label>
                <select className="input" value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Products / Services *</h2>
              <button type="button" onClick={addItem} className="btn-secondary btn-sm">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="label text-xs">Product / Service *</label>
                    <input className="input text-sm" placeholder="Product name"
                      value={item.productName} onChange={e => updateItem(i, 'productName', e.target.value)} required />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <label className="label text-xs">Quantity *</label>
                    <input type="number" min="1" className="input text-sm" value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <label className="label text-xs">Unit</label>
                    <select className="input text-sm" value={item.unit}
                      onChange={e => updateItem(i, 'unit', e.target.value)}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-10 sm:col-span-3">
                    <label className="label text-xs">Est. Price (₹)</label>
                    <input type="number" min="0" className="input text-sm" placeholder="Optional"
                      value={item.estimatedPrice || ''}
                      onChange={e => updateItem(i, 'estimatedPrice', e.target.value)} />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex items-end">
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors w-full flex justify-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor Assignment */}
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Assign Vendors</h2>
            <input className="input" placeholder="Search vendors by name or category..."
              value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {filteredVendors.map(vendor => (
                <label key={vendor.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    form.assignedVendors.includes(vendor.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input type="checkbox" className="w-4 h-4 text-primary-600 rounded"
                    checked={form.assignedVendors.includes(vendor.id)}
                    onChange={() => toggleVendor(vendor.id)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{vendor.name}</p>
                    <p className="text-xs text-gray-500">{vendor.category}</p>
                  </div>
                </label>
              ))}
              {filteredVendors.length === 0 && (
                <p className="col-span-2 text-sm text-gray-400 text-center py-4">No vendors found</p>
              )}
            </div>
            {form.assignedVendors.length > 0 && (
              <p className="text-sm text-primary-600 font-medium">{form.assignedVendors.length} vendor(s) selected</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/rfqs')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-secondary">
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button type="button" disabled={saving || form.assignedVendors.length === 0}
              onClick={(e) => handleSubmit(e, true)} className="btn-primary">
              <Package className="w-4 h-4" />
              {saving ? 'Sending...' : 'Save & Send to Vendors'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
