import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../utils/apiClient';

// Helper fetch function with auth token
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = new Error('API request failed');
    error.status = response.status;
    throw error;
  }

  return response.json();
};

// =======================
// BOOKINGS
// =======================
export const useBookings = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => fetchWithAuth('/api/bookings'),
  });
};

export const useMyBookings = () => {
  return useQuery({
    queryKey: ['myBookings'],
    queryFn: () => fetchWithAuth('/customer/bookings'),
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingData) => fetchWithAuth('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
  });
};

// =======================
// PAYMENTS
// =======================
export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => fetchWithAuth('/api/payments'),
  });
};

export const useCreatePayment = () => {
  return useMutation({
    mutationFn: (paymentData) => fetchWithAuth('/api/create-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  });
};

// =======================
// SERVICES
// =======================
export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => fetchWithAuth('/api/services'),
    staleTime: 1000 * 60 * 30, // 30 minutes - services change rarely
  });
};

export const useServiceById = (id) => {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => fetchWithAuth(`/api/services/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
};

// =======================
// USER
// =======================
export const useUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => fetchWithAuth('/api/auth/me'),
  });
};

// =======================
// MODIFICATIONS
// =======================
export const useModifications = (params) => {
  const queryString = new URLSearchParams(params || {}).toString();
  return useQuery({
    queryKey: ['modifications', params],
    queryFn: () => fetchWithAuth(`/api/modifications${queryString ? '?' + queryString : ''}`),
  });
};

// =======================
// ANALYTICS / DASHBOARD
// =======================
export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: () => fetchWithAuth('/api/analytics/dashboard-metrics'),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useRevenueAnalytics = (params) => {
  const queryString = new URLSearchParams(params || {}).toString();
  return useQuery({
    queryKey: ['revenueAnalytics', params],
    queryFn: () => fetchWithAuth(`/api/analytics/revenue${queryString ? '?' + queryString : ''}`),
    staleTime: 1000 * 60 * 2,
  });
};

export const useBookingTrends = (params) => {
  const queryString = new URLSearchParams(params || {}).toString();
  return useQuery({
    queryKey: ['bookingTrends', params],
    queryFn: () => fetchWithAuth(`/api/analytics/booking-trends${queryString ? '?' + queryString : ''}`),
    staleTime: 1000 * 60 * 5,
  });
};
