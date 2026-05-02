import React, { useMemo, useState, useEffect } from 'react';
import CommonTable from '../../components/CommonTable.jsx';
import { getAuthToken } from '../../utils/apiClient';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const toDisplayStatus = (status) => {
  const raw = String(status || '').toLowerCase();
  if (raw === 'success' || raw === 'paid' || raw === 'captured') return 'success';
  if (raw === 'failed' || raw === 'failure') return 'failed';
  if (raw === 'pending' || raw === 'created' || raw === 'initiated') return 'pending';
  return raw || 'pending';
};

const getStatusLabel = (status) => {
  const value = String(status || '').toLowerCase();
  if (value === 'success') return 'Success';
  if (value === 'failed') return 'Failed';
  return 'Pending';
};

function ManageRepairs() {
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ total: 0, success: 0, failed: 0, pending: 0 });

  const loadPayments = async (pageOverride = page) => {
    try {
      setLoading(true);
      setError('');

      const token = getAuthToken();
      const query = new URLSearchParams({
        page: String(pageOverride),
        limit: '20',
        status: statusFilter,
      });

      if (searchTerm.trim()) {
        query.set('search', searchTerm.trim());
      }

      const response = await fetch(`${API_BASE_URL}/api/payments?${query.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const result = isJson ? await response.json() : null;

      if (!isJson) {
        const responseText = await response.text();
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          throw new Error('Payments API returned HTML instead of JSON. Check backend server and API base URL.');
        }
        throw new Error('Payments API did not return JSON response.');
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Failed to load payment history');
      }

      const records = Array.isArray(result?.data) ? result.data : [];
      setTotalPages(Number(result?.totalPages || 1));
      setPage(Number(result?.page || pageOverride));
      setCounts({
        total: Number(result?.counts?.total || 0),
        success: Number(result?.counts?.success || 0),
        failed: Number(result?.counts?.failed || 0),
        pending: Number(result?.counts?.pending || 0),
      });

      const normalized = records
        .map((item) => {
          const dateValue = item.created_at || item.createdAt || item.verifiedAt || item.updatedAt || null;
          const parsedDate = dateValue ? new Date(dateValue) : null;
          const timestamp = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;

          return {
            transactionId: item.razorpay_payment_id || 'N/A',
            orderId: item.razorpay_order_id || 'N/A',
            serviceName: item.service_name || 'N/A',
            email: item.email || 'N/A',
            amount: Number(item.amount || 0),
            status: toDisplayStatus(item.status),
            signature: item.razorpay_signature || 'N/A',
            rawResponse: item.raw_response || null,
            dateTime: timestamp ? timestamp.toLocaleString('en-IN') : 'N/A',
            sortTime: timestamp ? timestamp.getTime() : 0,
          };
        })
        .sort((a, b) => b.sortTime - a.sortTime);

      setPayments(normalized);
    } catch (err) {
      setError(err?.message || 'Unable to fetch payment history');
      setPayments([]);
      setTotalPages(1);
      setPage(1);
      setCounts({ total: 0, success: 0, failed: 0, pending: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadPayments(1);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    loadPayments(page);
  }, [page]);

  const filteredPayments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return payments.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch =
        !search ||
        item.email.toLowerCase().includes(search) ||
        item.transactionId.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [payments, statusFilter, searchTerm]);

  const paymentColumns = useMemo(
    () => [
      { accessorKey: 'transactionId', header: 'Transaction ID' },
      { accessorKey: 'serviceName', header: 'Service Name' },
      { accessorKey: 'email', header: 'User Email' },
      {
        accessorKey: 'amount',
        header: 'Amount',
        Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString('en-IN')}`,
      },
      {
        accessorKey: 'status',
        header: 'Payment Status',
        Cell: ({ cell }) => getStatusLabel(cell.getValue()),
      },
      { accessorKey: 'dateTime', header: 'Date & Time' },
      {
        id: 'actions',
        header: 'Action',
        Cell: ({ row }) => (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setSelectedPayment(row.original);
            }}
            style={{
              border: '1px solid #dc2626',
              borderRadius: '6px',
              padding: '6px 10px',
              background: 'white',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            View Details
          </button>
        ),
      },
    ],
    []
  );

  const successCount = counts.success;
  const failedCount = counts.failed;
  const pendingCount = Number(counts.pending || 0);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>💳 Payment History</h1>
          <p className="header-subtitle">Total Transactions: {payments.length}</p>
        </div>
      </div>

      <div className="controls-bar">
        <div className="filter-tabs">
          {[
            { id: 'all', label: 'All', count: counts.total },
            { id: 'success', label: 'Success', count: successCount },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'failed', label: 'Failed', count: failedCount },
          ].map((status) => (
            <button
              key={status.id}
              className={`filter-tab ${statusFilter === status.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(status.id)}
            >
              {status.label} <span className="badge-count">{status.count}</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by email or transaction ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading && <div className="empty-state">Loading payment history...</div>}
      {!loading && error && <div className="empty-state">{error}</div>}

      {!loading && !error && filteredPayments.length === 0 ? (
        <div className="empty-state">No payment records found.</div>
      ) : null}

      {!loading && !error && filteredPayments.length > 0 && (
        <div style={{ padding: '20px' }}>
          <CommonTable
            columns={paymentColumns}
            data={filteredPayments}
            fileName="payment-history"
            showSelection={true}
          />

          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="filter-tab"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </button>
            <span style={{ fontSize: '13px', color: '#4a4a4a' }}>Page {page} of {totalPages}</span>
            <button
              type="button"
              className="filter-tab"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || loading}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedPayment && (
        <div className="payment-modal-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="payment-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>Payment Details</h3>
              <button
                type="button"
                className="payment-modal-close"
                onClick={() => setSelectedPayment(null)}
                aria-label="Close payment details"
              >
                ×
              </button>
            </div>

            <div className="payment-detail-grid">
              <div className="payment-detail-item payment-detail-item-wide">
                <span className="payment-detail-label">Transaction ID</span>
                <span className="payment-detail-value payment-detail-mono">{selectedPayment.transactionId || 'N/A'}</span>
              </div>
              <div className="payment-detail-item payment-detail-item-wide">
                <span className="payment-detail-label">Order ID</span>
                <span className="payment-detail-value payment-detail-mono">{selectedPayment.orderId || 'N/A'}</span>
              </div>
              <div className="payment-detail-item">
                <span className="payment-detail-label">Service</span>
                <span className="payment-detail-value">{selectedPayment.serviceName || 'N/A'}</span>
              </div>
              <div className="payment-detail-item">
                <span className="payment-detail-label">Email</span>
                <span className="payment-detail-value">{selectedPayment.email || 'N/A'}</span>
              </div>
              <div className="payment-detail-item">
                <span className="payment-detail-label">Amount</span>
                <span className="payment-detail-value">₹{Number(selectedPayment.amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="payment-detail-item">
                <span className="payment-detail-label">Status</span>
                <span className={`payment-status-badge status-${selectedPayment.status || 'pending'}`}>
                  {getStatusLabel(selectedPayment.status)}
                </span>
              </div>
              <div className="payment-detail-item payment-detail-item-wide">
                <span className="payment-detail-label">Date and Time</span>
                <span className="payment-detail-value">{selectedPayment.dateTime || 'N/A'}</span>
              </div>
            </div>

            <div className="payment-extra-block">
              <div className="payment-extra-title">Signature</div>
              <div className="payment-extra-content payment-detail-mono">{selectedPayment.signature || 'N/A'}</div>
            </div>

            <div className="payment-extra-block">
              <div className="payment-extra-title">Raw Response</div>
              <pre className="payment-raw-json">{JSON.stringify(selectedPayment.rawResponse || {}, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      <div className="booking-stats">
        <div className="stat-item">
          <label>Total Payments</label>
          <span>{counts.total}</span>
        </div>
        <div className="stat-item">
          <label>Success</label>
          <span>{successCount}</span>
        </div>
        <div className="stat-item">
          <label>Failed</label>
          <span>{failedCount}</span>
        </div>
        <div className="stat-item">
          <label>Pending</label>
          <span>{pendingCount}</span>
        </div>
      </div>
    </div>
  );
}

export default ManageRepairs;
