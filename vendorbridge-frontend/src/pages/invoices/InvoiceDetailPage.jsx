import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import StatusBadge from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Printer, Mail, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailModal, setEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ recipientEmail: '', recipientName: '' });
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`)
      .then(r => setInvoice(r.data))
      .catch(() => { toast.error('Invoice not found.'); navigate('/invoices'); })
      .finally(() => setLoading(false));
  }, [id]);

  const generatePDF = () => {
    if (!invoice) return;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('VendorBridge', 15, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Procurement & Vendor Management ERP', 15, 28);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 155, 22, { align: 'right' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, 155, 31, { align: 'right' });

    // Reset color
    doc.setTextColor(0, 0, 0);

    // Invoice details
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(invoice.createdAt), 'MMM d, yyyy')}`, 15, 55);
    doc.text(`PO Number: ${invoice.poId?.poNumber || 'N/A'}`, 15, 63);
    doc.text(`Payment Terms: ${invoice.paymentTerms || 'Net 30'}`, 15, 71);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 15, 79);

    // Vendor details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 120, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(invoice.vendorId?.name || '', 120, 63);
    doc.text(invoice.vendorId?.email || '', 120, 71);
    if (invoice.vendorId?.gstNumber) doc.text(`GST: ${invoice.vendorId.gstNumber}`, 120, 79);

    // Items table
    autoTable(doc, {
      startY: 95,
      head: [['#', 'Product / Service', 'Qty', 'Unit', 'Unit Price', 'Total']],
      body: invoice.items.map((item, i) => [
        i + 1,
        item.productName,
        item.quantity,
        item.unit || 'pcs',
        `₹${item.unitPrice?.toLocaleString()}`,
        `₹${item.totalPrice?.toLocaleString()}`
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [248, 248, 255] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`₹${invoice.subtotal?.toLocaleString()}`, 195, finalY, { align: 'right' });

    doc.text(`GST (${invoice.taxRate}%):`, 140, finalY + 8);
    doc.text(`₹${invoice.taxAmount?.toLocaleString()}`, 195, finalY + 8, { align: 'right' });

    doc.setFillColor(79, 70, 229);
    doc.rect(135, finalY + 13, 65, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total Amount:', 140, finalY + 21);
    doc.text(`₹${invoice.totalAmount?.toLocaleString()}`, 195, finalY + 21, { align: 'right' });

    // Footer
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Thank you for your business. VendorBridge ERP Platform', 105, 285, { align: 'center' });

    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast.success('PDF downloaded!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      await api.post(`/invoices/${id}/send-email`, emailForm);
      toast.success('Invoice sent via email!');
      setEmailModal(false);
      setInvoice(prev => ({ ...prev, status: 'sent' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      const res = await api.put(`/invoices/${id}/status`, { status: 'paid' });
      setInvoice(prev => ({ ...prev, status: 'paid', paidAt: new Date() }));
      toast.success('Invoice marked as paid!');
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  if (loading) return <PageLoader />;
  if (!invoice) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Actions Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate('/invoices')} className="btn-ghost btn-sm p-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{invoice.invoiceNumber}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={generatePDF} className="btn-secondary">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={() => setEmailModal(true)} className="btn-secondary">
            <Mail className="w-4 h-4" /> Send Email
          </button>
          {invoice.status !== 'paid' && (
            <button onClick={handleMarkPaid} className="btn-success">
              <CheckCircle className="w-4 h-4" /> Mark Paid
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <div id="invoice-print" className="card">
        {/* Invoice Header */}
        <div className="gradient-primary rounded-xl p-6 mb-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">VendorBridge</h2>
              <p className="text-white/70 text-sm">Procurement & Vendor Management ERP</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">INVOICE</p>
              <p className="text-white/80 font-mono">{invoice.invoiceNumber}</p>
              <div className="mt-1"><StatusBadge status={invoice.status} /></div>
            </div>
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Invoice Details</p>
            <div className="space-y-1 text-sm">
              <div className="flex gap-2"><span className="text-gray-500 w-32">Invoice Date:</span><span className="font-medium">{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</span></div>
              <div className="flex gap-2"><span className="text-gray-500 w-32">PO Number:</span><span className="font-medium font-mono">{invoice.poId?.poNumber}</span></div>
              <div className="flex gap-2"><span className="text-gray-500 w-32">Payment Terms:</span><span className="font-medium">{invoice.paymentTerms || 'Net 30'}</span></div>
              {invoice.paidAt && <div className="flex gap-2"><span className="text-gray-500 w-32">Paid On:</span><span className="font-medium text-emerald-600">{format(new Date(invoice.paidAt), 'MMM d, yyyy')}</span></div>}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Vendor Information</p>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-gray-900">{invoice.vendorId?.name}</p>
              <p className="text-gray-600">{invoice.vendorId?.email}</p>
              <p className="text-gray-600">{invoice.vendorId?.phone}</p>
              {invoice.vendorId?.gstNumber && <p className="text-gray-500">GST: {invoice.vendorId.gstNumber}</p>}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
          <table className="table w-full">
            <thead>
              <tr><th>#</th><th>Product / Service</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, i) => (
                <tr key={i}>
                  <td className="text-gray-400">{i + 1}</td>
                  <td><p className="font-medium">{item.productName}</p></td>
                  <td>{item.quantity}</td>
                  <td>{item.unit || 'pcs'}</td>
                  <td>₹{item.unitPrice?.toLocaleString()}</td>
                  <td className="font-semibold">₹{item.totalPrice?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>₹{invoice.subtotal?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">GST ({invoice.taxRate}%)</span>
              <span>₹{invoice.taxAmount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-3 border-t-2 border-primary-100">
              <span>Total Amount</span>
              <span className="text-primary-600">₹{invoice.totalAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
            <strong className="text-gray-700">Notes:</strong> {invoice.notes}
          </div>
        )}
      </div>

      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-slide-in">
            <h3 className="text-lg font-semibold">Send Invoice via Email</h3>
            <div>
              <label className="label">Recipient Email *</label>
              <input type="email" className="input" placeholder="vendor@company.com"
                value={emailForm.recipientEmail}
                onChange={e => setEmailForm(f => ({ ...f, recipientEmail: e.target.value }))} />
            </div>
            <div>
              <label className="label">Recipient Name</label>
              <input className="input" placeholder="Contact name"
                value={emailForm.recipientName}
                onChange={e => setEmailForm(f => ({ ...f, recipientName: e.target.value }))} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEmailModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSendEmail} disabled={sendingEmail || !emailForm.recipientEmail}
                className="btn-primary flex-1">
                <Mail className="w-4 h-4" />
                {sendingEmail ? 'Sending...' : 'Send Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
