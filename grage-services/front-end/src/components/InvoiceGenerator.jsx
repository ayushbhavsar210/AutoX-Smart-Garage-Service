import React, { useState, useEffect } from 'react';
import { useBilling } from '../context/BillingContext';
import { useAuth } from '../context/AuthContext';
import { downloadInvoicePDF } from '../utils/invoiceGenerator';
import './InvoiceGenerator.css';

function InvoiceGenerator({ paymentData, bookingId, onClose, onSuccess }) {
  const { user } = useAuth();
  const { createBillingRecord } = useBilling();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billingRecord, setBillingRecord] = useState(null);
  const [generatedInvoice, setGeneratedInvoice] = useState(false);

  // Auto-generate invoice on component mount
  useEffect(() => {
    if (paymentData && !billingRecord) {
      generateInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentData]);

  const generateInvoice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create billing record
      const record = await createBillingRecord(
        paymentData,
        user?.id || 'GUEST',
        bookingId
      );

      setBillingRecord(record);
      setGeneratedInvoice(true);

      // Call success callback
      if (onSuccess) {
        onSuccess(record);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate invoice');
      console.error('Invoice generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (billingRecord) {
      const customerData = {
        name: user?.name || user?.email?.split('@')[0] || 'Customer',
        email: user?.email || 'N/A',
        phone: user?.phone || 'N/A',
        address: user?.address || 'N/A',
      };

      downloadInvoicePDF(billingRecord, customerData);
    }
  };

  if (loading) {
    return (
      <div className="invoice-generator">
        <div className="invoice-loading">
          <div className="spinner"></div>
          <p>Generating your invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-generator">
        <div className="invoice-error">
          <div className="error-icon">❌</div>
          <h3>Error Generating Invoice</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={generateInvoice}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!generatedInvoice || !billingRecord) {
    return null;
  }

  return (
    <div className="invoice-generator">
      <div className="invoice-success-box">
        <div className="invoice-header">
          <div className="success-badge">✅</div>
          <h2>Invoice Generated Successfully</h2>
        </div>

        <div className="invoice-details">
          <div className="detail-row">
            <span className="label">Invoice Number:</span>
            <span className="value">{billingRecord.invoiceNumber}</span>
          </div>

          <div className="detail-row">
            <span className="label">Service:</span>
            <span className="value">{billingRecord.serviceName || billingRecord.bookingId || '—'}</span>
          </div>

          <div className="detail-row">
            <span className="label">Amount:</span>
            <span className="value">₹{Number(billingRecord.totalAmount || billingRecord.amount || 0).toFixed(2)}</span>
          </div>

          <div className="detail-row">
            <span className="label">Payment Method:</span>
            <span className="value">{billingRecord.paymentMethod || billingRecord.method || '—'}</span>
          </div>

          <div className="detail-row">
            <span className="label">Payment Status:</span>
            <span className={`value status-${billingRecord.paymentStatus || billingRecord.status || 'pending'}`}>
              {(billingRecord.paymentStatus || billingRecord.status || 'pending').toUpperCase()}
            </span>
          </div>

          <div className="detail-row">
            <span className="label">Transaction ID:</span>
            <span className="value">{billingRecord.transactionId || '—'}</span>
          </div>

          <div className="detail-row">
            <span className="label">Date:</span>
            <span className="value">
              {billingRecord.paymentDate || billingRecord.createdAt
                ? new Date(billingRecord.paymentDate || billingRecord.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                : '—'}
            </span>
          </div>
        </div>

        <div className="invoice-actions">
          <button className="btn-download" onClick={handleDownloadPDF}>
            📥 Download PDF Invoice
          </button>
          {onClose && (
            <button className="btn-close" onClick={onClose}>
              Close
            </button>
          )}
        </div>

        <div className="invoice-note">
          <p>
            💡 Your invoice has been saved to your account. You can download
            and view it anytime from your billing history.
          </p>
        </div>
      </div>
    </div>
  );
}

export default InvoiceGenerator;
