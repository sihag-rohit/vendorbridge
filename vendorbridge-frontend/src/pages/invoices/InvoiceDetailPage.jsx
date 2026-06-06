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
import { useAuth } from '../../context/AuthContext';

export default function InvoiceDetailPage() {
  const { user } = useAuth();
  const isVendor = user?.role === 'vendor';
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
    const vendor = invoice.vendor || {};
    const po = invoice.po || {};

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

    // Invoice details (left side)
    doc.setFontSize(10);
    doc.text(`Date: ${format(new Date(invoice.createdAt), 'MMM d, yyyy')}`, 15, 55);
    doc.text(`PO Number: ${po.poNumber || 'N/A'}`, 15, 63);
    doc.text(`Payment Terms: ${invoice.paymentTerms || 'Net 30'}`, 15, 71);
    doc.text(`Status: ${invoice.status?.toUpperCase() || 'DRAFT'}`, 15, 79);

    // Vendor details (right side - Bill To)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 120, 55);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (vendor.name) doc.text(vendor.name, 120, 63);
    if (vendor.email) doc.text(vendor.email, 120, 71);
    if (vendor.phone) doc.text(vendor.phone, 120, 79);
    if (vendor.gstNumber) doc.text(`GST: ${vendor.gstNumber}`, 120, 87);
    if (vendor.addressCity) doc.text(vendor.addressCity, 120, 95);

    // Items table — use Rs. instead of rupee symbol (font encoding safe)
    autoTable(doc, {
      startY: 108,
      head: [['#', 'Product / Service', 'Qty', 'Unit', 'Unit Price', 'Total']],
      body: (invoice.items || []).map((item, i) => [
        i + 1,
        item.productName,
        item.quantity,
        item.unit || 'pcs',
        `Rs.${Number(item.unitPrice).toLocaleString('en-IN')}`,
        `Rs.${Number(item.totalPrice).toLocaleString('en-IN')}`
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [248, 248, 255] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`Rs.${Number(invoice.subtotal).toLocaleString('en-IN')}`, 195, finalY, { align: 'right' });

    doc.text(`GST (${invoice.taxRate || 18}%):`, 140, finalY + 8);
    doc.text(`Rs.${Number(invoice.taxAmount).toLocaleString('en-IN')}`, 195, finalY + 8, { align: 'right' });

    doc.setFillColor(79, 70, 229);
    doc.rect(135, finalY + 13, 65, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total Amount:', 140, finalY + 21);
    doc.text(`Rs.${Number(invoice.totalAmount).toLocaleString('en-IN')}`, 195, finalY + 21, { align: 'right' });

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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold font-sans text-gray-900 tracking-tight">Purchase Order & Invoice</h1>
          <p className="text-xl text-gray-700 mt-1">{invoice.invoiceNumber}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={generatePDF} className="flex flex-col items-center justify-center p-3 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors w-24">
            <Download className="w-5 h-5 mb-1" /> Download<br/>PDF
          </button>
          <button onClick={handlePrint} className="flex flex-col items-center justify-center p-3 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors w-24">
            <Printer className="w-5 h-5 mb-1" /> Print
          </button>
          {!isVendor && (
            <button onClick={() => setEmailModal(true)} className="flex flex-col items-center justify-center p-3 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors w-24">
              <Mail className="w-5 h-5 mb-1" /> Email<br/>invoice
            </button>
          )}
        </div>
      </div>

      <div id="invoice-print">
        {/* Top Details Box */}
        <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 p-6 md:p-8">
            {/* Bill To */}
            <div className="md:pr-6 mb-8 md:mb-0">
              <p className="font-medium text-gray-900 mb-4">Bill to:</p>
              <div className="text-gray-700 text-sm space-y-1">
                <p className="font-semibold text-gray-900">VendorBridge Operations</p>
                <p>123 Enterprise Avenue, Tech Park</p>
                <p>GSTIN: 29ABCDE1234F2Z5</p>
              </div>
              
              <div className="border-t border-gray-200 mt-6 pt-6 text-sm text-gray-700 space-y-2">
                <p>PO Number: {invoice.po?.poNumber || '—'}</p>
                <p>PO date: {invoice.po?.createdAt ? format(new Date(invoice.po.createdAt), 'dd MMM, yyyy') : '—'}</p>
              </div>
            </div>
            
            {/* Vendor */}
            <div className="md:pl-6 md:border-l md:border-gray-200">
              <p className="font-medium text-gray-900 mb-4">Vendor</p>
              <div className="text-gray-700 text-sm space-y-1">
                <p className="font-semibold text-gray-900">{invoice.vendor?.name || '—'}</p>
                {invoice.vendor?.addressStreet || invoice.vendor?.addressCity ? (
                  <p>{invoice.vendor.addressStreet || invoice.vendor.addressCity}</p>
                ) : (
                  <p className="text-gray-400 italic">Address not provided</p>
                )}
                {invoice.vendor?.gstNumber ? (
                  <p>GSTIN: {invoice.vendor.gstNumber}</p>
                ) : (
                  <p className="text-gray-400 italic">GSTIN not provided</p>
                )}
              </div>
              
              <div className="border-t border-gray-200 mt-6 pt-6 text-sm text-gray-700 space-y-2">
                <p>invoice date: {format(new Date(invoice.createdAt), 'dd MMM yyyy')}</p>
                <p>Due date: {invoice.dueDate ? format(new Date(invoice.dueDate), 'dd MMM yyyy') : '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table & Totals Container */}
        <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-b border-gray-300">
              <thead>
                <tr className="border-b border-gray-300 text-gray-900 font-medium">
                  <th className="py-4 px-6 w-1/2 border-r border-gray-300">Item</th>
                  <th className="py-4 px-6 text-center border-r border-gray-300">Qty</th>
                  <th className="py-4 px-6 text-center border-r border-gray-300">Unit price</th>
                  <th className="py-4 px-6 text-center">Total</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {invoice.items?.map((item, i) => (
                  <tr key={i} className="border-b border-gray-200 last:border-b-0">
                    <td className="py-4 px-6 border-r border-gray-300">{item.productName}</td>
                    <td className="py-4 px-6 text-center border-r border-gray-300">{item.quantity}</td>
                    <td className="py-4 px-6 text-center border-r border-gray-300">{item.unitPrice?.toLocaleString()}</td>
                    <td className="py-4 px-6 text-center">{item.totalPrice?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end bg-white">
            <div className="w-full md:w-[40%] border-l border-gray-300">
              <div className="flex justify-between py-2 px-6 border-b border-gray-200 text-sm">
                <span className="text-gray-700">Subtotal</span>
                <span className="text-gray-900">{invoice.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 px-6 border-b border-gray-200 text-sm">
                <span className="text-gray-700">CGST({(invoice.taxRate || 18)/2}%)</span>
                <span className="text-gray-900">{(invoice.taxAmount/2)?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 px-6 border-b border-gray-200 text-sm">
                <span className="text-gray-700">SGST({(invoice.taxRate || 18)/2}%)</span>
                <span className="text-gray-900">{(invoice.taxAmount/2)?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-3 px-6 text-sm font-medium">
                <span className="text-gray-900">Grand total</span>
                <span className="text-gray-900">{invoice.totalAmount?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status and Action Link */}
        <div className="flex items-center gap-4 mt-6 pl-2 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium text-sm">status:</span>
            <StatusBadge status={invoice.status} />
          </div>
          {invoice.status === 'paid' && invoice.paidAt && (
            <span className="text-sm font-medium text-gray-500">
              Paid on: {format(new Date(invoice.paidAt), 'MMM d, yyyy')}
            </span>
          )}
          {!isVendor && invoice.status !== 'paid' && (
            <button onClick={handleMarkPaid} className="text-blue-500 hover:text-blue-700 font-medium text-sm transition-colors bg-transparent border-0 p-0 shadow-none cursor-pointer">
              Mark as Paid
            </button>
          )}
        </div>
        
        {invoice.notes && (
          <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-200">
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
