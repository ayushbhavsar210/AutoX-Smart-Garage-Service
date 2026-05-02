const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const repairController = require('../controllers/repairController');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Repairs
 *   description: Repair scheduling and status APIs
 */

/**
 * @swagger
 * /api/repairs:
 *   get:
 *     summary: List all repair requests
 *     tags: [Repairs]
 *     responses:
 *       200:
 *         description: All repair records
 */
router.get('/api/repairs', repairController.listAllRepairs);

/**
 * @swagger
 * /api/repairs/schedule:
 *   post:
 *     summary: Schedule a repair service
 *     tags: [Repairs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, vehicle, preferredDate]
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               vehicle:
 *                 type: string
 *               preferredDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Repair request created
 */
router.post(
  '/api/repairs/schedule',
  body('name').notEmpty().withMessage('name is required'),
  body('phone').notEmpty().withMessage('phone is required'),
  body('vehicle').notEmpty().withMessage('vehicle is required'),
  body('preferredDate').notEmpty().withMessage('preferredDate is required'),
  validate,
  repairController.scheduleRepair
);

/**
 * @swagger
 * /api/repairs/status:
 *   get:
 *     summary: Get repair status
 *     tags: [Repairs]
 *     parameters:
 *       - in: query
 *         name: phone
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: ref
 *         required: false
 *         schema:
 *           type: string
 *       - in: query
 *         name: reg
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Repair status details
 */
router.get(
  '/api/repairs/status',
  query('phone').optional().notEmpty().withMessage('phone cannot be empty'),
  query('ref').optional().notEmpty().withMessage('ref cannot be empty'),
  query('reg').optional().notEmpty().withMessage('reg cannot be empty'),
  validate,
  repairController.getRepairStatus
);

module.exports = router;
