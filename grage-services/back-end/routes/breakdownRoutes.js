const express = require('express');
const { param, body } = require('express-validator');
const router = express.Router();
const breakdownController = require('../controllers/breakdownController');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Breakdown
 *   description: Breakdown and roadside assistance
 */

/**
 * @swagger
 * /api/breakdown-calls:
 *   post:
 *     summary: Request breakdown assistance
 *     tags: [Breakdown]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, location]
 *             properties:
 *               userId:
 *                 type: integer
 *               location:
 *                 type: string
 *                 example: Ahmedabad Ring Road
 *     responses:
 *       201:
 *         description: Breakdown request created
 */
router.post(
  '/api/breakdown-calls',
  body('userId').optional().isInt({ gt: 0 }).withMessage('userId must be a positive integer'),
  body('location').notEmpty().withMessage('location is required'),
  validate,
  breakdownController.createBreakdownCall
);

/**
 * @swagger
 * /api/breakdown-calls:
 *   get:
 *     summary: List breakdown requests
 *     tags: [Breakdown]
 *     responses:
 *       200:
 *         description: Breakdown requests list
 */
router.get('/api/breakdown-calls', breakdownController.listBreakdownCalls);

/**
 * @swagger
 * /api/breakdown-calls/{id}:
 *   get:
 *     summary: Get breakdown request details
 *     tags: [Breakdown]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Breakdown details
 */
router.get(
  '/api/breakdown-calls/:id',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  breakdownController.getBreakdownCall
);

/**
 * @swagger
 * /api/breakdown-calls/{id}:
 *   put:
 *     summary: Update breakdown status
 *     tags: [Breakdown]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: assigned
 *     responses:
 *       200:
 *         description: Breakdown status updated
 */
router.put(
  '/api/breakdown-calls/:id',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  breakdownController.updateBreakdownStatus
);

/**
 * @swagger
 * /api/breakdown-calls/nearby:
 *   get:
 *     summary: Find nearest mechanic
 *     tags: [Breakdown]
 *     responses:
 *       200:
 *         description: Nearby mechanic details
 */
router.get('/api/breakdown-calls/nearby', breakdownController.findNearestMechanic);

module.exports = router;
