const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getDB } = require('../config/db');
const sendEmail = require('../utils/sendEmail');

const MERCHANT_NAME = 'AutoX Garage';

const toSafeString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const normalizePaymentStatus = (value) => {
  const raw = toSafeString(value).toLowerCase();
  if (['success', 'paid', 'captured'].includes(raw)) return 'success';
  if (['failed', 'failure'].includes(raw)) return 'failed';
  if (['created', 'pending'].includes(raw)) return 'pending';
  return raw || 'pending';
};

const isCompletedBookingStatus = (value) => {
  const normalized = toSafeString(value).toLowerCase();
  return ['completed', 'complete', 'done', 'service completed'].includes(normalized);
};

const toAmountInPaise = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100);
};

const resolveAuthUserFilter = (authUser = {}) => {
  const numericId = Number(authUser?.userId ?? authUser?.id);
  const objectIdText = String(authUser?._id || '').trim();

  const candidates = [];
  if (Number.isFinite(numericId)) {
    candidates.push({ userId: numericId }, { userId: String(numericId) });
  }
  if (objectIdText) {
    candidates.push({ userObjectId: objectIdText }, { userId: objectIdText });
  }

  if (!candidates.length) return {};
  return { $or: candidates };
};

const buildBookingSuccessEmailTemplate = ({
  userName,
  serviceName,
  vehicleNumber,
  bookingDate,
  amountPaid,
  transactionId,
}) => {
  const formattedAmount = `₹${Number(amountPaid || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return `
    <div style="margin:0;padding:0;background:#f3f6fb;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:14px;box-shadow:0 8px 28px rgba(15,23,42,0.08);overflow:hidden;">
              <tr>
                <td style="background:#0f172a;padding:22px 28px;color:#ffffff;">
                  <h1 style="margin:0;font-size:21px;line-height:1.4;">${MERCHANT_NAME} Booking Confirmed</h1>
                  <p style="margin:6px 0 0;font-size:13px;opacity:0.9;">Payment Successful</p>
                </td>
              </tr>
              <tr>
                <td style="padding:26px 28px;">
                  <p style="margin:0 0 14px;color:#374151;font-size:15px;">Hello <strong>${toSafeString(userName, 'Customer')}</strong>,</p>
                  <p style="margin:0 0 16px;color:#4b5563;font-size:14px;line-height:1.6;">
                    Thank you for choosing ${MERCHANT_NAME}. Your payment for <strong>${toSafeString(serviceName, 'Service Booking')}</strong> has been received successfully.
                  </p>
                  <div style="border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;padding:16px 18px;">
                    <p style="margin:0 0 9px;font-size:14px;color:#111827;"><strong>Service Name:</strong> ${toSafeString(serviceName, 'Service Booking')}</p>
                    <p style="margin:0 0 9px;font-size:14px;color:#111827;"><strong>Vehicle Number:</strong> ${toSafeString(vehicleNumber, 'N/A')}</p>
                    <p style="margin:0 0 9px;font-size:14px;color:#111827;"><strong>Booking Date:</strong> ${toSafeString(bookingDate, 'N/A')}</p>
                    <p style="margin:0 0 9px;font-size:14px;color:#111827;"><strong>Amount Paid:</strong> ${formattedAmount}</p>
                    <p style="margin:0;font-size:14px;color:#111827;"><strong>Transaction ID:</strong> ${toSafeString(transactionId, 'N/A')}</p>
                  </div>
                  <p style="margin:16px 0 0;color:#4b5563;font-size:14px;line-height:1.6;">We appreciate your trust. See you at your scheduled service time.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;">
                  ${MERCHANT_NAME} Vehicle Service Booking System
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
};

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error('Razorpay keys are not configured');
    error.statusCode = 500;
    throw error;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

const createPayment = async (req, res, next) => {
  try {
    const db = getDB();
    const serviceName = toSafeString(req.body?.service_name);
    const email = toSafeString(req.body?.email);
    const amountInPaise = toAmountInPaise(req.body?.amount);

    if (!serviceName || !amountInPaise) {
      return res.status(400).json({
        success: false,
        message: 'service_name and valid amount are required',
      });
    }

    const razorpay = getRazorpayClient();
    const receipt = `svc_${Date.now()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        business_name: MERCHANT_NAME,
        service_name: serviceName,
      },
    });

    const paymentRecord = {
      service_name: serviceName,
      email,
      amount: amountInPaise / 100,
      amount_paise: amountInPaise,
      currency: 'INR',
      receipt,
      status: 'created',
      razorpay_order_id: razorpayOrder.id,
      razorpay_payment_id: null,
      razorpay_signature: null,
      gateway_raw_response: {
        order: {
          id: toSafeString(razorpayOrder?.id),
          amount: Number(razorpayOrder?.amount || 0),
          currency: toSafeString(razorpayOrder?.currency, 'INR'),
          receipt,
        },
      },
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('service_payments').insertOne(paymentRecord);

    return res.status(201).json({
      success: true,
      message: 'Payment order created',
      data: {
        key: process.env.RAZORPAY_KEY_ID,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        service_name: serviceName,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const db = getDB();
    const {
      service_name,
      email,
      amount,
      booking_id: bookingId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body || {};

    if (!service_name || !amount || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message:
          'service_name, amount, razorpay_order_id, razorpay_payment_id and razorpay_signature are required',
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay secret is not configured',
      });
    }

    const existingPayment = await db
      .collection('service_payments')
      .findOne({ razorpay_order_id: String(razorpayOrderId) });

    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment order not found',
      });
    }

    if (Number(existingPayment.amount) !== Number(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Amount mismatch for this payment order',
      });
    }

    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const verificationPayload = {
      razorpay_order_id: toSafeString(razorpayOrderId),
      razorpay_payment_id: toSafeString(razorpayPaymentId),
      razorpay_signature: toSafeString(razorpaySignature),
      email: toSafeString(email, toSafeString(existingPayment?.email)),
      amount: Number(amount),
      service_name: toSafeString(service_name),
    };
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await db.collection('service_payments').updateOne(
        { razorpay_order_id: String(razorpayOrderId) },
        {
          $set: {
            status: 'failed',
            gateway_raw_response: verificationPayload,
            updated_at: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    const generatedInvoiceNumber =
      toSafeString(existingPayment?.invoice_number) || `INV-${Date.now()}`;

    const updateResult = await db.collection('service_payments').updateOne(
      { razorpay_order_id: String(razorpayOrderId) },
      {
        $set: {
          service_name: toSafeString(service_name),
          email: toSafeString(email, toSafeString(existingPayment?.email)),
          amount: Number(amount),
          currency: 'INR',
          status: 'success',
          payment_status: 'Paid',
          transaction_id: String(razorpayPaymentId),
          booking_id: toSafeString(bookingId),
          invoice_number: generatedInvoiceNumber,
          razorpay_payment_id: String(razorpayPaymentId),
          razorpay_signature: String(razorpaySignature),
          gateway_raw_response: verificationPayload,
          created_at: existingPayment?.created_at || existingPayment?.createdAt || new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }
    );

    const savedPayment = await db
      .collection('service_payments')
      .findOne({ razorpay_order_id: String(razorpayOrderId) });

    const parsedBookingId = Number(bookingId);
    let bookingDetails = null;
    if (Number.isFinite(parsedBookingId) && parsedBookingId > 0) {
      await db.collection('bookings').updateOne(
        { id: parsedBookingId },
        {
          $set: {
            paymentStatus: 'Paid',
            paymentDate: new Date().toISOString(),
            transactionId: String(razorpayPaymentId),
            razorpayOrderId: String(razorpayOrderId),
            razorpayPaymentId: String(razorpayPaymentId),
            razorpaySignature: String(razorpaySignature),
            invoiceNumber: generatedInvoiceNumber,
            paymentMethod: 'Razorpay',
            status: 'confirmed',
            updatedAt: new Date().toISOString(),
          },
        }
      );

      bookingDetails = await db.collection('bookings').findOne({ id: parsedBookingId });
    }

    const receiverEmail =
      toSafeString(email) ||
      toSafeString(existingPayment?.email) ||
      toSafeString(bookingDetails?.email);

    if (receiverEmail) {
      const user = await db.collection('users').findOne({ email: receiverEmail.toLowerCase() });
      const bookingDateValue = bookingDetails?.date
        || (bookingDetails?.scheduledAt
          ? new Date(bookingDetails.scheduledAt).toLocaleDateString('en-IN')
          : bookingDetails?.createdAt
            ? new Date(bookingDetails.createdAt).toLocaleDateString('en-IN')
            : new Date().toLocaleDateString('en-IN'));

      const emailHtml = buildBookingSuccessEmailTemplate({
        userName:
          toSafeString(bookingDetails?.customerName)
          || toSafeString(user?.name)
          || toSafeString(user?.fullName)
          || toSafeString(receiverEmail.split('@')[0], 'Customer'),
        serviceName: toSafeString(bookingDetails?.serviceName) || toSafeString(service_name),
        vehicleNumber: toSafeString(bookingDetails?.vehicleNumber, 'N/A'),
        bookingDate: toSafeString(bookingDateValue, 'N/A'),
        amountPaid: Number(amount),
        transactionId: toSafeString(razorpayPaymentId, 'N/A'),
      });

      await sendEmail(
        receiverEmail,
        `${MERCHANT_NAME} | Payment Successful`,
        emailHtml
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        ...savedPayment,
        invoice_number: generatedInvoiceNumber,
        booking: bookingDetails || null,
        booking_id: parsedBookingId || null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getPaymentInvoice = async (req, res, next) => {
  try {
    const db = getDB();
    const bookingId = Number(req.params?.booking_id);

    if (!Number.isFinite(bookingId) || bookingId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'booking_id must be a positive number',
      });
    }

    const authFilter = resolveAuthUserFilter(req.user);
    const bookingQuery = authFilter.$or
      ? { id: bookingId, $or: authFilter.$or }
      : { id: bookingId };

    const booking = await db.collection('bookings').findOne(bookingQuery);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking invoice not found',
      });
    }

    if (!isCompletedBookingStatus(booking?.status || booking?.bookingStatus)) {
      return res.status(409).json({
        success: false,
        message: 'Invoice will be available after service completion.',
      });
    }

    const invoiceNumber = toSafeString(booking?.invoiceNumber);
    if (!invoiceNumber) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not generated yet. Please contact support.',
      });
    }

    const customerName =
      toSafeString(booking?.customerName) ||
      toSafeString(req.user?.name) ||
      toSafeString(req.user?.fullName) ||
      toSafeString(req.user?.email) ||
      'Customer';

    return res.status(200).json({
      success: true,
      data: {
        bookingId,
        invoiceNumber,
        dateTime:
          booking?.paymentDate ||
          booking?.updatedAt ||
          booking?.createdAt ||
          new Date().toISOString(),
        customerName,
        serviceName: toSafeString(booking?.serviceName, 'Service Booking'),
        vehicleNumber: toSafeString(booking?.vehicleNumber, 'N/A'),
        amountPaid: Number(booking?.amount || 0),
        paymentMethod: toSafeString(booking?.paymentMethod, 'Razorpay'),
        transactionId: toSafeString(
          booking?.transactionId || booking?.razorpayPaymentId,
          'N/A'
        ),
        paymentStatus: toSafeString(booking?.paymentStatus, 'Paid'),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const db = getDB();
    const search = toSafeString(req.query?.search).toLowerCase();
    const statusFilter = normalizePaymentStatus(req.query?.status || 'all');
    const page = Math.max(1, Number(req.query?.page || 1));
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit || 20)));

    const [servicePaymentRecords, bookingRecords, billingPaymentRecords] = await Promise.all([
      db.collection('service_payments').find({}).toArray(),
      db
        .collection('bookings')
        .find({
          $or: [
            { paymentMethod: { $exists: true, $ne: '' } },
            { paymentStatus: { $exists: true, $ne: '' } },
            { status: { $in: ['completed', 'paid', 'success', 'failed', 'pending'] } },
            { transactionId: { $exists: true, $ne: '' } },
            { razorpayPaymentId: { $exists: true, $ne: '' } },
            { razorpay_payment_id: { $exists: true, $ne: '' } },
          ],
        })
        .toArray(),
      db.collection('payments').find({}).toArray(),
    ]);

    const mappedServicePayments = servicePaymentRecords.map((record) => ({
      id: String(record?._id || ''),
      razorpay_payment_id: toSafeString(record?.razorpay_payment_id),
      razorpay_order_id: toSafeString(record?.razorpay_order_id),
      service_name: toSafeString(record?.service_name),
      email: toSafeString(record?.email),
      amount: Number(record?.amount || 0),
      status: normalizePaymentStatus(record?.status),
      created_at: record?.created_at || record?.verifiedAt || record?.updatedAt || record?.createdAt || null,
      currency: toSafeString(record?.currency, 'INR'),
      razorpay_signature: toSafeString(record?.razorpay_signature),
      raw_response: record?.gateway_raw_response || null,
      source: 'service_payments',
    }));

    const mappedBookingPayments = bookingRecords.map((record) => ({
      id: `booking-${toSafeString(record?.id || record?._id)}`,
      razorpay_payment_id: toSafeString(record?.razorpayPaymentId || record?.razorpay_payment_id || record?.transactionId),
      razorpay_order_id: toSafeString(record?.razorpayOrderId || record?.razorpay_order_id),
      service_name: toSafeString(record?.serviceName || record?.service_name),
      email: toSafeString(record?.email),
      amount: Number(record?.amount || record?.totalAmount || 0),
      status: normalizePaymentStatus(record?.paymentStatus || record?.status),
      created_at: record?.paymentDate || record?.created_at || record?.updatedAt || record?.createdAt || null,
      currency: toSafeString(record?.currency, 'INR'),
      razorpay_signature: toSafeString(record?.razorpaySignature || record?.razorpay_signature),
      raw_response: record?.raw_response || null,
      source: 'bookings',
    }));

    const mappedBillingPayments = billingPaymentRecords.map((record) => ({
      id: `billing-${toSafeString(record?.paymentId || record?._id)}`,
      razorpay_payment_id: toSafeString(record?.razorpayPaymentId || record?.razorpay_payment_id),
      razorpay_order_id: toSafeString(record?.razorpayOrderId || record?.razorpay_order_id),
      service_name: toSafeString(record?.serviceName || record?.bookingId || record?.paymentId),
      email: toSafeString(record?.email),
      amount: Number(record?.amount || 0),
      status: normalizePaymentStatus(record?.status),
      created_at: record?.verifiedAt || record?.created_at || record?.updatedAt || record?.createdAt || null,
      currency: toSafeString(record?.currency, 'INR'),
      razorpay_signature: toSafeString(record?.signature || record?.razorpaySignature || record?.razorpay_signature),
      raw_response: record?.raw_response || null,
      source: 'payments',
    }));

    const dedupeMap = new Map();
    [...mappedServicePayments, ...mappedBookingPayments, ...mappedBillingPayments].forEach((payment) => {
      const key =
        toSafeString(payment.razorpay_payment_id) ||
        toSafeString(payment.razorpay_order_id) ||
        toSafeString(payment.id);

      if (!dedupeMap.has(key)) {
        dedupeMap.set(key, payment);
        return;
      }

      const existing = dedupeMap.get(key);
      if (existing?.source === 'bookings' && payment?.source === 'service_payments') {
        dedupeMap.set(key, { ...existing, ...payment, source: 'service_payments' });
      }

      if (existing?.source === 'payments' && payment?.source === 'service_payments') {
        dedupeMap.set(key, { ...existing, ...payment, source: 'service_payments' });
      }
    });

    const mergedPayments = Array.from(dedupeMap.values());

    const filtered = mergedPayments.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch =
        !search ||
        toSafeString(item.email).toLowerCase().includes(search) ||
        toSafeString(item.razorpay_payment_id).toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });

    filtered.sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime() || 0;
      const bTime = new Date(b.created_at || 0).getTime() || 0;
      return bTime - aTime;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const counts = {
      total: mergedPayments.length,
      success: mergedPayments.filter((item) => item.status === 'success').length,
      failed: mergedPayments.filter((item) => item.status === 'failed').length,
      pending: mergedPayments.filter((item) => item.status === 'pending').length,
    };

    return res.status(200).json({
      success: true,
      data: paginated,
      count: paginated.length,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  getPayments,
  getPaymentInvoice,
};