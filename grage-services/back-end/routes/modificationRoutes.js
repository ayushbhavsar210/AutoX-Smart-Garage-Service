const express = require('express');
const { param, body } = require('express-validator');
const router = express.Router();
const modificationController = require('../controllers/modificationController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Modifications
 *   description: Vehicle modifications and customization
 */

/**
 * @swagger
 * /api/modifications:
 *   get:
 *     summary: List available modifications
 *     tags: [Modifications]
 *     responses:
 *       200:
 *         description: Modifications list
 */
router.get('/api/modifications', authMiddleware, modificationController.listModifications);

router.get('/api/modifications/me', authMiddleware, (req, res, next) => {
  req.query.mine = 'true';
  return modificationController.listModifications(req, res, next);
});

router.post('/api/modifications', authMiddleware, modificationController.createModification);

/**
 * @swagger
 * /api/modifications/{id}:
 *   get:
 *     summary: Get modification details
 *     tags: [Modifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Modification details
 */
router.get(
  '/api/modifications/:id',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  modificationController.getModificationById
);

router.put(
  '/api/modifications/:id/decision',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('decision').isIn(['book', 'not_now']).withMessage('decision must be book or not_now'),
  validate,
  modificationController.setModificationDecision
);

router.put(
  '/api/modifications/:id/admin-quote',
  authMiddleware,
  adminMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('exactPrice').isFloat({ gt: 0 }).withMessage('exactPrice must be a positive number'),
  validate,
  modificationController.respondModificationQuote
);

router.put(
  '/api/modifications/:id/pickup-drop',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  modificationController.updatePickupDrop
);

router.put(
  '/api/modifications/:id/status',
  authMiddleware,
  adminMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  body('status').notEmpty().withMessage('status is required'),
  validate,
  modificationController.updateModificationStatus
);

/**
 * @swagger
 * /api/mod-quotes:
 *   post:
 *     summary: Create modification quote
 *     tags: [Modifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, modId]
 *             properties:
 *               userId:
 *                 type: integer
 *               modId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Quote created
 */
router.post(
  '/api/mod-quotes',
  authMiddleware,
  body('modId').isInt({ gt: 0 }).withMessage('modId must be a positive integer'),
  validate,
  modificationController.createModQuote
);

/**
 * @swagger
 * /api/mod-quotes:
 *   get:
 *     summary: List modification quotes
 *     tags: [Modifications]
 *     responses:
 *       200:
 *         description: Quote list
 */
router.get('/api/mod-quotes', authMiddleware, modificationController.listModQuotes);

/**
 * @swagger
 * /api/mod-quotes/{id}:
 *   put:
 *     summary: Update quote status
 *     tags: [Modifications]
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
 *     responses:
 *       200:
 *         description: Quote updated
 */
router.put(
  '/api/mod-quotes/:id',
  authMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  modificationController.updateModQuoteStatus
);

/**
 * @swagger
 * /api/mod-orders:
 *   post:
 *     summary: Create modification order
 *     tags: [Modifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [modQuoteId]
 *             properties:
 *               modQuoteId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Order created
 */
router.post(
  '/api/mod-orders',
  authMiddleware,
  body('modQuoteId').isInt({ gt: 0 }).withMessage('modQuoteId must be a positive integer'),
  validate,
  modificationController.createModOrder
);

module.exports = router;
