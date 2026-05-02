const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const defaultSchemaOptions = {
  timestamps: true,
  versionKey: false,
};

const ROLE_ENUM = ['customer', 'admin', 'mechanic', 'manager', 'support'];
const BOOKING_STATUS_ENUM = ['pending', 'scheduled', 'in-progress', 'completed', 'canceled', 'no-show'];
const PAYMENT_STATUS_ENUM = ['initiated', 'pending', 'completed', 'failed', 'refunded'];
const INVOICE_STATUS_ENUM = ['issued', 'paid', 'partially_paid', 'overdue', 'refunded', 'void'];
const BREAKDOWN_STATUS_ENUM = ['open', 'assigned', 'en-route', 'resolved', 'canceled'];
const ASSIGNMENT_STATUS_ENUM = ['assigned', 'accepted', 'in-progress', 'completed', 'canceled'];
const REPAIR_STATUS_ENUM = ['received', 'diagnosis', 'in-progress', 'ready', 'delivered', 'canceled'];
const MOD_QUOTE_STATUS_ENUM = ['requested', 'quoted', 'approved', 'rejected', 'expired'];
const MOD_ORDER_STATUS_ENUM = ['created', 'scheduled', 'in-progress', 'completed', 'canceled'];
const PART_ORDER_STATUS_ENUM = ['ordered', 'partially_received', 'received', 'canceled'];
const PACKAGE_STATUS_ENUM = ['active', 'expired', 'suspended', 'canceled'];
const NOTIFICATION_TYPE_ENUM = ['system', 'booking', 'billing', 'service', 'security', 'marketing'];

const userSchema = new Schema(
  {
    userId: { type: Number, index: true },
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    phone: { type: String, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLE_ENUM, default: 'customer', index: true },
    isActive: { type: Boolean, default: true, index: true },
    profilePhotoUrl: { type: String },
    lastLoginAt: { type: Date },
  },
  defaultSchemaOptions
);

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.comparePassword = async function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

const otpCodeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    otpHash: { type: String, required: true, select: false },
    purpose: { type: String, required: true, enum: ['login', 'register', 'password_reset'] },
    used: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, required: true, index: true },
    verifiedAt: { type: Date },
  },
  defaultSchemaOptions
);
otpCodeSchema.index({ email: 1, purpose: 1, createdAt: -1 });
otpCodeSchema.index({ phone: 1, purpose: 1, createdAt: -1 });
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const passwordResetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, select: false, unique: true },
    used: { type: Boolean, default: false, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
  },
  defaultSchemaOptions
);
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const vehicleSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    plate: { type: String, required: true, trim: true, uppercase: true },
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1980, max: 2100 },
    color: { type: String, trim: true },
    fuelType: { type: String, trim: true },
    odometerKm: { type: Number, min: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  defaultSchemaOptions
);
vehicleSchema.index({ userId: 1, plate: 1 }, { unique: true });
vehicleSchema.index({ plate: 1 }, { unique: true });

const serviceSchema = new Schema(
  {
    serviceCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String, required: true, trim: true, index: true },
    basePrice: { type: Number, required: true, min: 0 },
    estimatedDurationMinutes: { type: Number, min: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  defaultSchemaOptions
);
serviceSchema.index({ name: 'text', description: 'text', category: 'text' });

const bookingSchema = new Schema(
  {
    bookingNo: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', index: true },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    vehicleNumber: { type: String, trim: true, uppercase: true },
    scheduledAt: { type: Date, required: true, index: true },
    notes: { type: String },
    amount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: BOOKING_STATUS_ENUM, default: 'pending', index: true },
    canceledAt: { type: Date },
    statusUpdatedAt: { type: Date },
    previousScheduledAt: { type: Date },
    rescheduledAt: { type: Date },
  },
  defaultSchemaOptions
);
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ status: 1, scheduledAt: 1 });

const mechanicSchema = new Schema(
  {
    mechanicCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    expertise: [{ type: String, trim: true }],
    yearsExperience: { type: Number, min: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    availability: { type: Boolean, default: true, index: true },
    status: { type: String, enum: ['active', 'on-leave', 'inactive'], default: 'active', index: true },
    assignedJobs: { type: Number, default: 0, min: 0 },
    currentLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
  },
  defaultSchemaOptions
);

const assignmentSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    mechanicId: { type: Schema.Types.ObjectId, ref: 'Mechanic', required: true, index: true },
    notes: { type: String },
    status: { type: String, enum: ASSIGNMENT_STATUS_ENUM, default: 'assigned', index: true },
    progress: [{
      status: { type: String, required: true },
      note: { type: String },
      at: { type: Date, default: Date.now },
    }],
  },
  defaultSchemaOptions
);
assignmentSchema.index({ mechanicId: 1, status: 1, createdAt: -1 });

const breakdownCallSchema = new Schema(
  {
    ticketNo: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true },
    location: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
    description: { type: String },
    status: { type: String, enum: BREAKDOWN_STATUS_ENUM, default: 'open', index: true },
    assignedMechanicId: { type: Schema.Types.ObjectId, ref: 'Mechanic', index: true },
    etaMinutes: { type: Number, min: 0 },
  },
  defaultSchemaOptions
);
breakdownCallSchema.index({ coordinates: '2dsphere' });

const repairSchema = new Schema(
  {
    repairNo: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, lowercase: true, trim: true },
    vehicle: { type: String, required: true, trim: true },
    registration: { type: String, trim: true, uppercase: true, index: true },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },
    pickupDrop: { type: Boolean, default: false },
    issue: { type: String },
    status: { type: String, enum: REPAIR_STATUS_ENUM, default: 'received', index: true },
    eta: { type: String },
    lastUpdate: { type: String },
  },
  defaultSchemaOptions
);
repairSchema.index({ phone: 1, createdAt: -1 });
repairSchema.index({ registration: 1, createdAt: -1 });

const inventorySchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    minStock: { type: Number, default: 5, min: 0 },
    active: { type: Boolean, default: true },
  },
  defaultSchemaOptions
);
inventorySchema.index({ stock: 1, minStock: 1 });

const partOrderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true, index: true },
    partId: { type: Schema.Types.ObjectId, ref: 'InventoryPart', required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    supplier: { type: String, required: true, trim: true },
    status: { type: String, enum: PART_ORDER_STATUS_ENUM, default: 'ordered', index: true },
    expectedDelivery: { type: Date },
  },
  defaultSchemaOptions
);

const modificationSchema = new Schema(
  {
    modCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    basePrice: { type: Number, min: 0, required: true },
    active: { type: Boolean, default: true, index: true },
  },
  defaultSchemaOptions
);

const modQuoteSchema = new Schema(
  {
    quoteNo: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    modId: { type: Schema.Types.ObjectId, ref: 'Modification', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true },
    additionalNotes: { type: String },
    quotePrice: { type: Number, min: 0 },
    status: { type: String, enum: MOD_QUOTE_STATUS_ENUM, default: 'requested', index: true },
  },
  defaultSchemaOptions
);

const modOrderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true, index: true },
    modQuoteId: { type: Schema.Types.ObjectId, ref: 'ModQuote', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scheduleDate: { type: Date },
    status: { type: String, enum: MOD_ORDER_STATUS_ENUM, default: 'created', index: true },
  },
  defaultSchemaOptions
);

const billingRecordSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true, minlength: 3, maxlength: 3 },
    status: { type: String, enum: INVOICE_STATUS_ENUM, default: 'issued', index: true },
    verified: { type: Boolean, default: false, index: true },
    verifiedAt: { type: Date },
    refundReason: { type: String },
    refundedAt: { type: Date },
  },
  defaultSchemaOptions
);
billingRecordSchema.index({ userId: 1, createdAt: -1 });

const paymentSchema = new Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'BillingRecord', index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true, trim: true, index: true },
    status: { type: String, enum: PAYMENT_STATUS_ENUM, default: 'initiated', index: true },
    gatewayProvider: { type: String, default: 'razorpay' },
    gatewayPaymentId: { type: String },
    gatewayOrderId: { type: String },
    gatewaySignature: { type: String, select: false },
    verifiedAt: { type: Date },
    refundedAt: { type: Date },
    refundReason: { type: String },
  },
  defaultSchemaOptions
);
paymentSchema.index({ userId: 1, createdAt: -1 });

const packageSchema = new Schema(
  {
    packageCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: PACKAGE_STATUS_ENUM, default: 'active', index: true },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, index: true },
    lastRenewedAt: { type: Date },
  },
  defaultSchemaOptions
);

const packageRenewalSchema = new Schema(
  {
    renewalNo: { type: String, required: true, unique: true, index: true },
    packageId: { type: Schema.Types.ObjectId, ref: 'Package', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: String, default: 'cash' },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
    renewedAt: { type: Date, default: Date.now },
  },
  defaultSchemaOptions
);

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: NOTIFICATION_TYPE_ENUM, default: 'system', index: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  defaultSchemaOptions
);
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const notificationLogSchema = new Schema(
  {
    channel: { type: String, enum: ['email', 'sms', 'push'], required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    subject: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued', index: true },
    sentAt: { type: Date },
  },
  defaultSchemaOptions
);

const contactSubmissionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    service: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'in-progress', 'resolved', 'closed'], default: 'new', index: true },
  },
  defaultSchemaOptions
);

const uploadAssetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true, trim: true, index: true },
    fileName: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, min: 0 },
    storageProvider: { type: String, default: 's3' },
    storagePath: { type: String, required: true },
    publicUrl: { type: String, required: true },
  },
  defaultSchemaOptions
);

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
  },
  defaultSchemaOptions
);

const locationSchema = new Schema(
  {
    locationCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String },
    country: { type: String, default: 'IN' },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
    active: { type: Boolean, default: true, index: true },
  },
  defaultSchemaOptions
);
locationSchema.index({ coordinates: '2dsphere' });

const serviceRateSchema = new Schema(
  {
    rateCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: String, required: true, trim: true, index: true },
    baseRate: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['flat', 'hour'], default: 'flat' },
    active: { type: Boolean, default: true, index: true },
  },
  defaultSchemaOptions
);

const reportSchema = new Schema(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    reportType: { type: String, required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    summary: { type: Schema.Types.Mixed },
    downloadUrl: { type: String },
  },
  defaultSchemaOptions
);

const reportScheduleSchema = new Schema(
  {
    reportType: { type: String, required: true, index: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: ['active', 'paused', 'disabled'], default: 'active', index: true },
    nextRun: { type: Date, required: true, index: true },
  },
  defaultSchemaOptions
);

const reviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    comment: { type: String },
  },
  defaultSchemaOptions
);

const models = {
  User: mongoose.model('User', userSchema),
  OtpCode: mongoose.model('OtpCode', otpCodeSchema),
  PasswordReset: mongoose.model('PasswordReset', passwordResetSchema),
  Vehicle: mongoose.model('Vehicle', vehicleSchema),
  Service: mongoose.model('Service', serviceSchema),
  Booking: mongoose.model('Booking', bookingSchema),
  Mechanic: mongoose.model('Mechanic', mechanicSchema),
  Assignment: mongoose.model('Assignment', assignmentSchema),
  BreakdownCall: mongoose.model('BreakdownCall', breakdownCallSchema),
  Repair: mongoose.model('Repair', repairSchema),
  InventoryPart: mongoose.model('InventoryPart', inventorySchema),
  PartOrder: mongoose.model('PartOrder', partOrderSchema),
  Modification: mongoose.model('Modification', modificationSchema),
  ModQuote: mongoose.model('ModQuote', modQuoteSchema),
  ModOrder: mongoose.model('ModOrder', modOrderSchema),
  BillingRecord: mongoose.model('BillingRecord', billingRecordSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  Package: mongoose.model('Package', packageSchema),
  PackageRenewal: mongoose.model('PackageRenewal', packageRenewalSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  NotificationLog: mongoose.model('NotificationLog', notificationLogSchema),
  ContactSubmission: mongoose.model('ContactSubmission', contactSubmissionSchema),
  UploadAsset: mongoose.model('UploadAsset', uploadAssetSchema),
  Setting: mongoose.model('Setting', settingSchema),
  Location: mongoose.model('Location', locationSchema),
  ServiceRate: mongoose.model('ServiceRate', serviceRateSchema),
  Report: mongoose.model('Report', reportSchema),
  ReportSchedule: mongoose.model('ReportSchedule', reportScheduleSchema),
  Review: mongoose.model('Review', reviewSchema),
};

module.exports = models;
