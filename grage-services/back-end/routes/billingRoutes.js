const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const billingController = require('../controllers/billingController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Billing
 *   description: Billing APIs
 */

/**
 * @swagger
 * /api/billing/create:
 *   post:
 *     summary: Create billing record
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, amount, currency]
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "101"
 *               amount:
 *                 type: number
 *                 example: 2499
 *               currency:
 *                 type: string
 *                 example: INR
 *     responses:
 *       201:
 *         description: Billing record created
 *       400:
 *         description: Validation error
 */
router.post(
  '/api/billing/create',
  authMiddleware,
  adminMiddleware,
  body('customerType').optional().isString().withMessage('customerType must be a string'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('currency must be 3 letters'),
  validate,
  billingController.createBilling
);

router.get('/api/billing/customers/registered', billingController.getRegisteredCustomers);
router.get('/billing/customers/registered', billingController.getRegisteredCustomers);
router.get('/api/billing/registered-users', billingController.getRegisteredCustomers);

router.get(
  '/api/billing/customers/registered/:userId',
  param('userId').notEmpty().withMessage('userId is required'),
  validate,
  billingController.getRegisteredCustomerProfile
);

router.get(
  '/billing/customers/registered/:userId',
  param('userId').notEmpty().withMessage('userId is required'),
  validate,
  billingController.getRegisteredCustomerProfile
);

router.get(
  '/api/billing/registered-users/:userId',
  param('userId').notEmpty().withMessage('userId is required'),
  validate,
  billingController.getRegisteredCustomerProfile
);

/**
 * @swagger
 * /api/billing/user/{userId}:
 *   get:
 *     summary: Get billing records by user
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User billing history
 */
router.get(
  '/api/billing/user/:userId',
  param('userId').notEmpty().withMessage('userId is required'),
  validate,
  billingController.getBillingByUser
);

/**
 * @swagger
 * /api/billing/me:
 *   get:
 *     summary: Get logged-in user billing records
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user billing history
 *       401:
 *         description: Unauthorized
 */
router.get('/api/billing/me', authMiddleware, (req, res, next) => {
  // Use userId from authenticated user (fallback to _id if not available)
  const userId = req.user.userId || String(req.user._id);
  req.params.userId = String(userId);
  return billingController.getBillingByUser(req, res, next);
});

router.get('/customer/invoices', authMiddleware, (req, res, next) => {
  const userId = req.user.userId || String(req.user._id);
  req.params.userId = String(userId);
  return billingController.getBillingByUser(req, res, next);
});

/**
 * @swagger
 * /api/billing/all:
 *   get:
 *     summary: Get all billing records
 *     tags: [Billing]
 *     parameters:
 *       - in: query
 *         name: verified
 *         required: false
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Billing records list
 */
router.get(
  '/api/billing/all',
  query('verified').optional().isBoolean().withMessage('verified must be true or false'),
  validate,
  billingController.getAllBilling
);

/**
 * @swagger
 * /api/billing:
 *   get:
 *     summary: Get all billing records (alias)
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: Billing records list
 */
router.get('/api/billing', billingController.getAllBilling);

/**
 * @swagger
 * /api/billing/refund:
 *   post:
 *     summary: Refund billing record
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceNumber, reason]
 *             properties:
 *               invoiceNumber:
 *                 type: string
 *                 example: INV-1001
 *               reason:
 *                 type: string
 *                 example: Duplicate charge
 *     responses:
 *       200:
 *         description: Refund processed
 */
router.post(
  '/api/billing/refund',
  body('invoiceNumber').notEmpty().withMessage('invoiceNumber is required'),
  body('reason').notEmpty().withMessage('reason is required'),
  validate,
  billingController.refundBilling
);

/**
 * @swagger
 * /api/billing/verify/{invoiceNumber}:
 *   patch:
 *     summary: Verify billing record
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Billing verified
 */
router.patch(
  '/api/billing/verify/:invoiceNumber',
  param('invoiceNumber').notEmpty().withMessage('invoiceNumber is required'),
  validate,
  billingController.verifyBilling
);

router.get(
  '/api/billing/:invoiceNumber',
  param('invoiceNumber').notEmpty().withMessage('invoiceNumber is required'),
  validate,
  billingController.getBillingByInvoiceNumber
);

router.put(
  '/api/billing/:invoiceNumber',
  param('invoiceNumber').notEmpty().withMessage('invoiceNumber is required'),
  body('customerType').optional().isString().withMessage('customerType must be a string'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('currency must be 3 letters'),
  validate,
  billingController.updateBilling
);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, amount, method]
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 101
 *               amount:
 *                 type: number
 *                 example: 2499
 *               method:
 *                 type: string
 *                 example: card
 *     responses:
 *       201:
 *         description: Payment created
 */
router.post(
  '/api/payments',
  body('userId').isInt({ gt: 0 }).withMessage('userId must be a positive integer'),
  body('amount').isFloat({ gt: 0 }).withMessage('amount must be greater than 0'),
  body('method').notEmpty().withMessage('method is required'),
  validate,
  billingController.createPayment
);

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process payment (alias)
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Payment processed
 */
router.post('/api/payments/process', billingController.createPayment);

/**
 * @swagger
 * /api/payments/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 */
router.get(
  '/api/payments/:paymentId',
  param('paymentId').notEmpty().withMessage('paymentId is required'),
  validate,
  billingController.getPaymentById
);

/**
 * @swagger
 * /api/payments/user/{userId}:
 *   get:
 *     summary: Get user payments
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User payments list
 */
router.get(
  '/api/payments/user/:userId',
  param('userId').isInt({ gt: 0 }).withMessage('userId must be a positive integer'),
  validate,
  billingController.getUserPayments
);

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify payment (Razorpay)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId, razorpayPaymentId]
 *             properties:
 *               paymentId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified
 */
router.post(
  '/api/payments/verify',
  body('paymentId').notEmpty().withMessage('paymentId is required'),
  body('razorpayPaymentId').notEmpty().withMessage('razorpayPaymentId is required'),
  validate,
  billingController.verifyPayment
);

/**
 * @swagger
 * /api/refunds:
 *   post:
 *     summary: Process refund
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId]
 *             properties:
 *               paymentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund processed
 */
router.post(
  '/api/refunds',
  body('paymentId').notEmpty().withMessage('paymentId is required'),
  validate,
  billingController.processRefund
);

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     summary: List invoices
 *     tags: [Invoices]
 *     responses:
 *       200:
 *         description: Invoice list
 */
router.get('/api/invoices', billingController.getInvoices);

/**
 * @swagger
 * /api/invoices/download/{invoiceId}:
 *   get:
 *     summary: Download invoice
 *     tags: [Invoices]
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice download URL
 */
router.get(
  '/api/invoices/download/:invoiceId',
  param('invoiceId').notEmpty().withMessage('invoiceId is required'),
  validate,
  billingController.downloadInvoice
);

module.exports = router;
