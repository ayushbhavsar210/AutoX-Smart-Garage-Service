import { apiGet, apiDelete, apiPatch, apiPost, apiPut } from './apiClient';

/* ─── Auth ─── */
export const authApi = {
  register: (payload) => apiPost('/auth/register', payload, { auth: false }),
  login: (payload) => apiPost('/auth/login', payload, { auth: false }),
  sendOtp: (payload) => apiPost('/send-otp', payload, { auth: false }),
  verifyOtp: (payload) => apiPost('/verify-otp', payload, { auth: false }),
  forgotPassword: (payload) => apiPost('/auth/forgot-password', payload, { auth: false }),
  me: () => apiGet('/auth/me'),
  updateProfile: (payload) => apiPut('/auth/me', payload),
};

/* ─── Bookings ─── */
export const bookingApi = {
  listAll: () => apiGet('/api/bookings'),
  listAdmin: (queryString = '') => apiGet(`/api/get_bookings.php${queryString ? `?${queryString}` : ''}`),
  listMine: () => apiGet('/api/bookings/me'),
  listHistory: () => apiGet('/api/bookings/history/me'),
  createAuthenticated: (payload) => apiPost('/bookings', payload),
  createPublic: (payload) => apiPost('/api/bookings', payload, { auth: false }),
  cancel: (id) => apiPut(`/api/bookings/${id}/cancel`),
  reschedule: (id, payload) => apiPost(`/api/bookings/${id}/reschedule`, payload),
  getStats: () => apiGet('/bookings/stats', { auth: false }),
  updateStatus: (id, payload) => apiPut(`/api/bookings/${id}/status`, payload),
  delete: (id) => apiDelete(`/api/bookings/${id}`),
};

/* ─── Customer Dashboard ─── */
export const customerApi = {
  bookings: () => apiGet('/customer/bookings'),
  serviceHistory: () => apiGet('/customer/service-history'),
  invoices: () => apiGet('/customer/invoices'),
};

/* ─── Reviews ─── */
export const reviewsApi = {
  listReviewable: () => apiGet('/customer/ratings/reviewables'),
  submit: (payload) => apiPost('/customer/ratings', payload),
};

/* ─── Billing ─── */
export const billingApi = {
  create: (payload) => apiPost('/api/billing/create', payload),
  listByUser: (userId) => apiGet(`/api/billing/user/${userId}`),
  listMine: () => apiGet('/api/billing/me'),
  listAll: (queryString = '') => apiGet(`/api/billing/all${queryString ? `?${queryString}` : ''}`),
  getByInvoice: (invoiceNumber) => apiGet(`/api/billing/${invoiceNumber}`),
  update: (invoiceNumber, payload) => apiPut(`/api/billing/${invoiceNumber}`, payload),
  listRegisteredCustomers: () => apiGet('/api/billing/customers/registered'),
  getRegisteredCustomerProfile: (userId) => apiGet(`/api/billing/customers/registered/${userId}`),
  refund: (payload) => apiPost('/api/billing/refund', payload),
  verify: (invoiceNumber) => apiPatch(`/api/billing/verify/${invoiceNumber}`),
};

/* ─── Payments ─── */
export const paymentApi = {
  getInvoiceByBookingId: (bookingId) => apiGet(`/payment-invoice/${bookingId}`),
};

/* ─── Notifications ─── */
export const notificationApi = {
  listAll: () => apiGet('/api/notifications/all'),
  listMine: () => apiGet('/api/notifications'),
  send: (payload) => apiPost('/api/notifications/send', payload),
  markRead: (id) => apiPut(`/api/notifications/${id}/read`),
  markAllRead: () => apiPatch('/api/notifications/read-all', {}),
};

/* ─── Contact ─── */
export const contactApi = {
  submit: (payload) => apiPost('/api/contact', payload, { auth: false }),
  list: () => apiGet('/api/contact', { auth: false }),
};

/* ─── Breakdown ─── */
export const breakdownApi = {
  createCall: (payload) => apiPost('/api/breakdown-calls', payload, { auth: false }),
  list: () => apiGet('/api/breakdown-calls', { auth: false }),
  getById: (id) => apiGet(`/api/breakdown-calls/${id}`, { auth: false }),
  update: (id, payload) => apiPut(`/api/breakdown-calls/${id}`, payload, { auth: false }),
};

/* ─── Services ─── */
export const servicesApi = {
  list: () => apiGet('/api/services', { auth: false }),
  getById: (id) => apiGet(`/api/services/${id}`, { auth: false }),
  create: (payload) => apiPost('/api/services', payload),
  update: (id, payload) => apiPut(`/api/services/${id}`, payload),
  delete: (id) => apiDelete(`/api/services/${id}`),
};

/* ─── Mechanics ─── */
export const mechanicsApi = {
  list: () => apiGet('/api/mechanics', { auth: false }),
  create: (payload) => apiPost('/api/mechanics', payload, { auth: false }),
  update: (id, payload) => apiPut(`/api/mechanics/${id}`, payload, { auth: false }),
};

/* ─── Assignments ─── */
export const assignmentsApi = {
  list: () => apiGet('/api/assignments', { auth: false }),
  getById: (id) => apiGet(`/api/assignments/${id}`, { auth: false }),
  create: (payload) => apiPost('/api/assignments', payload, { auth: false }),
  update: (id, payload) => apiPut(`/api/assignments/${id}`, payload, { auth: false }),
  delete: (id) => apiDelete(`/api/assignments/${id}`, { auth: false }),
};

/* ─── Modifications ─── */
export const modificationsApi = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        query.set(key, String(value));
      }
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiGet(`/api/modifications${suffix}`);
  },
  listMine: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        query.set(key, String(value));
      }
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiGet(`/api/modifications/me${suffix}`);
  },
  getById: (id) => apiGet(`/api/modifications/${id}`),
  create: (payload) => apiPost('/api/modifications', payload),
  setDecision: (id, payload) => apiPut(`/api/modifications/${id}/decision`, payload),
  respondQuote: (id, payload) => apiPut(`/api/modifications/${id}/admin-quote`, payload),
  updatePickupDrop: (id, payload) => apiPut(`/api/modifications/${id}/pickup-drop`, payload),
  updateStatus: (id, payload) => apiPut(`/api/modifications/${id}/status`, payload),
  createQuote: (payload) => apiPost('/api/mod-quotes', payload),
  listQuotes: () => apiGet('/api/mod-quotes'),
  updateQuote: (id, payload) => apiPut(`/api/mod-quotes/${id}`, payload),
  createOrder: (payload) => apiPost('/api/mod-orders', payload),
};

/* ─── Inventory ─── */
export const inventoryApi = {
  list: () => apiGet('/api/inventory'),
  create: (payload) => apiPost('/api/inventory', payload),
  update: (id, payload) => apiPut(`/api/inventory/${id}`, payload),
  delete: (id) => apiDelete(`/api/inventory/${id}`),
  lowStock: () => apiGet('/api/inventory/low-stock'),
  stockHistory: (partId) => apiGet(partId ? `/api/inventory/stock-history?partId=${partId}` : '/api/inventory/stock-history'),
  useInService: (payload) => apiPost('/api/inventory/use', payload),
  report: () => apiGet('/api/inventory/report'),
  createOrder: (payload) => apiPost('/api/inventory/orders', payload),
};

/* ─── Users ─── */
export const usersApi = {
  list: () => apiGet('/users'),
  getById: (id) => apiGet(`/users/${id}`),
  create: (payload) => apiPost('/users', payload),
  update: (id, payload) => apiPut(`/users/${id}`, payload),
  delete: (id) => apiDelete(`/users/${id}`),
};

/* ─── Vehicles ─── */
export const vehiclesApi = {
  listAll: async (queryString = '') => {
    const query = queryString ? `?${queryString}` : '';

    try {
      return await apiGet(`/api/get_vehicles.php${query}`);
    } catch (error) {
      if (error?.status !== 404) throw error;
    }

    try {
      return await apiGet(`/api/vehicles${query}`);
    } catch (error) {
      if (error?.status !== 404) throw error;
    }

    try {
      return await apiGet(`/vehicles/all${query}`);
    } catch (error) {
      if (error?.status !== 404) throw error;
    }

    return { success: true, data: [] };
  },
  listMine: (params = {}) => {
    const query = new URLSearchParams();

    if (params.userId) query.set('userId', params.userId);
    if (params.userObjectId) query.set('userObjectId', params.userObjectId);
    if (params.email) query.set('email', params.email);
    if (params.customerName) query.set('customerName', params.customerName);
    if (params.mobile) query.set('mobile', params.mobile);

    const suffix = query.toString() ? `?${query.toString()}` : '';
    return apiGet(`/api/vehicles/me${suffix}`);
  },
  listByUser: (userId) => apiGet(`/api/vehicles/user/${userId}`),
  createAdmin: (payload) => apiPost('/api/vehicles', payload),
  updateAdmin: (id, payload) => apiPut(`/api/vehicles/${id}`, payload),
  deleteAdmin: (id) => apiDelete(`/api/vehicles/${id}`),
  create: (payload) => apiPost('/vehicles', payload),
  getById: (id) => apiGet(`/vehicles/${id}`),
  update: (id, payload) => apiPut(`/vehicles/${id}`, payload),
  delete: (id) => apiDelete(`/vehicles/${id}`),
};

/* ─── Analytics ─── */
export const analyticsApi = {
  dashboard: () => apiGet('/api/analytics/dashboard', { auth: false }),
  revenue: () => apiGet('/api/analytics/revenue', { auth: false }),
  bookings: () => apiGet('/api/analytics/bookings', { auth: false }),
  customerSatisfaction: () => apiGet('/api/analytics/customer-satisfaction', { auth: false }),
  reportData: (queryString = '') => apiGet(`/api/reports/data${queryString ? `?${queryString}` : ''}`, { auth: false }),
  generateReport: (payload) => apiPost('/api/reports/generate', payload, { auth: false }),
};

/* ─── Settings ─── */
export const settingsApi = {
  get: () => apiGet('/api/settings', { auth: false }),
  update: (payload) => apiPut('/api/settings', payload, { auth: false }),
  getCompanyInfo: () => apiGet('/api/company-info', { auth: false }),
};

/* ─── Packages ─── */
export const packagesApi = {
  listAll: (query = '') => apiGet(`/api/packages${query ? `?${query}` : ''}`, { auth: false }),
  getById: (id) => apiGet(`/api/packages/${id}`, { auth: false }),
  create: (payload) => apiPost('/api/packages', payload),
  update: (id, payload) => apiPut(`/api/packages/${id}`, payload),
  delete: (id) => apiDelete(`/api/packages/${id}`),
  getMyPackages: () => apiGet('/api/packages/me'),
  renew: (id) => apiPost(`/api/packages/${id}/renew`),
  subscribe: (payload) => apiPost('/api/packages/subscribe', payload),
};

/* ─── Repairs ─── */
export const repairApi = {
  listAll: () => apiGet('/api/repairs', { auth: false }),
  schedule: (payload) => apiPost('/api/repairs/schedule', payload, { auth: false }),
  getStatus: (params) => apiGet(`/api/repairs/status?${new URLSearchParams(params)}`, { auth: false }),
};

/* ─── Upload ─── */
export const uploadApi = {
  profilePhoto: (payload) => apiPost('/api/uploads/profile-photo', payload),
};
