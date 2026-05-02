/**
 * Context Export Index
 * Centralizes all context exports
 */

import { useCallback, useMemo, useState } from 'react';
import { getAuthToken } from '../utils/apiClient';
import { bookingApi } from '../utils/apiService';

export { AuthProvider, useAuth } from './AuthContext';
export { BillingProvider, useBilling } from './BillingContext';
export { NotificationProvider, useNotifications } from './NotificationContext';
export { ThemeContext, ThemeProvider, useTheme } from './ThemeContext';

const getBookingAmount = (booking) => {
  if (typeof booking.amount === 'number') {
    return Number.isFinite(booking.amount) ? booking.amount : 0;
  }

  const parsedAmount = Number.parseFloat(booking.amount);
  return Number.isFinite(parsedAmount) ? parsedAmount : 0;
};

const computeBookingStats = (bookings) => {
  return bookings.reduce(
    (acc, booking) => {
      acc.totalRevenue += getBookingAmount(booking);

      const status = String(booking.status || '').toLowerCase();
      if (status === 'completed') acc.completed += 1;
      else if (status === 'confirmed') acc.confirmed += 1;
      else if (status === 'pending') acc.pending += 1;

      return acc;
    },
    {
      totalRevenue: 0,
      completed: 0,
      pending: 0,
      confirmed: 0
    }
  );
};

export const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(() => computeBookingStats([]));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const hasToken = !!getAuthToken();
      const response = hasToken ? await bookingApi.listMine() : await bookingApi.listAll();
      const incomingBookings = Array.isArray(response?.data) ? response.data : [];

      setBookings(incomingBookings);
      setStats(computeBookingStats(incomingBookings));
    } catch (err) {
      setBookings([]);
      setStats(computeBookingStats([]));
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(() => {
    setStats(computeBookingStats(bookings));
  }, [bookings]);

  const addBooking = useCallback((bookingData) => {
    const booking = {
      id: bookingData.id || `BKG-${Date.now()}`,
      ...bookingData
    };

    const updatedBookings = [...bookings, booking];
    setBookings(updatedBookings);
    setStats(computeBookingStats(updatedBookings));

    return booking;
  }, [bookings]);

  const createBooking = useCallback(async (bookingData) => {
    setLoading(true);
    setError(null);

    try {
      const hasToken = !!getAuthToken();
      const isAuthError = (err) => {
        const status = Number(err?.status || 0);
        const message = String(err?.message || '').toLowerCase();
        return status === 401 || status === 403 || message.includes('token') || message.includes('jwt') || message.includes('unauthorized') || message.includes('expired');
      };

      const resolveScheduledAt = () => {
        if (bookingData?.scheduledAt) return bookingData.scheduledAt;

        const rawDate = bookingData?.date || bookingData?.bookingDate;
        if (!rawDate) return null;

        const slot = bookingData?.timeSlot || bookingData?.preferredSlot || bookingData?.preferredTime || '';
        const firstSlotPart = String(slot).split(' - ')[0].trim();
        const slotMatch = firstSlotPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

        const baseDate = new Date(rawDate);
        if (Number.isNaN(baseDate.getTime())) return null;

        let hours = 9;
        let minutes = 0;

        if (slotMatch) {
          hours = Number(slotMatch[1]);
          minutes = Number(slotMatch[2]);
          const meridian = slotMatch[3].toUpperCase();
          if (meridian === 'PM' && hours !== 12) hours += 12;
          if (meridian === 'AM' && hours === 12) hours = 0;
        }

        baseDate.setHours(hours, minutes, 0, 0);
        return baseDate.toISOString();
      };

      const rawServiceId = bookingData?.serviceId;
      const numServiceId = Number(rawServiceId);
      const resolvedServiceId = !isNaN(numServiceId) && rawServiceId !== '' ? numServiceId : (rawServiceId || 0);
      const resolvedScheduledAt = resolveScheduledAt() || new Date().toISOString();
      const resolvedNotes = bookingData?.notes || bookingData?.message || bookingData?.specialInstructions || '';
      const resolvedAmount = Number(bookingData?.amount || bookingData?.servicePrice || 0);

      const authenticatedPayload = {
        serviceId: resolvedServiceId,
        serviceName: bookingData?.serviceName || '',
        scheduledAt: resolvedScheduledAt,
        notes: resolvedNotes,
        amount: resolvedAmount,
        paymentMethod: bookingData?.paymentMethod || '',
        paymentStatus: bookingData?.paymentStatus || '',
        paymentDate: bookingData?.paymentDate || '',
        transactionId: bookingData?.transactionId || '',
        razorpayOrderId: bookingData?.razorpayOrderId || '',
        razorpayPaymentId: bookingData?.razorpayPaymentId || '',
        razorpaySignature: bookingData?.razorpaySignature || '',
        vehicleNumber: bookingData?.vehicleNumber || '',
        vehicleCompany: bookingData?.vehicleCompany || bookingData?.vehicleBrand || '',
        vehicleModel: bookingData?.vehicleModel || '',
        vehicleType: bookingData?.vehicleType || 'Car',
      };

      const publicPayload = {
        userId: bookingData?.userId ?? null,
        userObjectId: bookingData?.userObjectId || bookingData?.user_id || '',
        serviceId: resolvedServiceId,
        serviceName: bookingData?.serviceName || '',
        customerName: bookingData?.customerName || bookingData?.name || 'Customer',
        email: bookingData?.email || '',
        phone: bookingData?.phone || '',
        vehicleNumber: bookingData?.vehicleNumber || '',
        vehicleCompany: bookingData?.vehicleCompany || bookingData?.vehicleBrand || '',
        vehicleModel: bookingData?.vehicleModel || '',
        vehicleType: bookingData?.vehicleType || 'Car',
        date: bookingData?.date || bookingData?.bookingDate || '',
        timeSlot: bookingData?.timeSlot || bookingData?.preferredSlot || bookingData?.preferredTime || '',
        scheduledAt: resolvedScheduledAt,
        notes: resolvedNotes,
        amount: resolvedAmount,
        paymentMethod: bookingData?.paymentMethod || '',
        paymentStatus: bookingData?.paymentStatus || '',
        paymentDate: bookingData?.paymentDate || '',
        transactionId: bookingData?.transactionId || '',
        razorpayOrderId: bookingData?.razorpayOrderId || '',
        razorpayPaymentId: bookingData?.razorpayPaymentId || '',
        razorpaySignature: bookingData?.razorpaySignature || '',
      };
      let response;
      if (hasToken) {
        try {
          response = await bookingApi.createAuthenticated(authenticatedPayload);
        } catch (authErr) {
          if (!isAuthError(authErr)) {
            throw authErr;
          }
          response = await bookingApi.createPublic(publicPayload);
        }
      } else {
        response = await bookingApi.createPublic(publicPayload);
      }

      const booking = response?.data || bookingData;

      setBookings((prev) => {
        const updatedBookings = [booking, ...prev];
        setStats(computeBookingStats(updatedBookings));
        return updatedBookings;
      });

      return { success: true, data: booking, message: response?.message };
    } catch (err) {
      setError(err);
      return { success: false, error: err?.message || 'Unable to create booking' };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBooking = useCallback((bookingId, updates) => {
    const updatedBookings = bookings.map((booking) =>
      booking.id === bookingId ? { ...booking, ...updates } : booking
    );

    setBookings(updatedBookings);
    setStats(computeBookingStats(updatedBookings));

    return updatedBookings.find((booking) => booking.id === bookingId) || null;
  }, [bookings]);

  const cancelBooking = useCallback(async (bookingId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingApi.cancel(bookingId);
      const canceledBooking = response?.data;

      setBookings((prev) => {
        const updatedBookings = prev.map((booking) =>
          booking.id === bookingId ? { ...booking, ...(canceledBooking || {}), status: 'canceled' } : booking
        );
        setStats(computeBookingStats(updatedBookings));
        return updatedBookings;
      });

      return { success: true, data: canceledBooking };
    } catch (err) {
      setError(err);
      return { success: false, error: err?.message || 'Unable to cancel booking' };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookings = loadBookings;

  return useMemo(
    () => ({
      bookings,
      stats,
      loading,
      error,
      loadBookings,
      loadStats,
      fetchBookings,
      createBooking,
      addBooking,
      updateBooking,
      cancelBooking
    }),
    [
      bookings,
      stats,
      loading,
      error,
      loadBookings,
      loadStats,
      fetchBookings,
      createBooking,
      addBooking,
      updateBooking,
      cancelBooking
    ]
  );
};

export const usePayments = () => {
  return {
    payments: [],
    loading: false,
    error: null,
    fetchPayments: () => {},
    processPayment: () => {},
    makePayment: async (paymentData) => {
      return {
        success: true,
        data: paymentData,
        transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      };
    },
    refundPayment: () => {}
  };
};
