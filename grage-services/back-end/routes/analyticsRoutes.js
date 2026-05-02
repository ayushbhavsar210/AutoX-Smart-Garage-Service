const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Business analytics and reporting
 */

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard metrics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Dashboard metrics
 */
router.get('/api/analytics/dashboard', analyticsController.getDashboardMetrics);

/**
 * @swagger
 * /api/analytics/revenue:
 *   get:
 *     summary: Get revenue analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Revenue analytics
 */
router.get('/api/analytics/revenue', analyticsController.getRevenueAnalytics);

/**
 * @swagger
 * /api/analytics/bookings:
 *   get:
 *     summary: Get booking trends
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Booking trends
 */
router.get('/api/analytics/bookings', analyticsController.getBookingTrends);

/**
 * @swagger
 * /api/analytics/customer-satisfaction:
 *   get:
 *     summary: Get customer satisfaction metrics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Customer satisfaction metrics
 */
router.get('/api/analytics/customer-satisfaction', analyticsController.getCustomerSatisfaction);

/**
 * @swagger
 * /api/reports/data:
 *   get:
 *     summary: Get report data for data grid
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: reportType
 *         schema:
 *           type: string
 *           example: bookings
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered report data
 */
router.get('/api/reports/data', analyticsController.getReportData);

/**
 * @swagger
 * /api/reports/generate:
 *   post:
 *     summary: Generate custom report
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reportType]
 *             properties:
 *               reportType:
 *                 type: string
 *                 example: revenue
 *     responses:
 *       200:
 *         description: Report generated
 */
router.post(
  '/api/reports/generate',
  body('reportType').notEmpty().withMessage('reportType is required'),
  validate,
  analyticsController.generateReport
);

/**
 * @swagger
 * /api/reports/schedule:
 *   post:
 *     summary: Schedule report generation
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reportType, frequency, email]
 *             properties:
 *               reportType:
 *                 type: string
 *               frequency:
 *                 type: string
 *                 example: weekly
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Report schedule created
 */
router.post(
  '/api/reports/schedule',
  body('reportType').notEmpty().withMessage('reportType is required'),
  body('frequency').notEmpty().withMessage('frequency is required'),
  body('email').isEmail().withMessage('email must be valid'),
  validate,
  analyticsController.scheduleReport
);

module.exports = router;
