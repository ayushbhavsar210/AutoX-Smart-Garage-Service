import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { paymentApi } from '../utils/apiService';
import './PaymentSuccess.css';

const formatAmount = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('en-IN');
};

function PaymentSuccess() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadInvoice = async () => {
      if (!bookingId) {
        if (mounted) {
          setError('Booking reference not found.');
          setLoading(false);
        }
        return;
      }

      try {
        const response = await paymentApi.getInvoiceByBookingId(bookingId);
        if (!mounted) return;

        if (!response?.success || !response?.data) {
          throw new Error(response?.message || 'Unable to load payment receipt');
        }

        setInvoice(response.data);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Unable to load payment receipt');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadInvoice();
    return () => {
      mounted = false;
    };
  }, [bookingId]);

  const invoiceRows = useMemo(() => {
    if (!invoice) return [];
    return [
      ['Invoice Number', invoice.invoiceNumber || 'N/A'],
      ['Date & Time', formatDateTime(invoice.dateTime)],
      ['Customer Name', invoice.customerName || 'N/A'],
      ['Service Name', invoice.serviceName || 'N/A'],
      ['Vehicle Number', invoice.vehicleNumber || 'N/A'],
      ['Amount Paid', formatAmount(invoice.amountPaid)],
      ['Payment Method', invoice.paymentMethod || 'N/A'],
      ['Transaction ID', invoice.transactionId || 'N/A'],
      ['Payment Status', invoice.paymentStatus || 'Paid'],
    ];
  }, [invoice]);

  const canDownloadInvoice = Boolean(
    invoice &&
    String(invoice?.invoiceNumber || '').trim() !== '' &&
    ['paid', 'completed', 'success'].includes(String(invoice?.paymentStatus || '').toLowerCase())
  );

  return (
    <div className="payment-success-page">
      <div className="payment-success-card">
        <div className="payment-success-icon" aria-hidden="true">
          ✅
        </div>
        <h1>Payment Successful</h1>
        <p className="payment-success-subtitle">Service booked successfully</p>

        {loading && <div className="payment-success-message">Loading receipt...</div>}
        {!loading && error && <div className="payment-success-message error">{error}</div>}

        {!loading && !error && invoice && (
          <div className="invoice-mini-card">
            <h2>Payment Receipt</h2>
            <div className="invoice-mini-grid">
              {invoiceRows.map(([label, value]) => (
                <div className="invoice-mini-row" key={label}>
                  <span className="invoice-mini-label">{label}</span>
                  <span className="invoice-mini-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="payment-success-actions">
          {canDownloadInvoice && (
            <button type="button" className="btn-primary" onClick={() => window.print()}>
              Download Invoice
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/customer/dashboard', { state: { activeTab: 'billing' } })}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
