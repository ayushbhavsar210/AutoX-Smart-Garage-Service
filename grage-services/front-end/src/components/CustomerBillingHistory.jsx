import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useBilling } from '../context/BillingContext';
import { useAuth } from '../context/AuthContext';
import { authApi, customerApi, vehiclesApi } from '../utils/apiService';
import { downloadInvoicePDF } from '../utils/invoiceGenerator';
import CommonTable from './CommonTable';
import './CustomerBillingHistory.css';

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const normalizePaymentStatus = (status) => {
  const value = String(status || '').trim().toLowerCase();
  if (value === 'paid' || value === 'completed' || value === 'success' || value === 'successful') {
    return 'completed';
  }
  if (value === 'failed' || value === 'failure') {
    return 'failed';
  }
  return 'pending';
};

const toNumberSafe = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeBillingRow = (billing = {}) => ({
  ...billing,
  invoiceNumber:
    billing.invoiceNumber ||
    billing.invoice_number ||
    billing.paymentId ||
    (billing._id ? `INV-${String(billing._id).slice(-6).toUpperCase()}` : 'N/A'),
  serviceName:
    billing.serviceName ||
    billing.service_name ||
    billing.service ||
    billing.bookingId ||
    billing.booking_id ||
    'N/A',
  totalAmount: toNumberSafe(
    billing.totalAmount || billing.finalTotal || billing.amountPaid || billing.amount
  ),
  paymentMethod: billing.paymentMethod || billing.method || billing.payment_method || 'N/A',
  paymentStatus: billing.paymentStatus || billing.payment_status || billing.status || 'pending',
  paymentDate:
    billing.paymentDate ||
    billing.dateTime ||
    billing.verifiedAt ||
    billing.createdAt ||
    billing.created_at ||
    '',
  transactionId:
    billing.transactionId || billing.transaction_id || billing.razorpay_payment_id || 'N/A',
  bookingId: billing.bookingId || billing.booking_id || billing.id || 'N/A',
  customerDetails: {
    ...(billing.customerDetails || {}),
    name:
      billing?.customerDetails?.name ||
      billing.customerName ||
      billing.name ||
      '',
    phone:
      billing?.customerDetails?.phone ||
      billing.phone ||
      '',
    email:
      billing?.customerDetails?.email ||
      billing.email ||
      '',
    address:
      billing?.customerDetails?.address ||
      billing.address ||
      billing.city ||
      '',
  },
  vehicleDetails: {
    ...(billing.vehicleDetails || {}),
    number:
      billing?.vehicleDetails?.number ||
      billing.vehicleNumber ||
      billing.vehicle_no ||
      billing.registration ||
      '',
    model:
      billing?.vehicleDetails?.model ||
      billing.vehicleModel ||
      billing.vehicle ||
      '',
    company:
      billing?.vehicleDetails?.company ||
      billing.vehicleCompany ||
      billing.make ||
      '',
  },
  refundAmount: toNumberSafe(billing.refundAmount || billing.refund_amount || 0),
});

function CustomerBillingHistory() {
  const { user } = useAuth();
  const { fetchMyBillingRecords, loading } = useBilling();
  const [userBillings, setUserBillings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');

  const handleDownloadInvoice = useCallback(async (billing) => {
    const canDownload =
      normalizePaymentStatus(billing?.paymentStatus) === 'completed' &&
      normalizeText(billing?.invoiceNumber) !== '';

    if (!canDownload) {
      alert('Invoice will be available only after service is completed.');
      return;
    }

    let profile = null;
    let primaryVehicle = null;
    let matchedBooking = null;

    try {
      const meResponse = await authApi.me();
      profile = meResponse?.data || null;
    } catch (_err) {
      profile = null;
    }

    try {
      const vehiclesResponse = await vehiclesApi.listMine({
        userId: profile?.userId || user?.userId,
        userObjectId: profile?.id || user?.id,
        email: profile?.email || user?.email,
      });
      const vehicles = Array.isArray(vehiclesResponse?.data)
        ? vehiclesResponse.data
        : [];
      primaryVehicle = vehicles[0] || null;
    } catch (_err) {
      primaryVehicle = null;
    }

    try {
      const bookingsResponse = await customerApi.bookings();
      const bookings = Array.isArray(bookingsResponse?.data) ? bookingsResponse.data : [];

      const billingBookingId = normalizeText(billing?.bookingId || billing?.booking_id);
      const billingInvoice = normalizeText(billing?.invoiceNumber || billing?.invoice_number);
      const billingTxn = normalizeText(
        billing?.transactionId || billing?.transaction_id || billing?.razorpay_payment_id
      );

      matchedBooking = bookings.find((booking) => {
        const bookingId = normalizeText(booking?.id || booking?.bookingId || booking?._id);
        const bookingInvoice = normalizeText(booking?.invoiceNumber || booking?.invoice_number);
        const bookingTxn = normalizeText(
          booking?.transactionId || booking?.razorpayPaymentId || booking?.razorpay_payment_id
        );

        return (
          (billingBookingId && bookingId && billingBookingId === bookingId) ||
          (billingInvoice && bookingInvoice && billingInvoice === bookingInvoice) ||
          (billingTxn && bookingTxn && billingTxn === bookingTxn)
        );
      }) || null;

      if (!primaryVehicle && matchedBooking) {
        primaryVehicle = {
          plate: matchedBooking?.vehicleNumber || matchedBooking?.registration || '',
          vehicle_number: matchedBooking?.vehicleNumber || matchedBooking?.registration || '',
          model: matchedBooking?.vehicleModel || matchedBooking?.vehicle || '',
          vehicle_model: matchedBooking?.vehicleModel || matchedBooking?.vehicle || '',
          make: matchedBooking?.vehicleCompany || matchedBooking?.make || '',
          vehicle_company: matchedBooking?.vehicleCompany || matchedBooking?.make || '',
        };
      }
    } catch (_err) {
      matchedBooking = null;
    }

    const customerData = {
      name:
        profile?.fullName ||
        profile?.name ||
        user?.fullName ||
        user?.name ||
        user?.email?.split('@')[0] ||
        '',
      fullName: profile?.fullName || user?.fullName || '',
      username: profile?.username || user?.username || '',
      email:
        profile?.email ||
        billing?.customerDetails?.email ||
        user?.email ||
        '',
      phone:
        profile?.phone ||
        billing?.customerDetails?.phone ||
        user?.phone ||
        '',
      address:
        profile?.address ||
        profile?.city ||
        matchedBooking?.address ||
        matchedBooking?.city ||
        matchedBooking?.location ||
        billing?.customerDetails?.address ||
        user?.address ||
        user?.city ||
        '',
      city: profile?.city || user?.city || '',
      vehicleNumber:
        primaryVehicle?.vehicle_number ||
        primaryVehicle?.plate ||
        primaryVehicle?.registration ||
        matchedBooking?.vehicleNumber ||
        matchedBooking?.registration ||
        billing?.vehicleDetails?.number ||
        user?.registration ||
        '',
      vehicleModel:
        primaryVehicle?.vehicle_model ||
        primaryVehicle?.model ||
        matchedBooking?.vehicleModel ||
        matchedBooking?.vehicle ||
        billing?.vehicleDetails?.model ||
        user?.vehicle ||
        '',
      vehicleCompany:
        primaryVehicle?.vehicle_company ||
        primaryVehicle?.make ||
        matchedBooking?.vehicleCompany ||
        matchedBooking?.make ||
        billing?.vehicleDetails?.company ||
        '',
      registration:
        primaryVehicle?.vehicle_number ||
        primaryVehicle?.plate ||
        billing?.vehicleDetails?.number ||
        user?.registration ||
        '',
    };

    downloadInvoicePDF(billing, customerData);
  }, [user]);


  const billingColumns = useMemo(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice Number',
        size: 120,
      },
      {
        accessorKey: 'serviceName',
        header: 'Service',
        size: 130,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Amount',
        size: 100,
        Cell: ({ cell }) => `₹${cell.getValue()}`,
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment Method',
        size: 120,
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Status',
        size: 100,
        Cell: ({ cell }) => {
          const status = normalizePaymentStatus(cell.getValue());
          return (
            <span className={`status-badge status-${status}`}>
              {status.toUpperCase()}
            </span>
          );
        },
      },
      {
        accessorKey: 'paymentDate',
        header: 'Payment Date',
        size: 130,
        Cell: ({ cell }) => {
          const v = cell.getValue();
          if (!v) return '—';
          const d = new Date(v);
          return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        },
      },
      {
        id: 'download',
        header: 'Download',
        size: 120,
        Cell: ({ row }) => {
          const canDownload =
            normalizePaymentStatus(row.original?.paymentStatus) === 'completed' &&
            normalizeText(row.original?.invoiceNumber) !== '';

          if (!canDownload) {
            return <span title="Invoice will be available only after service is completed">—</span>;
          }

          return (
            <button
              className="btn-download-pdf"
              onClick={() => handleDownloadInvoice(row.original)}
              title={`Download invoice ${row.original?.invoiceNumber || ''}`}
            >
              📥 PDF
            </button>
          );
        },
      },
    ],
    [handleDownloadInvoice]
  );

  // Fetch user billing records on mount
  useEffect(() => {
    const fetchBillings = async () => {
      console.log('📊 Fetching billing records for authenticated user');
      const records = await fetchMyBillingRecords();
      console.log('✅ Billing records loaded:', records);
      setUserBillings(records);
    };
    if (user && fetchMyBillingRecords) {
      fetchBillings();
    }
  }, [user, fetchMyBillingRecords]);

  const normalizedBillings = useMemo(
    () => userBillings.map((billing) => normalizeBillingRow(billing)),
    [userBillings]
  );

  // Filter billings based on status and date range
  const filteredBillings = useMemo(() => {
    let filtered = normalizedBillings;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((b) => normalizePaymentStatus(b.paymentStatus) === filterStatus);
    }

    // Filter by date range
    if (filterDateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (filterDateRange) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }

      filtered = filtered.filter(b => new Date(b.paymentDate) >= startDate);
    }

    return filtered;
  }, [normalizedBillings, filterStatus, filterDateRange]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const stats = {
      totalBillings: userBillings.length,
      totalAmount: 0,
      completedPayments: 0,
      pendingPayments: 0,
      totalRefunds: 0,
    };

    normalizedBillings.forEach(billing => {
      stats.totalAmount += billing.totalAmount;
      const normalizedStatus = normalizePaymentStatus(billing.paymentStatus);
      if (normalizedStatus === 'completed') {
        stats.completedPayments += 1;
      } else if (normalizedStatus === 'pending') {
        stats.pendingPayments += 1;
      }
      stats.totalRefunds += billing.refundAmount || 0;
    });

    return stats;
  }, [normalizedBillings, userBillings.length]);

  const latestSuccessfulPayment = useMemo(() => {
    const successfulRecords = normalizedBillings.filter(
      (billing) => normalizePaymentStatus(billing.paymentStatus) === 'completed'
    );

    if (successfulRecords.length === 0) return null;

    return [...successfulRecords].sort((a, b) => {
      const aTime = new Date(a.paymentDate || a.createdAt || 0).getTime();
      const bTime = new Date(b.paymentDate || b.createdAt || 0).getTime();
      return bTime - aTime;
    })[0];
  }, [normalizedBillings]);

  const handleExportAll = () => {
    // Export all filtered billings as CSV
    const headers = [
      'Invoice Number',
      'Service',
      'Amount',
      'Payment Method',
      'Status',
      'Payment Date',
    ];
    const rows = filteredBillings.map(b => [
      b.invoiceNumber,
      b.serviceName,
      b.totalAmount,
      b.paymentMethod,
      normalizePaymentStatus(b.paymentStatus),
      b.paymentDate ? new Date(b.paymentDate).toLocaleDateString('en-IN') : '—',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="customer-billing-history">
      <div className="billing-header">
        <h2>📄 Billing & Invoice History</h2>
        <p>Manage and download your invoices and billing records</p>
      </div>

      {latestSuccessfulPayment && (
        <div className="payment-success-invoice-card">
          <div className="payment-success-invoice-head">
            <h3>Payment Successful For This Booking</h3>
            <span className="payment-success-pill">SUCCESS</span>
          </div>
          <p className="payment-success-message-line">
            This booking payment is successful. You can view invoice details below.
          </p>
          <div className="payment-success-invoice-grid">
            <div>
              <span className="label">Booking ID</span>
              <span className="value">{latestSuccessfulPayment.bookingId || 'N/A'}</span>
            </div>
            <div>
              <span className="label">Service Name</span>
              <span className="value">{latestSuccessfulPayment.serviceName || 'N/A'}</span>
            </div>
            <div>
              <span className="label">Transaction ID</span>
              <span className="value">{latestSuccessfulPayment.transactionId || 'N/A'}</span>
            </div>
            <div>
              <span className="label">Invoice Number</span>
              <span className="value">{latestSuccessfulPayment.invoiceNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="label">Amount Paid</span>
              <span className="value">₹{latestSuccessfulPayment.totalAmount || latestSuccessfulPayment.amount || 0}</span>
            </div>
            <div>
              <span className="label">Payment Date</span>
              <span className="value">
                {latestSuccessfulPayment.paymentDate || latestSuccessfulPayment.createdAt
                  ? new Date(
                      latestSuccessfulPayment.paymentDate || latestSuccessfulPayment.createdAt
                    ).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
              <p>"📥 PDF" button only appears after service is completed and invoice is generated.</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="billing-statistics">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total Billings</div>
            <div className="stat-value">{statistics.totalBillings}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Amount</div>
            <div className="stat-value">₹{statistics.totalAmount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Completed</div>
            <div className="stat-value">{statistics.completedPayments}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{statistics.pendingPayments}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">↩️</div>
          <div className="stat-content">
            <div className="stat-label">Refunded</div>
            <div className="stat-value">₹{statistics.totalRefunds}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="billing-filters">
        <div className="filter-group">
          <label htmlFor="statusFilter">Payment Status:</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="dateFilter">Date Range:</label>
          <select
            id="dateFilter"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last 1 Year</option>
          </select>
        </div>

        <button className="btn-export" onClick={handleExportAll}>
          📥 Export to CSV
        </button>
      </div>

      {/* Billings Table */}
      <div className="billing-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading billing records...</p>
          </div>
        ) : filteredBillings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Billing Records Found</h3>
            <p>You don't have any billing records matching your filters.</p>
          </div>
        ) : (
          <>
            <CommonTable data={filteredBillings} columns={billingColumns} />
          </>
        )}
      </div>

      {/* Help Section */}
      <div className="billing-help">
        <h3>📚 Need Help?</h3>
        <div className="help-grid">
          <div className="help-item">
            <span className="help-icon">❓</span>
            <div>
              <h4>How to download invoices?</h4>
              <p>"📥 PDF" button appears only after service is completed and invoice is generated.</p>
            </div>
          </div>
          <div className="help-item">
            <span className="help-icon">💳</span>
            <div>
              <h4>Payment issues?</h4>
              <p>Contact our support team at autoxgarageservice@gmail.com</p>
            </div>
          </div>
          <div className="help-item">
            <span className="help-icon">↩️</span>
            <div>
              <h4>Request a refund?</h4>
              <p>Use the refund request feature in your account settings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerBillingHistory;
