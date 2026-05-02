const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Service bookings
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: View user's appointment history
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User booking list
 *       401:
 *         description: Unauthorized
 */
router.get('/bookings', authMiddleware, bookingController.getBookings);

router.get('/api/bookings', authMiddleware, adminMiddleware, bookingController.getAllBookings);
router.get('/api/get_bookings.php', authMiddleware, adminMiddleware, bookingController.getAllBookings);

router.get('/api/bookings/me', authMiddleware, bookingController.getMyBookings);
router.get('/api/bookings/history/me', authMiddleware, bookingController.getMyServiceHistory);
router.get('/customer/bookings', authMiddleware, bookingController.getMyBookings);
router.get('/customer/service-history', authMiddleware, bookingController.getMyServiceHistory);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found
 */
router.get(
  '/bookings/:id',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  bookingController.getBookingById
);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Schedule a new service appointment
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceId, scheduledAt]
 *             properties:
 *               serviceId:
 *                 type: integer
 *                 example: 2
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-03-02T10:00:00.000Z
 *     responses:
 *       201:
 *         description: Booking created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/bookings',
  authMiddleware,
  body('serviceId')
    .notEmpty().withMessage('serviceId is required')
    .custom((value) => {
      // Allow numeric IDs or MongoDB ObjectIds (24-char hex strings)
      const numVal = Number(value);
      const isNumeric = !isNaN(numVal) && value !== '';
      const isObjectId = /^[a-f0-9]{24}$/i.test(String(value));
      if (!isNumeric && !isObjectId) {
        throw new Error('serviceId must be a positive number or valid MongoDB ObjectId');
      }
      return true;
    }),
  body('scheduledAt').notEmpty().withMessage('scheduledAt is required'),
  validate,
  bookingController.createBooking
);

router.post('/api/bookings', bookingController.createBookingPublic);

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   put:
 *     summary: Cancel an existing appointment
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking canceled
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/bookings/:id/cancel',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  bookingController.cancelBooking
);

router.put('/api/bookings/:id/cancel', authMiddleware, bookingController.cancelBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking deleted
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/bookings/:id',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  bookingController.deleteBooking
);

/**
 * @swagger
 * /bookings/stats:
 *   get:
 *     summary: Get booking statistics (admin)
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Booking stats
 */
router.get('/bookings/stats', bookingController.getBookingStats);

/**
 * @swagger
 * /bookings/{id}/status:
 *   put:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 example: completed
 *     responses:
 *       200:
 *         description: Booking status updated
 *       400:
 *         description: Validation error
 */
router.put(
  '/bookings/:id/status',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('status').notEmpty().withMessage('status is required'),
  validate,
  bookingController.updateBookingStatus
);

router.put(
  '/api/bookings/:id/status',
  authMiddleware,
  adminMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('status').notEmpty().withMessage('status is required'),
  validate,
  bookingController.updateBookingStatus
);

router.delete(
  '/api/bookings/:id',
  authMiddleware,
  adminMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  bookingController.deleteBookingByAdmin
);

/**
 * @swagger
 * /bookings/slots:
 *   get:
 *     summary: Get available time slots
 *     tags: [Bookings]
 *     responses:
 *       200:
 *         description: Available slots
 */
router.get('/bookings/slots', bookingController.getAvailableSlots);

/**
 * @swagger
 * /bookings/{id}/reschedule:
 *   post:
 *     summary: Reschedule booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newScheduledAt]
 *             properties:
 *               newScheduledAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-03-05T11:30:00.000Z
 *     responses:
 *       200:
 *         description: Booking rescheduled
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/bookings/:id/reschedule',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('newScheduledAt').notEmpty().withMessage('newScheduledAt is required'),
  validate,
  bookingController.rescheduleBooking
);

router.post('/api/bookings/:id/reschedule', authMiddleware, bookingController.rescheduleBooking);

module.exports = router;
