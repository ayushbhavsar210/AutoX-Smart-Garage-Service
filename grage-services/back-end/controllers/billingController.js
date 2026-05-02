const { getDB } = require('../config/db');
const { ObjectId } = require('mongodb');
const sendEmail = require('../utils/sendEmail');

const formatCurrency = (value) => `INR ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const round2 = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

const GST_RATE_SERVICE = 18;
const GST_RATE_PARTS = 28;

const GST_RULES = [
  { label: 'Service / Labour Charge', rate: 18, keywords: ['service', 'labour', 'labor', 'washing', 'painting', 'denting'] },
  { label: 'Engine Oil / Lubricants', rate: 18, keywords: ['oil', 'lubricant', 'coolant', 'grease', 'fluid'] },
  { label: 'Electrical Parts', rate: 28, keywords: ['electrical', 'headlight', 'horn', 'battery'] },
  { label: 'Tyres / Tubes', rate: 28, keywords: ['tyre', 'tire', 'tube', 'wheel'] },
  { label: 'Brake Parts', rate: 28, keywords: ['brake'] },
  { label: 'Clutch Parts', rate: 28, keywords: ['clutch'] },
  { label: 'Filters', rate: 28, keywords: ['filter'] },
  { label: 'Body Parts', rate: 28, keywords: ['body', 'bumper', 'mirror', 'panel'] },
  { label: 'Accessories', rate: 28, keywords: ['accessor', 'seat cover', 'grip', 'visor'] },
  { label: 'Spare Parts', rate: 28, keywords: ['engine', 'transmission', 'suspension', 'exhaust', 'battery', 'parts', 'part'] },
];

const resolveGstCategoryAndRate = ({ category = '', itemType = 'part', name = '' }) => {
  const normalizedCategory = String(category || '').toLowerCase();
  const normalizedName = String(name || '').toLowerCase();
  const haystack = `${normalizedCategory} ${normalizedName}`.trim();

  for (const rule of GST_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return { gstCategory: rule.label, gstRate: rule.rate };
    }
  }

  if (String(itemType || '').toLowerCase() === 'service') {
    return { gstCategory: 'Service / Labour Charge', gstRate: GST_RATE_SERVICE };
  }

  return { gstCategory: 'Spare Parts', gstRate: GST_RATE_PARTS };
};

const sendInvoiceEmail = async (to, subject, html) => {
  if (!to) return;
  try {
    await sendEmail(to, subject, html);
  } catch (error) {
    console.error('INVOICE EMAIL ERROR:', error?.message || error);
  }
};

const buildInvoiceEmailTemplate = (record = {}) => {
  const lineItems = Array.isArray(record?.lineItems) ? record.lineItems : [];
  const rows = lineItems
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${toSafeString(item?.name, 'Item')}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${toSafeString(item?.gstCategory, 'Spare Parts')}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${toNumber(item?.quantity, 1)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item?.price)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${toNumber(item?.gstRate, 0)}%</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item?.gstAmount)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item?.total)}</td>
        </tr>
      `
    )
    .join('');

  const subtotal = toNumber(record?.subtotal, toNumber(record?.lineItems?.reduce((sum, item) => sum + toNumber(item?.total), 0), 0));
  const serviceCharge = toNumber(record?.serviceCharge, 0);
  const discount = toNumber(record?.discount, 0);
  const discountPercent = toNumber(record?.discountPercent, 0);
  const gst = toNumber(record?.gst, 0);
  const finalTotal = toNumber(record?.finalTotal, toNumber(record?.totalAmount, toNumber(record?.amount, 0)));

  return `
    <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:24px;">
      <div style="max-width:720px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#0f172a;color:#fff;padding:18px 22px;"><h2 style="margin:0;">Invoice Generated</h2></div>
        <div style="padding:20px 22px;color:#1f2937;line-height:1.6;">
          <p style="margin:0 0 12px;">Hello <strong>${toSafeString(record?.customerDetails?.name, 'Customer')}</strong>,</p>
          <p style="margin:0 0 12px;">Your invoice has been generated successfully.</p>
          <p style="margin:0 0 8px;"><strong>Invoice Number:</strong> ${toSafeString(record?.invoiceNumber, 'N/A')}</p>
          <p style="margin:0 0 8px;"><strong>Status:</strong> ${toSafeString(record?.status, 'issued')}</p>
          <p style="margin:0 0 8px;"><strong>Line Items:</strong> ${formatCurrency(toNumber(record?.lineItems?.reduce((sum, item) => sum + toNumber(item?.total), 0), 0))}</p>
          <p style="margin:0 0 8px;"><strong>Service Charge:</strong> ${formatCurrency(serviceCharge)}</p>
          <p style="margin:0 0 8px;"><strong>Discount${discountPercent > 0 ? ` (${discountPercent.toFixed(2)}%)` : ''}:</strong> - ${formatCurrency(discount)}</p>
          <p style="margin:0 0 8px;"><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</p>
          <p style="margin:0 0 8px;"><strong>GST (Auto):</strong> ${formatCurrency(gst)}</p>
          <p style="margin:0 0 14px;"><strong>Total Amount (with GST):</strong> ${formatCurrency(finalTotal)}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f9fafb;">
                <th style="text-align:left;padding:8px;">Item</th>
                <th style="text-align:left;padding:8px;">GST Category</th>
                <th style="text-align:center;padding:8px;">Qty</th>
                <th style="text-align:right;padding:8px;">Rate</th>
                <th style="text-align:right;padding:8px;">GST %</th>
                <th style="text-align:right;padding:8px;">GST Amount</th>
                <th style="text-align:right;padding:8px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="7" style="padding:10px;text-align:center;color:#6b7280;">No line items</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
};

const buildInvoiceNumber = async (db) => {
  const [lastInvoice] = await db
    .collection('billing_records')
    .find({ invoiceNumber: /^INV-\d+$/ })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  const lastNumber = Number(lastInvoice?.invoiceNumber?.split('-')[1] || 1000);
  return `INV-${lastNumber + 1}`;
};

const buildPaymentId = async (db) => {
  const [lastPayment] = await db
    .collection('payments')
    .find({ paymentId: /^PAY-\d+$/ })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  const lastNumber = Number(lastPayment?.paymentId?.split('-')[1] || 1);
  return `PAY-${lastNumber + 1}`;
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toSafeString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const normalizeCustomerType = (value) => {
  const normalized = toSafeString(value).toLowerCase();
  if (['registered', 'registered_user', 'registered-user', 'registereduser'].includes(normalized)) {
    return 'registered';
  }
  if (['offline', 'offline_customer', 'offline-customer', 'walk-in', 'walkin'].includes(normalized)) {
    return 'offline';
  }
  return '';
};

const normalizePaymentMethod = (value) => {
  const normalized = toSafeString(value).toLowerCase();
  if (!normalized) return 'cash';
  if (['cash', 'cash-payment', 'cash_payment'].includes(normalized)) return 'cash';
  if (['razorpay', 'online', 'upi', 'card'].includes(normalized)) return 'razorpay';
  return normalized;
};

const normalizePaymentStatus = (value) => {
  const normalized = toSafeString(value).toLowerCase();
  if (!normalized) return 'pending';
  if (['paid', 'completed', 'success', 'successful', 'captured'].includes(normalized)) return 'paid';
  if (['pending', 'initiated', 'created'].includes(normalized)) return 'pending';
  if (['failed', 'cancelled', 'canceled'].includes(normalized)) return 'failed';
  return normalized;
};

const isPaymentCompleted = (value) => normalizePaymentStatus(value) === 'paid';

const parseDateFilter = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const buildUserFilters = (rawUserId) => {
  const idText = toSafeString(rawUserId);
  const num = Number(idText);
  const filters = [];

  if (idText) {
    if (ObjectId.isValid(idText) && String(new ObjectId(idText)) === idText) {
      filters.push({ _id: new ObjectId(idText) });
      filters.push({ userObjectId: idText });
      filters.push({ userId: idText });
    }

    if (Number.isFinite(num)) {
      filters.push({ userId: num });
      filters.push({ userId: String(num) });
    }

    filters.push({ userId: idText });
  }

  return filters;
};

const dedupeBillingEntries = (records = []) => {
  const priorityBySource = {
    billing_records: 3,
    bookings: 2,
    service_payments: 1,
  };

  const map = new Map();

  records.forEach((record) => {
    const invoice = toSafeString(record?.invoiceNumber);
    const transaction = toSafeString(record?.transactionId);
    const fallback = `${toSafeString(record?._source)}:${toSafeString(record?._sourceId)}`;
    const key = invoice || transaction || fallback;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, record);
      return;
    }

    const nextPriority = priorityBySource[toSafeString(record?._source)] || 0;
    const prevPriority = priorityBySource[toSafeString(existing?._source)] || 0;

    if (nextPriority >= prevPriority) {
      map.set(key, { ...existing, ...record });
    }
  });

  return Array.from(map.values());
};

const mapBillingRecordForResponse = (record = {}) => ({
  ...record,
  invoiceNumber: toSafeString(record.invoiceNumber) || `INV-${Date.now()}`,
  serviceName:
    toSafeString(record.serviceName) ||
    toSafeString(record?.lineItems?.[0]?.name) ||
    toSafeString(record.bookingId) ||
    'Service',
  totalAmount: toNumber(record.finalTotal, toNumber(record.totalAmount, toNumber(record.amount, 0))),
  paymentMethod: toSafeString(record.paymentMethod || record.method || 'cash'),
  paymentStatus: toSafeString(record.paymentStatus || record.status || 'pending'),
  paymentDate: record.paymentDate || record.verifiedAt || record.createdAt || null,
  transactionId: toSafeString(record.transactionId || record.razorpayPaymentId || ''),
  bookingId: toSafeString(record.bookingId || ''),
  _source: 'billing_records',
  _sourceId: toSafeString(record._id),
});

const mapBookingForBillingResponse = (booking = {}) => ({
  invoiceNumber: isCompletedBookingStatus(booking?.status || booking?.bookingStatus)
    ? toSafeString(booking.invoiceNumber)
    : '',
  serviceName: toSafeString(booking.serviceName || booking.service || 'Service Booking'),
  totalAmount: toNumber(booking.totalAmount, toNumber(booking.amount, 0)),
  paymentMethod: toSafeString(booking.paymentMethod || booking.method || 'Razorpay'),
  paymentStatus: isCompletedBookingStatus(booking?.status || booking?.bookingStatus)
    ? toSafeString(booking.paymentStatus || booking.status || 'completed')
    : 'service_pending',
  paymentDate: booking.paymentDate || booking.updatedAt || booking.createdAt || null,
  transactionId: toSafeString(booking.transactionId || booking.razorpayPaymentId || booking.razorpay_payment_id),
  bookingId: toSafeString(booking.id || booking.bookingId || booking._id),
  userId: booking.userId,
  customerDetails: {
    name: toSafeString(booking.customerName || booking.name),
    phone: toSafeString(booking.phone),
    email: toSafeString(booking.email),
    address: toSafeString(booking.address || booking.city),
  },
  vehicleDetails: {
    number: toSafeString(booking.vehicleNumber || booking.registration),
    model: toSafeString(booking.vehicleModel || booking.vehicle),
    company: toSafeString(booking.vehicleCompany || booking.make),
  },
  bookingStatus: normalizeLifecycleStatus(booking.status || booking.bookingStatus),
  createdAt: booking.createdAt,
  _source: 'bookings',
  _sourceId: toSafeString(booking._id || booking.id),
});

const mapServicePaymentForBillingResponse = (payment = {}, linkedBooking = null) => ({
  invoiceNumber: isCompletedBookingStatus(linkedBooking?.status || linkedBooking?.bookingStatus)
    ? (toSafeString(payment.invoice_number) || toSafeString(linkedBooking?.invoiceNumber))
    : '',
  serviceName: toSafeString(payment.service_name || linkedBooking?.serviceName || 'Service Booking'),
  totalAmount: toNumber(payment.amount, 0),
  paymentMethod: toSafeString(payment.paymentMethod || linkedBooking?.paymentMethod || 'Razorpay'),
  paymentStatus: isCompletedBookingStatus(linkedBooking?.status || linkedBooking?.bookingStatus)
    ? toSafeString(payment.payment_status || payment.status || linkedBooking?.paymentStatus || 'completed')
    : 'service_pending',
  paymentDate: payment.verifiedAt || linkedBooking?.paymentDate || payment.updatedAt || payment.created_at || payment.createdAt || null,
  transactionId: toSafeString(payment.transaction_id || payment.razorpay_payment_id || linkedBooking?.transactionId),
  bookingId: toSafeString(payment.booking_id || linkedBooking?.id || linkedBooking?._id),
  customerDetails: {
    name: toSafeString(payment.customer_name || payment.name || linkedBooking?.customerName || linkedBooking?.name),
    phone: toSafeString(payment.phone || linkedBooking?.phone),
    email: toSafeString(payment.email || linkedBooking?.email),
    address: toSafeString(payment.address || payment.city || linkedBooking?.address || linkedBooking?.city),
  },
  vehicleDetails: {
    number: toSafeString(payment.vehicle_number || payment.vehicleNumber || payment.registration || linkedBooking?.vehicleNumber || linkedBooking?.registration),
    model: toSafeString(payment.vehicle_model || payment.vehicleModel || payment.vehicle || linkedBooking?.vehicleModel || linkedBooking?.vehicle),
    company: toSafeString(payment.vehicle_company || payment.vehicleCompany || payment.make || linkedBooking?.vehicleCompany || linkedBooking?.make),
  },
  bookingStatus: normalizeLifecycleStatus(linkedBooking?.status || linkedBooking?.bookingStatus),
  createdAt: payment.createdAt || payment.created_at || linkedBooking?.createdAt,
  _source: 'service_payments',
  _sourceId: toSafeString(payment._id),
});

const normalizeVehicleNumber = (value) => toSafeString(value).toUpperCase();

const isCompletedBookingStatus = (value) => {
  const normalized = toSafeString(value).toLowerCase();
  return ['completed', 'complete', 'done', 'service completed'].includes(normalized);
};

const normalizeLifecycleStatus = (value) => {
  const normalized = toSafeString(value).toLowerCase();
  if (isCompletedBookingStatus(normalized)) return 'completed';
  if (['in-progress', 'in progress', 'progress', 'working'].includes(normalized)) return 'in-progress';
  if (['scheduled', 'confirmed', 'pending', 'created', 'booked'].includes(normalized)) return 'pending';
  if (['cancelled', 'canceled'].includes(normalized)) return 'canceled';
  return normalized || 'pending';
};

const getRegisteredCustomerSnapshot = async (db, rawUserId) => {
  const userFilters = buildUserFilters(rawUserId);
  if (!userFilters.length) return null;

  const user = await db.collection('users').findOne({ $or: userFilters });
  if (!user) return null;

  const numericUserId = Number(user.userId);
  const userObjectId = toSafeString(user._id);
  const vehicleFilters = [];

  if (Number.isFinite(numericUserId)) {
    vehicleFilters.push({ userId: numericUserId });
    vehicleFilters.push({ userId: String(numericUserId) });
    vehicleFilters.push({ user_id: numericUserId });
    vehicleFilters.push({ user_id: String(numericUserId) });
  }

  if (userObjectId) {
    vehicleFilters.push({ userId: userObjectId });
    vehicleFilters.push({ user_id: userObjectId });
    vehicleFilters.push({ userObjectId });
  }

  const vehicleFilter = vehicleFilters.length ? { $or: vehicleFilters } : { userId: userObjectId };

  const vehicles = await db
    .collection('vehicles')
    .find(vehicleFilter)
    .sort({ createdAt: -1 })
    .toArray();

  const displayName = toSafeString(user.fullName) || toSafeString(user.name) || toSafeString(user.email) || 'Registered Customer';

  return {
    user,
    vehicles,
    customerDetails: {
      name: displayName,
      phone: toSafeString(user.phone) || 'N/A',
      email: toSafeString(user.email),
    },
  };
};

const vehicleNumberOf = (vehicle = {}) =>
  toSafeString(vehicle?.plate || vehicle?.vehicle_number || vehicle?.vehicleNumber).toUpperCase();

const vehicleModelOf = (vehicle = {}) => toSafeString(vehicle?.model || vehicle?.vehicle_model);

const vehicleCompanyOf = (vehicle = {}) =>
  toSafeString(vehicle?.make || vehicle?.vehicle_company || vehicle?.vehicleCompany);

const normalizeLineItems = (lineItems = []) => {
  if (!Array.isArray(lineItems)) return [];

  return lineItems
    .map((item) => {
      const quantity = Math.max(1, toNumber(item?.quantity, 1));
      const price = Math.max(0, toNumber(item?.price, 0));
      const total = quantity * price;
      const gstRate = Math.max(0, toNumber(item?.gstRate, 0));
      const gstAmount = round2(total * gstRate / 100);

      return {
        name: toSafeString(item?.name),
        itemType: toSafeString(item?.itemType) || 'service',
        category: toSafeString(item?.category),
        gstCategory: toSafeString(item?.gstCategory),
        gstRate,
        gstAmount,
        quantity,
        price,
        total,
      };
    })
    .filter((item) => item.name);
};

const normalizeName = (value) => toSafeString(value).toLowerCase();

const getNextNumericId = async (db, collectionName) => {
  const [last] = await db
    .collection(collectionName)
    .find({ id: { $type: 'number' } })
    .sort({ id: -1 })
    .limit(1)
    .toArray();

  return (last?.id || 0) + 1;
};

const validateAndResolveInventoryLineItems = async (db, lineItems = []) => {
  if (!lineItems.length) return [];

  const inventoryParts = await db
    .collection('inventory')
    .find({}, { projection: { id: 1, name: 1, category: 1, sellingPrice: 1, price: 1, stock: 1 } })
    .toArray();

  const inventoryMap = new Map(
    inventoryParts
      .map((part) => [normalizeName(part.name), part])
      .filter(([key]) => Boolean(key))
  );

  const invalidItems = [];
  const resolved = lineItems.map((item) => {
    const inventoryPart = inventoryMap.get(normalizeName(item.name));
    if (!inventoryPart) {
      invalidItems.push(item.name);
      return item;
    }

    const quantity = Math.max(1, toNumber(item.quantity, 1));
    const partPrice = Math.max(0, toNumber(inventoryPart.sellingPrice, toNumber(inventoryPart.price, 0)));
    const lineAmount = quantity * partPrice;
    const gstMeta = resolveGstCategoryAndRate({
      category: inventoryPart.category,
      itemType: 'part',
      name: inventoryPart.name,
    });

    return {
      name: toSafeString(inventoryPart.name),
      itemType: 'part',
      category: toSafeString(inventoryPart.category),
      gstCategory: gstMeta.gstCategory,
      gstRate: gstMeta.gstRate,
      gstAmount: round2(lineAmount * gstMeta.gstRate / 100),
      quantity,
      price: partPrice,
      total: lineAmount,
    };
  });

  if (invalidItems.length > 0) {
    throw new Error(`Invalid part name(s). Please select from inventory only: ${invalidItems.join(', ')}`);
  }

  return resolved;
};

const buildQuantityMap = (lineItems = []) => {
  const map = new Map();
  lineItems.forEach((item) => {
    const key = normalizeName(item.name);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + Math.max(1, toNumber(item.quantity, 1)));
  });
  return map;
};

const syncInventoryForBillingChange = async (db, newLineItems = [], oldLineItems = []) => {
  const inventoryParts = await db
    .collection('inventory')
    .find({}, { projection: { id: 1, name: 1, stock: 1 } })
    .toArray();

  const inventoryMap = new Map(
    inventoryParts
      .map((part) => [normalizeName(part.name), part])
      .filter(([key]) => Boolean(key))
  );

  const newMap = buildQuantityMap(newLineItems);
  const oldMap = buildQuantityMap(oldLineItems);
  const allKeys = new Set([...newMap.keys(), ...oldMap.keys()]);

  let nextStockHistoryId = await getNextNumericId(db, 'stock_history');

  for (const key of allKeys) {
    const inventoryPart = inventoryMap.get(key);
    if (!inventoryPart) {
      throw new Error(`Inventory part not found for ${key}`);
    }

    const newQty = newMap.get(key) || 0;
    const oldQty = oldMap.get(key) || 0;
    const diff = newQty - oldQty;

    if (diff === 0) continue;

    const currentStock = Math.max(0, toNumber(inventoryPart.stock, 0));
    const nowIso = new Date().toISOString();

    if (diff > 0) {
      if (currentStock < diff) {
        throw new Error(`Insufficient stock for ${inventoryPart.name}. Available: ${currentStock}, required: ${diff}`);
      }

      const nextStock = currentStock - diff;
      const inventoryFilter = inventoryPart.id !== undefined
        ? { id: inventoryPart.id }
        : { _id: inventoryPart._id };
      await db.collection('inventory').updateOne(
        inventoryFilter,
        { $set: { stock: nextStock, updatedAt: nowIso } }
      );

      await db.collection('stock_history').insertOne({
        id: nextStockHistoryId,
        partId: inventoryPart.id !== undefined ? inventoryPart.id : String(inventoryPart._id),
        partName: inventoryPart.name,
        action: 'Used in Billing',
        quantityChange: -diff,
        stockAfter: nextStock,
        note: 'Auto deduction from billing',
        createdAt: nowIso,
      });
      nextStockHistoryId += 1;
      inventoryPart.stock = nextStock;
    } else {
      const restoreQty = Math.abs(diff);
      const nextStock = currentStock + restoreQty;
      const inventoryFilter = inventoryPart.id !== undefined
        ? { id: inventoryPart.id }
        : { _id: inventoryPart._id };
      await db.collection('inventory').updateOne(
        inventoryFilter,
        { $set: { stock: nextStock, updatedAt: nowIso } }
      );

      await db.collection('stock_history').insertOne({
        id: nextStockHistoryId,
        partId: inventoryPart.id !== undefined ? inventoryPart.id : String(inventoryPart._id),
        partName: inventoryPart.name,
        action: 'Restocked from Billing Update',
        quantityChange: restoreQty,
        stockAfter: nextStock,
        note: 'Auto restock from billing edit',
        createdAt: nowIso,
      });
      nextStockHistoryId += 1;
      inventoryPart.stock = nextStock;
    }
  }
};

const resolveBillingPayload = async (db, payload = {}, existingRecord = null) => {
  const customerType = normalizeCustomerType(payload.customerType || existingRecord?.customerType);
  if (!customerType) {
    throw new Error('customerType must be registered or offline');
  }

  const currency = toSafeString(payload.currency || existingRecord?.currency || 'INR').toUpperCase();
  const lineItemsInput = normalizeLineItems(payload.lineItems || existingRecord?.lineItems || []);
  const lineItems = await validateAndResolveInventoryLineItems(db, lineItemsInput);
  const paymentMethod = normalizePaymentMethod(payload.paymentMethod || existingRecord?.paymentMethod || 'cash');
  const paymentStatus = normalizePaymentStatus(payload.paymentStatus || existingRecord?.paymentStatus || 'pending');
  const transactionId = toSafeString(payload.transactionId || existingRecord?.transactionId);
  const serviceCharge = Math.max(0, toNumber(payload.serviceCharge, existingRecord?.serviceCharge || 0));
  const discount = Math.max(0, toNumber(payload.discount, existingRecord?.discount || 0));
  const status = toSafeString(payload.status || existingRecord?.status || 'issued') || 'issued';

  if (!isPaymentCompleted(paymentStatus)) {
    throw new Error('Payment must be completed before bill generation');
  }

  if (paymentMethod === 'razorpay' && !transactionId) {
    throw new Error('Razorpay transaction ID is required for Razorpay payment');
  }

  const lineItemsSubtotal = lineItems.reduce((sum, item) => sum + toNumber(item.total), 0);
  const lineItemsGst = lineItems.reduce((sum, item) => sum + toNumber(item.gstAmount), 0);
  const serviceChargeGst = round2(serviceCharge * GST_RATE_SERVICE / 100);
  const preDiscountTaxableAmount = lineItemsSubtotal + serviceCharge;
  const subtotal = Math.max(0, preDiscountTaxableAmount - discount);
  const discountFactor = preDiscountTaxableAmount > 0
    ? Math.min(1, Math.max(0, subtotal / preDiscountTaxableAmount))
    : 1;
  const gst = round2((lineItemsGst + serviceChargeGst) * discountFactor);
  const finalTotal = round2(Math.max(0, subtotal + gst));

  const billingData = {
    customerType,
    currency,
    lineItems,
    serviceCharge,
    discount,
    gst,
    gstLocked: true,
    gstBreakdown: {
      lineItemsGst: round2(lineItemsGst * discountFactor),
      serviceChargeGst: round2(serviceChargeGst * discountFactor),
      serviceChargeGstRate: GST_RATE_SERVICE,
      discountFactor,
    },
    subtotal,
    finalTotal,
    amount: finalTotal,
    totalAmount: finalTotal,
    status,
    paymentMethod,
    paymentStatus,
    transactionId,
    paymentDate: isPaymentCompleted(paymentStatus)
      ? (existingRecord?.paymentDate || payload.paymentDate || new Date().toISOString())
      : null,
    notes: toSafeString(payload.notes || existingRecord?.notes),
    updatedAt: new Date().toISOString(),
  };

  if (customerType === 'registered') {
    const rawUserId = payload.userId || existingRecord?.userId || existingRecord?.userObjectId;
    const customerSnapshot = await getRegisteredCustomerSnapshot(db, rawUserId);

    if (!customerSnapshot) {
      throw new Error('Registered customer not found');
    }

    const chosenVehicleNumber = toSafeString(payload.vehicleDetails?.number || payload.vehicleNumber);
    const selectedVehicle =
      customerSnapshot.vehicles.find((v) => vehicleNumberOf(v) === chosenVehicleNumber.toUpperCase()) ||
      customerSnapshot.vehicles[0] ||
      null;

    billingData.userId = String(customerSnapshot.user.userId || rawUserId || customerSnapshot.user._id);
    billingData.userObjectId = toSafeString(customerSnapshot.user._id);
    billingData.customerDetails = {
      ...customerSnapshot.customerDetails,
      name: toSafeString(payload.customerDetails?.name) || customerSnapshot.customerDetails.name,
      phone: toSafeString(payload.customerDetails?.phone) || customerSnapshot.customerDetails.phone,
      email: toSafeString(payload.customerDetails?.email) || customerSnapshot.customerDetails.email,
    };
    billingData.vehicleDetails = {
      number: toSafeString(payload.vehicleDetails?.number) || vehicleNumberOf(selectedVehicle),
      model: toSafeString(payload.vehicleDetails?.model) || vehicleModelOf(selectedVehicle),
      company: toSafeString(payload.vehicleDetails?.company) || vehicleCompanyOf(selectedVehicle),
    };
  } else {
    const customerDetails = payload.customerDetails || {};
    const vehicleDetails = payload.vehicleDetails || {};
    const emailValue = toSafeString(customerDetails.email).toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!toSafeString(customerDetails.name) || !toSafeString(customerDetails.phone)) {
      throw new Error('Offline customer name and phone are required');
    }

    if (!emailValue || !emailRegex.test(emailValue)) {
      throw new Error('Offline customer valid email is required');
    }

    if (!toSafeString(vehicleDetails.number)) {
      throw new Error('Offline customer vehicle number is required');
    }

    billingData.userId = null;
    billingData.userObjectId = null;
    billingData.customerDetails = {
      name: toSafeString(customerDetails.name),
      phone: toSafeString(customerDetails.phone),
      email: emailValue,
    };
    billingData.vehicleDetails = {
      number: toSafeString(vehicleDetails.number).toUpperCase(),
      model: toSafeString(vehicleDetails.model),
      company: toSafeString(vehicleDetails.company),
    };
  }

  return billingData;
};

const createBilling = async (req, res, next) => {
  try {
    const db = getDB();
    const payload = req.body || {};
    const normalized = await resolveBillingPayload(db, payload);

    await syncInventoryForBillingChange(db, normalized.lineItems, []);

    const record = {
      invoiceNumber: await buildInvoiceNumber(db),
      ...normalized,
      verified: false,
      createdAt: new Date().toISOString()
    };

    await db.collection('billing_records').insertOne(record);

    const receiverEmail = toSafeString(record?.customerDetails?.email).toLowerCase();
    if (receiverEmail) {
      await sendInvoiceEmail(
        receiverEmail,
        `AutoX Garage | Invoice ${toSafeString(record.invoiceNumber)}`,
        buildInvoiceEmailTemplate(record)
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Billing record created',
      data: record
    });
  } catch (error) {
    return next(error);
  }
};

const getBillingByUser = async (req, res, next) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    const userFilters = buildUserFilters(userId);

    const userQuery = userFilters.length ? { $or: userFilters } : { userId: String(userId) };
    const user = await db.collection('users').findOne(userQuery);
    const email = toSafeString(user?.email).toLowerCase();

    const userMatchConditions = userFilters.length ? [...userFilters] : [{ userId: String(userId) }];
    if (email) {
      userMatchConditions.push({ 'customerDetails.email': email });
    }
    const billingQuery = { $or: userMatchConditions };

    const bookingUserConditions = userFilters.length ? [...userFilters] : [{ userId: String(userId) }];
    if (email) {
      bookingUserConditions.push({ email });
    }
    const bookingQuery = {
      $and: [
        { $or: bookingUserConditions },
        {
          $or: [
            { paymentStatus: { $exists: true, $ne: '' } },
            { paymentMethod: { $exists: true, $ne: '' } },
            { transactionId: { $exists: true, $ne: '' } },
            { invoiceNumber: { $exists: true, $ne: '' } },
            { amount: { $gt: 0 } },
          ],
        },
      ],
    };

    const servicePaymentQuery = email
      ? {
          $or: [
            { email },
            { email: toSafeString(user?.email) },
          ],
        }
      : { booking_id: { $exists: false } };

    const numericUserId = Number(user?.userId);
    const userObjectId = toSafeString(user?._id);
    const vehicleLookupFilters = [];

    if (Number.isFinite(numericUserId)) {
      vehicleLookupFilters.push({ userId: numericUserId });
      vehicleLookupFilters.push({ userId: String(numericUserId) });
      vehicleLookupFilters.push({ user_id: numericUserId });
      vehicleLookupFilters.push({ user_id: String(numericUserId) });
    }

    if (userObjectId) {
      vehicleLookupFilters.push({ userId: userObjectId });
      vehicleLookupFilters.push({ user_id: userObjectId });
      vehicleLookupFilters.push({ userObjectId });
    }

    const [billingRecords, bookingPayments, servicePayments, userVehicles] = await Promise.all([
      db.collection('billing_records').find(billingQuery).toArray(),
      db.collection('bookings').find(bookingQuery).toArray(),
      email ? db.collection('service_payments').find(servicePaymentQuery).toArray() : Promise.resolve([]),
      vehicleLookupFilters.length
        ? db.collection('vehicles').find({ $or: vehicleLookupFilters }).sort({ createdAt: -1 }).toArray()
        : Promise.resolve([]),
    ]);

    const primaryVehicle = Array.isArray(userVehicles) && userVehicles.length ? userVehicles[0] : null;

    const userFallbackDetails = {
      name: toSafeString(user?.fullName || user?.name || user?.email || 'Customer'),
      phone: toSafeString(user?.phone),
      email: toSafeString(user?.email),
      address: toSafeString(user?.address || user?.city),
    };

    const vehicleFallbackDetails = {
      number: toSafeString(primaryVehicle?.plate || primaryVehicle?.vehicleNumber || primaryVehicle?.registration),
      model: toSafeString(primaryVehicle?.model || primaryVehicle?.vehicleModel),
      company: toSafeString(primaryVehicle?.make || primaryVehicle?.vehicleCompany),
    };

    const bookingIdCandidates = Array.from(
      new Set(
        servicePayments
          .map((payment) => toSafeString(payment.booking_id))
          .filter(Boolean)
      )
    );

    const transactionIdCandidates = Array.from(
      new Set(
        servicePayments
          .map((payment) =>
            toSafeString(payment.transaction_id || payment.razorpay_payment_id || payment.razorpayPaymentId)
          )
          .filter(Boolean)
      )
    );

    let linkedBookingsById = new Map();
    let linkedBookingsByTransaction = new Map();
    if (bookingIdCandidates.length || transactionIdCandidates.length) {
      const bookingLookupFilters = [];

      bookingIdCandidates.forEach((bookingIdText) => {
        const numeric = Number(bookingIdText);
        if (Number.isFinite(numeric)) {
          bookingLookupFilters.push({ id: numeric }, { id: String(numeric) });
        }
        bookingLookupFilters.push({ id: bookingIdText });
      });

      transactionIdCandidates.forEach((txId) => {
        bookingLookupFilters.push(
          { transactionId: txId },
          { razorpayPaymentId: txId },
          { razorpay_payment_id: txId }
        );
      });

      if (email) {
        bookingLookupFilters.push({ email });
      }

      const linkedBookings = await db.collection('bookings').find({ $or: bookingLookupFilters }).toArray();
      linkedBookingsById = new Map(
        linkedBookings.flatMap((booking) => {
          const keys = [
            toSafeString(booking?.id),
            toSafeString(booking?._id),
          ].filter(Boolean);
          return keys.map((key) => [key, booking]);
        })
      );

      linkedBookingsByTransaction = new Map(
        linkedBookings.flatMap((booking) => {
          const txKeys = [
            toSafeString(booking?.transactionId),
            toSafeString(booking?.razorpayPaymentId),
            toSafeString(booking?.razorpay_payment_id),
          ].filter(Boolean);
          return txKeys.map((key) => [key, booking]);
        })
      );
    }

    const vehicleNumberCandidates = Array.from(
      new Set(
        [
          ...servicePayments.map((payment) => toSafeString(payment?.vehicle_number || payment?.vehicleNumber || payment?.registration)),
          ...Array.from(linkedBookingsById.values()).map((booking) => toSafeString(booking?.vehicleNumber || booking?.registration)),
          ...Array.from(linkedBookingsByTransaction.values()).map((booking) => toSafeString(booking?.vehicleNumber || booking?.registration)),
        ]
          .filter(Boolean)
          .map(normalizeVehicleNumber)
      )
    );

    const linkedVehicleLookupFilters = [];
    vehicleNumberCandidates.forEach((vehicleNo) => {
      linkedVehicleLookupFilters.push({ plate: vehicleNo }, { vehicle_number: vehicleNo });
    });
    if (email) {
      linkedVehicleLookupFilters.push({ email: { $regex: `^${email}$`, $options: 'i' } });
    }

    const linkedVehicles = linkedVehicleLookupFilters.length
      ? await db.collection('vehicles').find({ $or: linkedVehicleLookupFilters }).toArray()
      : [];

    const vehiclesByNumber = new Map(
      linkedVehicles.flatMap((vehicle) => {
        const keys = [
          normalizeVehicleNumber(vehicle?.plate),
          normalizeVehicleNumber(vehicle?.vehicle_number),
        ].filter(Boolean);
        return keys.map((key) => [key, vehicle]);
      })
    );

    const primaryVehicleByEmail =
      linkedVehicles.find((vehicle) => toSafeString(vehicle?.email).toLowerCase() === email) ||
      null;

    const merged = [
      ...billingRecords.map(mapBillingRecordForResponse),
      ...bookingPayments.map(mapBookingForBillingResponse),
      ...servicePayments.map((payment) => {
        const bookingKey = toSafeString(payment?.booking_id);
        const paymentTransactionId = toSafeString(
          payment?.transaction_id || payment?.razorpay_payment_id || payment?.razorpayPaymentId
        );
        const linkedBooking =
          linkedBookingsById.get(bookingKey) ||
          linkedBookingsByTransaction.get(paymentTransactionId) ||
          null;

        const bookingVehicleNumber = normalizeVehicleNumber(
          linkedBooking?.vehicleNumber || linkedBooking?.registration
        );
        const paymentVehicleNumber = normalizeVehicleNumber(
          payment?.vehicle_number || payment?.vehicleNumber || payment?.registration
        );

        const linkedVehicle =
          vehiclesByNumber.get(bookingVehicleNumber) ||
          vehiclesByNumber.get(paymentVehicleNumber) ||
          primaryVehicleByEmail ||
          null;

        const base = mapServicePaymentForBillingResponse(payment, linkedBooking);
        return {
          ...base,
          customerDetails: {
            ...(base.customerDetails || {}),
            name: toSafeString(base?.customerDetails?.name || linkedVehicle?.customer_name),
            phone: toSafeString(base?.customerDetails?.phone || linkedVehicle?.mobile),
            email: toSafeString(base?.customerDetails?.email || linkedVehicle?.email || email),
            address: toSafeString(base?.customerDetails?.address || linkedVehicle?.address || linkedVehicle?.city),
          },
          vehicleDetails: {
            ...(base.vehicleDetails || {}),
            number: toSafeString(base?.vehicleDetails?.number || linkedVehicle?.vehicle_number || linkedVehicle?.plate),
            model: toSafeString(base?.vehicleDetails?.model || linkedVehicle?.vehicle_model || linkedVehicle?.model),
            company: toSafeString(base?.vehicleDetails?.company || linkedVehicle?.vehicle_company || linkedVehicle?.make),
          },
        };
      }),
    ];

    const records = dedupeBillingEntries(merged)
      .map((record) => ({
        ...record,
        customerDetails: {
          ...userFallbackDetails,
          ...(record.customerDetails || {}),
          name: toSafeString(record?.customerDetails?.name || userFallbackDetails.name),
          phone: toSafeString(record?.customerDetails?.phone || userFallbackDetails.phone),
          email: toSafeString(record?.customerDetails?.email || userFallbackDetails.email),
          address: toSafeString(record?.customerDetails?.address || userFallbackDetails.address),
        },
        vehicleDetails: {
          ...vehicleFallbackDetails,
          ...(record.vehicleDetails || {}),
          number: toSafeString(record?.vehicleDetails?.number || vehicleFallbackDetails.number),
          model: toSafeString(record?.vehicleDetails?.model || vehicleFallbackDetails.model),
          company: toSafeString(record?.vehicleDetails?.company || vehicleFallbackDetails.company),
        },
      }))
      .sort((a, b) => {
      const aTime = new Date(a.paymentDate || a.createdAt || 0).getTime() || 0;
      const bTime = new Date(b.paymentDate || b.createdAt || 0).getTime() || 0;
      return bTime - aTime;
      });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    return next(error);
  }
};

const getAllBilling = async (req, res, next) => {
  try {
    const db = getDB();
    const { userId, status, verified, invoiceNumber, customerType, customerName, vehicleNumber, date, q } = req.query;
    const filter = {};

    if (userId) {
      const userFilters = buildUserFilters(userId);
      filter.$or = userFilters.length ? userFilters : [{ userId: String(userId) }];
    }
    if (status) filter.status = String(status);
    if (verified !== undefined) filter.verified = String(verified).toLowerCase() === 'true';
    if (invoiceNumber) filter.invoiceNumber = String(invoiceNumber);
    if (customerType) filter.customerType = normalizeCustomerType(customerType) || String(customerType);
    if (customerName) filter['customerDetails.name'] = { $regex: String(customerName), $options: 'i' };
    if (vehicleNumber) filter['vehicleDetails.number'] = { $regex: String(vehicleNumber), $options: 'i' };

    if (q) {
      const textRegex = { $regex: String(q), $options: 'i' };
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { invoiceNumber: textRegex },
          { 'customerDetails.name': textRegex },
          { 'vehicleDetails.number': textRegex },
        ],
      });
    }

    if (date) {
      const parsed = parseDateFilter(date);
      if (parsed) {
        const start = new Date(parsed);
        start.setHours(0, 0, 0, 0);
        const end = new Date(parsed);
        end.setHours(23, 59, 59, 999);
        filter.createdAt = {
          $gte: start.toISOString(),
          $lte: end.toISOString(),
        };
      }
    }

    const records = await db.collection('billing_records').find(filter).sort({ createdAt: -1 }).toArray();
    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    return next(error);
  }
};

const getBillingByInvoiceNumber = async (req, res, next) => {
  try {
    const db = getDB();
    const { invoiceNumber } = req.params;
    const record = await db.collection('billing_records').findOne({ invoiceNumber: String(invoiceNumber) });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    return next(error);
  }
};

const updateBilling = async (req, res, next) => {
  try {
    const db = getDB();
    const { invoiceNumber } = req.params;
    const existingRecord = await db.collection('billing_records').findOne({ invoiceNumber: String(invoiceNumber) });

    if (!existingRecord) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const normalized = await resolveBillingPayload(db, req.body || {}, existingRecord);
    await syncInventoryForBillingChange(db, normalized.lineItems, existingRecord.lineItems || []);
    await db.collection('billing_records').updateOne(
      { invoiceNumber: String(invoiceNumber) },
      {
        $set: {
          ...normalized,
          verified: existingRecord.verified || false,
        }
      }
    );

    const updated = await db.collection('billing_records').findOne({ invoiceNumber: String(invoiceNumber) });
    return res.status(200).json({ success: true, message: 'Billing record updated', data: updated });
  } catch (error) {
    return next(error);
  }
};

const getRegisteredCustomers = async (_req, res, next) => {
  try {
    const db = getDB();
    const users = await db
      .collection('users')
      .find({ role: { $ne: 'admin' } })
      .project({ password: 0, passwordHash: 0 })
      .sort({ createdAt: -1 })
      .toArray();

    const normalized = users.map((u) => ({
      id: String(u.userId || u._id),
      userId: String(u.userId || ''),
      objectId: toSafeString(u._id),
      name: toSafeString(u.fullName) || toSafeString(u.name) || toSafeString(u.email),
      phone: toSafeString(u.phone),
      email: toSafeString(u.email),
    }));

    return res.status(200).json({ success: true, data: normalized });
  } catch (error) {
    return next(error);
  }
};

const getRegisteredCustomerProfile = async (req, res, next) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    const snapshot = await getRegisteredCustomerSnapshot(db, userId);

    if (!snapshot) {
      return res.status(404).json({ success: false, message: 'Registered customer not found' });
    }

    const vehicles = (snapshot.vehicles || []).map((v) => ({
      id: v.id || v._id,
      number: vehicleNumberOf(v),
      model: vehicleModelOf(v),
      company: vehicleCompanyOf(v),
      year: v.year,
    }));

    return res.status(200).json({
      success: true,
      data: {
        userId: String(snapshot.user.userId || userId || snapshot.user._id),
        userObjectId: toSafeString(snapshot.user._id),
        customerDetails: snapshot.customerDetails,
        vehicleDetails: vehicles[0] || { number: '', model: '', company: '' },
        vehicles,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const refundBilling = async (req, res, next) => {
  try {
    const db = getDB();
    const { invoiceNumber, reason } = req.body;
    const record = await db.collection('billing_records').findOne({ invoiceNumber: String(invoiceNumber) });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (record.status === 'refunded') {
      return res.status(409).json({ success: false, message: 'Invoice already refunded' });
    }

    await db.collection('billing_records').updateOne(
      { invoiceNumber: String(invoiceNumber) },
      {
        $set: {
          status: 'refunded',
          refundReason: reason,
          refundedAt: new Date().toISOString()
        }
      }
    );

    const updated = await db.collection('billing_records').findOne({ invoiceNumber: String(invoiceNumber) });
    return res.status(200).json({ success: true, message: 'Refund processed', data: updated });
  } catch (error) {
    return next(error);
  }
};

const verifyBilling = async (req, res, next) => {
  try {
    const db = getDB();
    const { invoiceNumber } = req.params;
    const result = await db.collection('billing_records').updateOne(
      { invoiceNumber: String(invoiceNumber) },
      {
        $set: {
          verified: true,
          status: 'verified',
          verifiedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const updated = await db.collection('billing_records').findOne({ invoiceNumber: String(invoiceNumber) });
    return res.status(200).json({ success: true, message: 'Invoice verified', data: updated });
  } catch (error) {
    return next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const db = getDB();
    const { userId, amount, bookingId, method } = req.body;

    if (!userId || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'userId, amount, and method are required'
      });
    }

    const payment = {
      paymentId: await buildPaymentId(db),
      userId: String(userId),
      bookingId,
      amount: Number(amount),
      method,
      status: 'initiated',
      createdAt: new Date().toISOString()
    };

    await db.collection('payments').insertOne(payment);

    return res.status(201).json({
      success: true,
      message: 'Payment initiated',
      data: payment
    });
  } catch (error) {
    return next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const db = getDB();
    const { paymentId } = req.params;
    const payment = await db.collection('payments').findOne({ paymentId: String(paymentId) });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    return res.json({ success: true, data: payment });
  } catch (error) {
    return next(error);
  }
};

const getUserPayments = async (req, res, next) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    const userPayments = await db.collection('payments').find({ userId: String(userId) }).toArray();

    return res.json({ success: true, data: userPayments, count: userPayments.length });
  } catch (error) {
    return next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const db = getDB();
    const { paymentId, razorpayPaymentId, razorpayOrderId, signature } = req.body;

    if (!paymentId || !razorpayPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'paymentId and razorpayPaymentId are required'
      });
    }

    const result = await db.collection('payments').updateOne(
      { paymentId: String(paymentId) },
      {
        $set: {
          status: 'completed',
          razorpayPaymentId,
          razorpayOrderId,
          signature,
          verifiedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const updated = await db.collection('payments').findOne({ paymentId: String(paymentId) });
    return res.json({ success: true, message: 'Payment verified', data: updated });
  } catch (error) {
    return next(error);
  }
};

const processRefund = async (req, res, next) => {
  try {
    const db = getDB();
    const { paymentId, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({ success: false, message: 'paymentId is required' });
    }

    const payment = await db.collection('payments').findOne({ paymentId: String(paymentId) });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded'
      });
    }

    await db.collection('payments').updateOne(
      { paymentId: String(paymentId) },
      {
        $set: {
          status: 'refunded',
          refundReason: reason,
          refundedAt: new Date().toISOString()
        }
      }
    );

    const updated = await db.collection('payments').findOne({ paymentId: String(paymentId) });
    return res.json({ success: true, message: 'Refund processed', data: updated });
  } catch (error) {
    return next(error);
  }
};

const getInvoices = async (req, res, next) => {
  try {
    const db = getDB();
    const { userId, status } = req.query;
    const filter = {};
    if (userId) filter.userId = String(userId);
    if (status) filter.status = status;

    const invoices = await db.collection('billing_records').find(filter).sort({ createdAt: -1 }).toArray();

    return res.json({ success: true, data: invoices, count: invoices.length });
  } catch (error) {
    return next(error);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const db = getDB();
    const { invoiceId } = req.params;
    const invoice = await db.collection('billing_records').findOne({ invoiceNumber: String(invoiceId) });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.json({
      success: true,
      message: 'Invoice download link generated',
      downloadUrl: `/invoices/${invoiceId}.pdf`,
      invoice
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBilling,
  getBillingByUser,
  getAllBilling,
  getBillingByInvoiceNumber,
  updateBilling,
  getRegisteredCustomers,
  getRegisteredCustomerProfile,
  refundBilling,
  verifyBilling,
  createPayment,
  getPaymentById,
  getUserPayments,
  verifyPayment,
  processRefund,
  getInvoices,
  downloadInvoice
};
