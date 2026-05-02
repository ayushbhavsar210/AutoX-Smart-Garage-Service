const express = require('express');
const { param, body } = require('express-validator');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications
 */

/**
 * @swagger
 * /api/notifications/all:
 *   get:
 *     summary: List all notifications (admin)
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications
 */
router.get('/api/notifications/all', authMiddleware, adminMiddleware, notificationController.listAllNotifications);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get logged-in user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user notifications
 *       401:
 *         description: Unauthorized
 */
router.get('/api/notifications', authMiddleware, notificationController.getMyNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all current user notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.patch('/api/notifications/read-all', authMiddleware, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{userId}:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User notifications
 */
router.get(
  '/api/notifications/:userId',
  param('userId').isInt({ gt: 0 }).withMessage('userId must be a positive integer'),
  validate,
  notificationController.getNotifications
);

/**
 * @swagger
 * /api/notifications/send:
 *   post:
 *     summary: Send notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, message]
 *             properties:
 *               userId:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification sent
 */
router.post(
  '/api/notifications/send',
  body('userId').isInt({ gt: 0 }).withMessage('userId must be a positive integer'),
  body('message').notEmpty().withMessage('message is required'),
  validate,
  notificationController.sendNotification
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put(
  '/api/notifications/:id/read',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  notificationController.markAsRead
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete(
  '/api/notifications/:id',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  notificationController.deleteNotification
);

/**
 * @swagger
 * /api/notifications/email:
 *   post:
 *     summary: Send email notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, subject, message]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email sent
 */
router.post(
  '/api/notifications/email',
  body('email').isEmail().withMessage('email must be valid'),
  body('subject').notEmpty().withMessage('subject is required'),
  body('message').notEmpty().withMessage('message is required'),
  validate,
  notificationController.sendEmailNotification
);

/**
 * @swagger
 * /api/notifications/sms:
 *   post:
 *     summary: Send SMS notification
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, message]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: SMS sent
 */
router.post(
  '/api/notifications/sms',
  body('phoneNumber').notEmpty().withMessage('phoneNumber is required'),
  body('message').notEmpty().withMessage('message is required'),
  validate,
  notificationController.sendSmsNotification
);

module.exports = router;
