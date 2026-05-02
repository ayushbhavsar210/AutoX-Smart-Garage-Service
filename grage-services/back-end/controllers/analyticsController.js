const { getDB } = require('../config/db');

const getMonthStart = (baseDate = new Date()) => new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);

const parseDateSafe = (...values) => {
  for (const value of values) {
    if (!value) continue;
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
};

const toNumberSafe = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const isCompletedPaymentStatus = (status) => {
  const normalized = normalizeStatus(status);
  return ['completed', 'success', 'paid', 'captured'].includes(normalized);
};

const getPaymentEventDate = (payment) => parseDateSafe(
  payment?.paymentDate,
  payment?.verifiedAt,
  payment?.updatedAt,
  payment?.created_at,
  payment?.createdAt
);

const toUnifiedPaymentRecord = (record = {}) => ({
  sourceId:
    String(record?._id || '')
    || String(record?.transaction_id || '')
    || String(record?.razorpay_payment_id || '')
    || String(record?.paymentId || ''),
  amount: toNumberSafe(record?.amount),
  status: normalizeStatus(record?.status || record?.payment_status || record?.paymentStatus),
  method: record?.method || record?.paymentMethod || 'Online',
  userId: record?.userId || record?.user_id || record?.email || 'unknown',
  eventDate: getPaymentEventDate(record),
});

const formatTimeAgo = (dateValue) => {
  const date = parseDateSafe(dateValue);
  if (!date) return 'Just now';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-IN');
};

exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const db = getDB();
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = getMonthStart(now);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [bookings, users, totalServices, totalVehicles, payments, servicePayments, reviews] = await Promise.all([
      db.collection('bookings').find({}, { projection: { status: 1, createdAt: 1, scheduledAt: 1, serviceName: 1, serviceType: 1, customerName: 1, amount: 1 } }).toArray(),
      db.collection('users').find({}, { projection: { createdAt: 1, updatedAt: 1 } }).toArray(),
      db.collection('services').countDocuments(),
      db.collection('vehicles').countDocuments(),
      db.collection('payments').find({}, { projection: { amount: 1, status: 1, createdAt: 1, paymentDate: 1, verifiedAt: 1, method: 1 } }).toArray(),
      db.collection('service_payments').find({}, { projection: { amount: 1, status: 1, payment_status: 1, paymentStatus: 1, createdAt: 1, created_at: 1, paymentDate: 1, verifiedAt: 1, method: 1, paymentMethod: 1, transaction_id: 1, razorpay_payment_id: 1, email: 1, userId: 1, user_id: 1 } }).toArray(),
      db.collection('reviews').find({}, { projection: { rating: 1 } }).toArray(),
    ]);

    const activeBookingStatuses = new Set(['scheduled', 'in-progress', 'pending', 'confirmed']);
    const completedBookingStatuses = new Set(['completed', 'done']);

    let totalBookings = bookings.length;
    let activeBookings = 0;
    let completedBookings = 0;
    let thisMonthBookings = 0;
    let thisMonthBookingsPrev = 0;
    let bookingsThisWeek = 0;
    let pending = 0;
    let inProgress = 0;

    const topServiceMap = new Map();
    const recentActivity = [];

    for (const booking of bookings) {
      const status = normalizeStatus(booking.status);
      const bookingDate = parseDateSafe(booking.createdAt, booking.scheduledAt);

      if (activeBookingStatuses.has(status)) {
        activeBookings += 1;
      }
      if (completedBookingStatuses.has(status)) {
        completedBookings += 1;
      }
      if (status === 'pending') pending += 1;
      if (status === 'in-progress') inProgress += 1;

      if (bookingDate) {
        if (bookingDate >= monthStart) thisMonthBookings += 1;
        if (bookingDate >= prevMonthStart && bookingDate < monthStart) thisMonthBookingsPrev += 1;
        if (bookingDate >= weekStart) bookingsThisWeek += 1;
      }

      const serviceLabel = booking.serviceName || booking.serviceType || 'Service';
      topServiceMap.set(serviceLabel, (topServiceMap.get(serviceLabel) || 0) + 1);

      recentActivity.push({
        id: `booking-${booking._id}`,
        ts: bookingDate ? bookingDate.getTime() : 0,
        type: 'booking',
        icon: '📅',
        name: booking.customerName || 'Customer',
        action: `${serviceLabel} booking ${status || 'created'}`,
        time: formatTimeAgo(bookingDate),
      });
    }

    const unifiedPayments = [...payments, ...servicePayments].map(toUnifiedPaymentRecord);
    let totalRevenue = 0;
    let dailyRevenue = 0;
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;
    let previousMonthRevenue = 0;

    for (const payment of unifiedPayments) {
      if (!isCompletedPaymentStatus(payment.status)) continue;

      const amount = toNumberSafe(payment.amount);
      const paymentDate = payment.eventDate;
      totalRevenue += amount;

      if (paymentDate) {
        if (paymentDate >= dayStart) dailyRevenue += amount;
        if (paymentDate >= monthStart) monthlyRevenue += amount;
        if (paymentDate >= prevMonthStart && paymentDate < monthStart) previousMonthRevenue += amount;
        if (paymentDate >= yearStart) yearlyRevenue += amount;
      }

      recentActivity.push({
        id: `payment-${payment.sourceId || 'unknown'}`,
        ts: paymentDate ? paymentDate.getTime() : 0,
        type: 'payment',
        icon: '💳',
        name: 'Payment',
        action: `${payment.method || 'Online'} payment received (₹${amount.toLocaleString('en-IN')})`,
        time: formatTimeAgo(paymentDate),
      });
    }

    const totalCustomers = users.length;
    let activeCustomers = 0;
    let thisMonthCustomers = 0;
    let previousMonthCustomers = 0;
    for (const user of users) {
      const userDate = parseDateSafe(user.updatedAt, user.createdAt);
      if (!userDate) continue;
      if (userDate >= monthStart) {
        activeCustomers += 1;
        thisMonthCustomers += 1;
      }
      if (userDate >= prevMonthStart && userDate < monthStart) {
        previousMonthCustomers += 1;
      }
    }

    const avgRatingRaw = reviews.length
      ? reviews.reduce((sum, item) => sum + toNumberSafe(item.rating), 0) / reviews.length
      : 0;
    const avgRating = Number(avgRatingRaw.toFixed(1));

    const topServicesBase = Array.from(topServiceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
    const topServiceTotal = topServicesBase.reduce((sum, item) => sum + item.value, 0) || 1;
    const topServices = topServicesBase.map((item) => ({
      ...item,
      percentage: Math.round((item.value / topServiceTotal) * 100),
    }));

    const growth = {
      bookings: thisMonthBookingsPrev > 0
        ? Math.round(((thisMonthBookings - thisMonthBookingsPrev) / thisMonthBookingsPrev) * 100)
        : (thisMonthBookings > 0 ? 100 : 0),
      revenue: previousMonthRevenue > 0
        ? Math.round(((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
        : (monthlyRevenue > 0 ? 100 : 0),
      customers: previousMonthCustomers > 0
        ? Math.round(((thisMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100)
        : (thisMonthCustomers > 0 ? 100 : 0),
    };

    const metrics = {
      totalBookings,
      activeBookings,
      activeServices: activeBookings,
      completedServices: completedBookings,
      totalCustomers,
      totalUsers: totalCustomers,
      activeCustomers,
      totalServices,
      totalVehicles,
      totalRevenue,
      dailyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      avgRating,
      averageRating: avgRating,
      thisMonthRevenue: monthlyRevenue,
      thisMonthBookings,
      topServices,
      quickStats: {
        bookingsThisWeek,
        pending,
        inProgress,
        completed: completedBookings,
      },
      performance: {
        satisfaction: Math.round(Math.max(0, Math.min(100, avgRating * 20))),
        onTime: totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0,
        retention: totalCustomers > 0 ? Math.round((activeCustomers / totalCustomers) * 100) : 0,
      },
      recentActivity: recentActivity.sort((a, b) => b.ts - a.ts).slice(0, 8),
      growth,
    };

    return res.json({ success: true, data: metrics });
  } catch (error) {
    return next(error);
  }
};

exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const db = getDB();
    const { period } = req.query;

    const [payments, servicePayments, bookings] = await Promise.all([
      db.collection('payments').find({}, { projection: { amount: 1, status: 1, createdAt: 1, paymentDate: 1, verifiedAt: 1, userId: 1 } }).toArray(),
      db.collection('service_payments').find({}, { projection: { amount: 1, status: 1, payment_status: 1, paymentStatus: 1, createdAt: 1, created_at: 1, paymentDate: 1, verifiedAt: 1, userId: 1, user_id: 1, email: 1, transaction_id: 1, razorpay_payment_id: 1 } }).toArray(),
      db.collection('bookings').find({}, { projection: { status: 1, serviceName: 1, serviceType: 1, amount: 1 } }).toArray(),
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthlyMap = new Map();
    const customerSpendMap = new Map();
    let total = 0;

    const unifiedPayments = [...payments, ...servicePayments].map(toUnifiedPaymentRecord);
    for (const payment of unifiedPayments) {
      if (!isCompletedPaymentStatus(payment.status)) continue;

      const amount = toNumberSafe(payment.amount);
      const date = payment.eventDate;
      total += amount;

      if (date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + amount);
      }

      const customerKey = String(payment.userId || 'unknown');
      customerSpendMap.set(customerKey, (customerSpendMap.get(customerKey) || 0) + amount);
    }

    const monthlyRevenue = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([monthKey, revenue]) => {
        const [, m] = monthKey.split('-');
        const monthIdx = parseInt(m, 10) - 1;
        return {
          month: monthNames[monthIdx] || monthKey,
          revenue,
          target: Math.round(revenue * 1.15),
        };
      });

    const completedBookingStatuses = new Set(['completed', 'done']);
    const categoryMap = new Map();

    for (const booking of bookings) {
      const status = normalizeStatus(booking.status);
      if (!completedBookingStatuses.has(status)) continue;

      const category = booking.serviceName || booking.serviceType || 'Service';
      const amount = toNumberSafe(booking.amount);
      const existing = categoryMap.get(category) || { category, revenue: 0, bookings: 0 };
      existing.revenue += amount;
      existing.bookings += 1;
      categoryMap.set(category, existing);
    }

    const serviceCategories = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);
    const topCustomers = Array.from(customerSpendMap.entries())
      .map(([customerId, totalSpent]) => ({ customerId, totalSpent }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    const revenueData = {
      period: period || 'monthly',
      total,
      monthlyRevenue,
      serviceCategories,
      breakdown: monthlyRevenue.map((item) => ({ month: item.month, amount: item.revenue })),
      byService: serviceCategories,
      topCustomers,
    };

    return res.json({ success: true, data: revenueData });
  } catch (error) {
    return next(error);
  }
};

exports.getBookingTrends = async (req, res, next) => {
  try {
    const db = getDB();
    const { period } = req.query;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const bookings = await db.collection('bookings').find({}, { projection: { status: 1, scheduledAt: 1, createdAt: 1 } }).toArray();

    const totalBookings = bookings.length;
    const completedStatuses = new Set(['completed', 'done']);
    const cancelledStatuses = new Set(['cancelled', 'canceled']);

    const today = new Date();
    const dayBuckets = new Map();
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setHours(0, 0, 0, 0);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayBuckets.set(key, { date: key, bookings: 0, completed: 0, cancelled: 0 });
    }

    for (const booking of bookings) {
      const date = parseDateSafe(booking.scheduledAt, booking.createdAt);
      if (!date) continue;
      const key = date.toISOString().slice(0, 10);
      if (!dayBuckets.has(key)) continue;

      const bucket = dayBuckets.get(key);
      bucket.bookings += 1;
      const status = normalizeStatus(booking.status);
      if (completedStatuses.has(status)) bucket.completed += 1;
      if (cancelledStatuses.has(status)) bucket.cancelled += 1;
    }

    const data = Array.from(dayBuckets.values());
    const dailyBookings = data.map((item) => {
      const d = new Date(item.date);
      const dayLabel = `${dayNames[d.getDay()]} ${item.date.slice(8)}`;
      return { day: dayLabel, bookings: item.bookings, completed: item.completed, cancelled: item.cancelled };
    });

    return res.json({
      success: true,
      data: {
        period: period || 'weekly',
        totalBookings,
        dailyBookings,
        data: data.map((item) => ({ date: item._id, bookings: item.bookings, completed: item.completed, cancelled: item.cancelled })),
        peakHours: []
      }
    });
  } catch (error) {
    return next(error);
  }
};

exports.getCustomerSatisfaction = async (req, res, next) => {
  try {
    const db = getDB();
    const reviews = await db.collection('reviews').find().toArray();

    if (reviews.length === 0) {
      return res.json({ success: true, data: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        nps: 0,
        comments: { positive: 0, neutral: 0, negative: 0 },
        topCompliments: [],
        commonComplaints: []
      }});
    }

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) / totalReviews;
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((item) => {
      const rating = Math.max(1, Math.min(5, Math.round(Number(item.rating || 0))));
      ratingDistribution[rating] += 1;
    });

    const ratings = Object.entries(ratingDistribution).map(([star, count]) => ({
      rating: `${star} Star`,
      count
    }));

    return res.json({ success: true, data: {
      averageRating: Number(averageRating.toFixed(2)),
      avgRating: Number(averageRating.toFixed(1)),
      totalReviews,
      ratingDistribution,
      ratings,
      nps: 0,
      comments: { positive: 0, neutral: 0, negative: 0 },
      topCompliments: [],
      commonComplaints: []
    }});
  } catch (error) {
    return next(error);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const db = getDB();
    const { reportType, startDate, endDate } = req.body;

    if (!reportType) {
      return res.status(400).json({ success: false, message: 'reportType is required' });
    }

    const timestamp = Date.now();
    const report = {
      reportId: `RPT-${timestamp}`,
      reportType,
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      summary: 'Report generated successfully',
      downloadUrl: `/api/reports/download/${timestamp}`
    };

    await db.collection('reports').insertOne(report);
    return res.status(201).json({ success: true, data: report });
  } catch (error) {
    return next(error);
  }
};

exports.getReportData = async (req, res, next) => {
  try {
    const db = getDB();
    const {
      reportType = 'bookings',
      fromDate,
      toDate,
      status,
      search,
      limit: limitRaw,
    } = req.query;

    const limit = Math.min(Math.max(Number(limitRaw) || 2000, 1), 10000);
    const lowerType = String(reportType).toLowerCase();

    const reportConfigs = {
      users: {
        title: 'Users Report',
        collection: 'users',
        dateField: 'createdAt',
        statusField: 'isActive',
        searchableFields: ['fullName', 'name', 'email', 'phone'],
        columns: [
          { key: 'id', header: 'ID' },
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Phone' },
          { key: 'status', header: 'Status' },
          { key: 'date', header: 'Date' },
        ],
        project: {
          _id: 0,
          id: { $toString: '$_id' },
          name: { $ifNull: ['$fullName', { $ifNull: ['$name', 'N/A'] }] },
          email: { $ifNull: ['$email', 'N/A'] },
          phone: { $ifNull: ['$phone', 'N/A'] },
          status: { $cond: [{ $eq: ['$isActive', true] }, 'active', 'inactive'] },
          date: '$__reportDate',
        },
        amountField: null,
      },
      bookings: {
        title: 'Bookings Report',
        collection: 'bookings',
        dateField: 'scheduledAt',
        statusField: 'status',
        searchableFields: ['customerName', 'name', 'email', 'vehicleNumber', 'serviceName', 'serviceType'],
        columns: [
          { key: 'id', header: 'ID' },
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'service', header: 'Service' },
          { key: 'amount', header: 'Amount' },
          { key: 'status', header: 'Status' },
          { key: 'date', header: 'Date' },
        ],
        project: {
          _id: 0,
          id: { $ifNull: ['$bookingNo', { $toString: '$_id' }] },
          name: { $ifNull: ['$customerName', { $ifNull: ['$name', 'N/A'] }] },
          email: { $ifNull: ['$email', 'N/A'] },
          service: { $ifNull: ['$serviceName', { $ifNull: ['$serviceType', 'N/A'] }] },
          amount: { $ifNull: ['$amount', 0] },
          status: { $ifNull: ['$status', 'pending'] },
          date: '$__reportDate',
        },
        amountField: 'amount',
      },
      payments: {
        title: 'Payments Report',
        collection: 'payments',
        dateField: 'createdAt',
        statusField: 'status',
        searchableFields: ['paymentId', 'method'],
        columns: [
          { key: 'id', header: 'Payment ID' },
          { key: 'name', header: 'Method' },
          { key: 'amount', header: 'Amount' },
          { key: 'status', header: 'Status' },
          { key: 'date', header: 'Date' },
        ],
        project: {
          _id: 0,
          id: { $ifNull: ['$paymentId', { $toString: '$_id' }] },
          name: { $ifNull: ['$method', 'N/A'] },
          amount: { $ifNull: ['$amount', 0] },
          status: { $ifNull: ['$status', 'pending'] },
          date: '$__reportDate',
        },
        amountField: 'amount',
      },
      billing: {
        title: 'Billing Report',
        collection: 'billing_records',
        dateField: 'createdAt',
        statusField: 'status',
        searchableFields: ['invoiceNumber', 'currency'],
        columns: [
          { key: 'id', header: 'Invoice No' },
          { key: 'amount', header: 'Amount' },
          { key: 'currency', header: 'Currency' },
          { key: 'status', header: 'Status' },
          { key: 'date', header: 'Date' },
        ],
        project: {
          _id: 0,
          id: { $ifNull: ['$invoiceNumber', { $toString: '$_id' }] },
          amount: { $ifNull: ['$amount', 0] },
          currency: { $ifNull: ['$currency', 'INR'] },
          status: { $ifNull: ['$status', 'issued'] },
          date: '$__reportDate',
        },
        amountField: 'amount',
      },
      contacts: {
        title: 'Contact Submissions Report',
        collection: 'contact_submissions',
        dateField: 'createdAt',
        statusField: 'status',
        searchableFields: ['name', 'email', 'phone', 'service'],
        columns: [
          { key: 'id', header: 'ID' },
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'service', header: 'Service' },
          { key: 'status', header: 'Status' },
          { key: 'date', header: 'Date' },
        ],
        project: {
          _id: 0,
          id: { $toString: '$_id' },
          name: { $ifNull: ['$name', 'N/A'] },
          email: { $ifNull: ['$email', 'N/A'] },
          service: { $ifNull: ['$service', 'N/A'] },
          status: { $ifNull: ['$status', 'new'] },
          date: '$__reportDate',
        },
        amountField: null,
      },
    };

    const config = reportConfigs[lowerType];
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reportType. Use one of: users, bookings, payments, billing, contacts',
      });
    }

    const match = {};
    const searchText = String(search || '').trim();
    if (searchText) {
      const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      match.$or = config.searchableFields.map((field) => ({ [field]: regex }));
    }

    const statusText = String(status || '').trim().toLowerCase();
    if (statusText && config.statusField) {
      if (lowerType === 'users') {
        if (statusText === 'active') match.isActive = true;
        if (statusText === 'inactive') match.isActive = false;
      } else {
        match[config.statusField] = statusText;
      }
    }

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (to && !Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
    }

    const validFrom = from && !Number.isNaN(from.getTime()) ? from : null;
    const validTo = to && !Number.isNaN(to.getTime()) ? to : null;

    const pipelineBase = [
      {
        $addFields: {
          __reportDate: {
            $convert: {
              input: `$${config.dateField}`,
              to: 'date',
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $match: {
          ...match,
          ...(validFrom || validTo
            ? {
                __reportDate: {
                  ...(validFrom ? { $gte: validFrom } : {}),
                  ...(validTo ? { $lte: validTo } : {}),
                },
              }
            : {}),
        },
      },
    ];

    const collection = db.collection(config.collection);

    const [records, countAgg, amountAgg, statusAgg] = await Promise.all([
      collection
        .aggregate([
          ...pipelineBase,
          { $sort: { __reportDate: -1, _id: -1 } },
          { $project: config.project },
          { $limit: limit },
        ])
        .toArray(),
      collection.aggregate([...pipelineBase, { $count: 'total' }]).toArray(),
      config.amountField
        ? collection
            .aggregate([
              ...pipelineBase,
              { $group: { _id: null, totalAmount: { $sum: { $ifNull: [`$${config.amountField}`, 0] } } } },
            ])
            .toArray()
        : Promise.resolve([]),
      config.statusField
        ? collection
            .aggregate([
              ...pipelineBase,
              {
                $group: {
                  _id:
                    lowerType === 'users'
                      ? { $cond: [{ $eq: ['$isActive', true] }, 'active', 'inactive'] }
                      : { $toString: `$${config.statusField}` },
                },
              },
              { $sort: { _id: 1 } },
            ])
            .toArray()
        : Promise.resolve([]),
    ]);

    return res.json({
      success: true,
      data: {
        reportType: lowerType,
        title: config.title,
        columns: config.columns,
        records,
        summary: {
          totalRecords: countAgg[0]?.total || 0,
          totalAmount: amountAgg[0]?.totalAmount || 0,
          fromDate: validFrom,
          toDate: validTo,
          generatedAt: new Date().toISOString(),
        },
        statuses: statusAgg.map((item) => String(item._id || '').toLowerCase()).filter(Boolean),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.scheduleReport = async (req, res, next) => {
  try {
    const db = getDB();
    const { reportType, frequency, email } = req.body;

    if (!reportType || !frequency || !email) {
      return res.status(400).json({ success: false, message: 'reportType, frequency, and email are required' });
    }

    const scheduled = {
      scheduleId: `SCH-${Date.now()}`,
      reportType,
      frequency,
      email,
      status: 'active',
      createdAt: new Date().toISOString(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    await db.collection('report_schedules').insertOne(scheduled);
    return res.status(201).json({ success: true, data: scheduled });
  } catch (error) {
    return next(error);
  }
};
