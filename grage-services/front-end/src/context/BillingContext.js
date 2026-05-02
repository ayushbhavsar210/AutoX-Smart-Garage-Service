import React, { createContext, useCallback, useContext, useState } from 'react';
import { billingApi, customerApi, usersApi } from '../utils/apiService';

const BillingContext = createContext();

export const BillingProvider = ({ children }) => {
  const [billingRecords, setBillingRecords] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizeBillingRecord = useCallback((record = {}) => {
    const lineItems = Array.isArray(record.lineItems) ? record.lineItems : [];
    const serviceName =
      record.serviceName ||
      lineItems.map((item) => item.name).filter(Boolean).join(', ') ||
      record.bookingId ||
      '—';

    return {
      ...record,
      invoiceNumber:
        record.invoiceNumber ||
        record.invoice_number ||
        (record.paymentId ? `INV-${record.paymentId}` : '') ||
        (record._id ? `INV-${String(record._id).slice(-6).toUpperCase()}` : ''),
      customerType: record.customerType || (record.userId ? 'registered' : 'offline'),
      customerDetails: record.customerDetails || {
        name: record.customerName || `Customer ${record.userId || ''}`.trim(),
        phone: record.phone || '',
        email: record.email || '',
      },
      vehicleDetails: record.vehicleDetails || {
        number: record.vehicleNumber || '',
        model: record.vehicleModel || '',
        company: record.vehicleCompany || '',
      },
      lineItems,
      paymentStatus: record.paymentStatus || record.status || 'pending',
      paymentDate: record.paymentDate || record.createdAt || '',
      subtotal: Number(record.subtotal || 0),
      serviceCharge: Number(record.serviceCharge || 0),
      discount: Number(record.discount || 0),
      gst: Number(record.gst || record.tax || 0),
      totalAmount: Number(record.finalTotal || record.totalAmount || record.amount || 0),
      finalTotal: Number(record.finalTotal || record.totalAmount || record.amount || 0),
      serviceName,
      paymentMethod: record.paymentMethod || record.method || 'cash',
      transactionId: record.transactionId || record.transaction_id || record.razorpay_payment_id || '',
      bookingId: record.bookingId || record.booking_id || '',
      refundAmount: Number(record.refundAmount || 0),
    };
  }, []);

  const createBillingRecord = useCallback(async (paymentData, userId, bookingId) => {
    try {
      setLoading(true);
      setError(null);

      const isNewBillingPayload =
        paymentData &&
        (paymentData.customerType || paymentData.customerDetails || paymentData.vehicleDetails || Array.isArray(paymentData.lineItems));

      const payload = isNewBillingPayload
        ? { ...paymentData }
        : {
            customerType: 'registered',
            userId: String(userId),
            bookingId,
            currency: paymentData?.currency || 'INR',
            lineItems: [
              {
                name: paymentData?.serviceName || 'Service',
                quantity: 1,
                price: Number(paymentData?.amount || 0),
                itemType: 'service',
              },
            ],
            serviceCharge: 0,
            discount: 0,
            gst: Number(paymentData?.tax || 0),
            paymentMethod: paymentData?.method || 'razorpay',
            paymentStatus: 'paid',
            transactionId:
              paymentData?.transactionId ||
              paymentData?.razorpay_payment_id ||
              paymentData?.paymentId ||
              '',
          };

      const response = await billingApi.create(payload);
      const createdRecord = normalizeBillingRecord(response?.data || {});

      setBillingRecords((prev) => [createdRecord, ...prev]);
      setInvoices((prev) => [createdRecord, ...prev]);
      return createdRecord;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [normalizeBillingRecord]);

  const updateBillingRecord = useCallback(async (invoiceNumber, payload) => {
    try {
      setLoading(true);
      setError(null);

      const response = await billingApi.update(invoiceNumber, payload);
      const updated = normalizeBillingRecord(response?.data || {});

      setBillingRecords((prev) => prev.map((record) => (record.invoiceNumber === invoiceNumber ? updated : record)));
      setInvoices((prev) => prev.map((record) => (record.invoiceNumber === invoiceNumber ? updated : record)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [normalizeBillingRecord]);

  const getBillingByInvoice = useCallback(async (invoiceNumber) => {
    const response = await billingApi.getByInvoice(invoiceNumber);
    return normalizeBillingRecord(response?.data || {});
  }, [normalizeBillingRecord]);

  const fetchRegisteredCustomers = useCallback(async () => {
    try {
      const response = await billingApi.listRegisteredCustomers();
      return Array.isArray(response?.data) ? response.data : [];
    } catch (err) {
      if (err?.status === 404) {
        const fallback = await usersApi.list();
        const users = Array.isArray(fallback?.data) ? fallback.data : [];
        return users
          .filter((user) => user?.role !== 'admin')
          .map((user) => ({
            id: String(user?.userId || user?._id || ''),
            userId: String(user?.userId || user?._id || ''),
            name: user?.fullName || user?.name || user?.email || 'Customer',
            phone: user?.phone || '',
            email: user?.email || '',
          }));
      }
      throw err;
    }
  }, []);

  const fetchRegisteredCustomerProfile = useCallback(async (userId) => {
    try {
      const response = await billingApi.getRegisteredCustomerProfile(userId);
      return response?.data || null;
    } catch (err) {
      if (err?.status === 404) {
        const fallbackUser = await usersApi.getById(userId);
        const user = fallbackUser?.data;
        if (!user) return null;

        return {
          userId: String(user?.userId || user?._id || userId),
          customerDetails: {
            name: user?.fullName || user?.name || user?.email || 'Customer',
            phone: user?.phone || '',
            email: user?.email || '',
          },
          vehicleDetails: { number: '', model: '', company: '' },
          vehicles: [],
        };
      }
      throw err;
    }
  }, []);

  const fetchUserBillingRecords = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await billingApi.listByUser(userId);
      const raw = Array.isArray(response?.data) ? response.data : [];
      const records = raw.map((record) => normalizeBillingRecord(record));

      setBillingRecords(records);
      setInvoices(records);
      return records;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [normalizeBillingRecord]);

  const fetchMyBillingRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      try {
        response = await customerApi.invoices();
      } catch (customerEndpointError) {
        // Fallback for environments where customer alias route is not available.
        response = await billingApi.listMine();
      }

      const raw = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
      const records = raw.map((record) => normalizeBillingRecord(record));
      setBillingRecords(records);
      setInvoices(records);
      return records;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [normalizeBillingRecord]);

  const fetchAllBillingRecords = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams(filters).toString();
      const response = await billingApi.listAll(queryParams);
      const raw = Array.isArray(response?.data) ? response.data : [];
      const records = raw.map((record) => normalizeBillingRecord(record));

      setBillingRecords(records);
      setInvoices(records);
      return records;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [normalizeBillingRecord]);

  const processRefund = useCallback(async (invoiceNumber, refundAmount, reason) => {
    try {
      setLoading(true);
      setError(null);

      await billingApi.refund({ invoiceNumber, reason, refundAmount });
      setBillingRecords((prev) =>
        prev.map((record) =>
          record.invoiceNumber === invoiceNumber
            ? { ...record, refundStatus: 'processing', refundAmount, notes: reason }
            : record
        )
      );

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyInvoice = useCallback(async (invoiceNumber) => {
    try {
      setLoading(true);
      setError(null);

      await billingApi.verify(invoiceNumber);
      setBillingRecords((prev) =>
        prev.map((record) =>
          record.invoiceNumber === invoiceNumber
            ? { ...record, verified: true, verifiedAt: new Date().toISOString() }
            : record
        )
      );

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateBillingReport = useCallback((startDate, endDate, filters = {}) => {
    const filtered = billingRecords.filter((record) => {
      const recordDate = new Date(record.paymentDate);
      const start = new Date(startDate);
      const end = new Date(endDate);

      return (
        recordDate >= start &&
        recordDate <= end &&
        (!filters.paymentStatus || record.paymentStatus === filters.paymentStatus) &&
        (!filters.paymentMethod || record.paymentMethod === filters.paymentMethod)
      );
    });

    const totalAmount = filtered.reduce((sum, record) => sum + Number(record.totalAmount || record.finalTotal || 0), 0);
    const totalTransactions = filtered.length;
    const completedPayments = filtered.filter((record) => record.paymentStatus === 'completed').length;
    const totalRefunds = filtered.reduce((sum, record) => sum + Number(record.refundAmount || 0), 0);

    return {
      totalAmount,
      totalTransactions,
      completedPayments,
      totalRefunds,
      records: filtered,
      generatedAt: new Date().toISOString(),
    };
  }, [billingRecords]);

  const value = {
    billingRecords,
    invoices,
    loading,
    error,
    createBillingRecord,
    updateBillingRecord,
    getBillingByInvoice,
    fetchRegisteredCustomers,
    fetchRegisteredCustomerProfile,
    fetchUserBillingRecords,
    fetchMyBillingRecords,
    fetchAllBillingRecords,
    processRefund,
    verifyInvoice,
    generateBillingReport,
  };

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within BillingProvider');
  }
  return context;
};
