const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const packageController = require('../controllers/packageController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: Subscription package APIs
 */

/**
 * @swagger
 * /api/packages:
 *   get:
 *     summary: List all packages (admin)
 *     tags: [Packages]
 *     responses:
 *       200:
 *         description: All packages
 */
router.get('/api/packages', packageController.listAllPackages);
router.get('/api/packages/:id', packageController.getPackageById);

router.post(
  '/api/packages',
  authMiddleware,
  adminMiddleware,
  body('name').notEmpty().withMessage('package name is required'),
  body('description').notEmpty().withMessage('description is required'),
  body('price').isFloat({ gt: 0 }).withMessage('price must be greater than 0'),
  body('duration').notEmpty().withMessage('duration is required'),
  body('features').isArray({ min: 1 }).withMessage('features must be a non-empty list'),
  body('status').optional().isIn(['active', 'inactive', 'Active', 'Inactive']).withMessage('status must be active or inactive'),
  validate,
  packageController.createPackage
);

router.put(
  '/api/packages/:id',
  authMiddleware,
  adminMiddleware,
  param('id').notEmpty().withMessage('package id is required'),
  body('name').optional().notEmpty().withMessage('package name cannot be empty'),
  body('description').optional().notEmpty().withMessage('description cannot be empty'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('price must be greater than 0'),
  body('duration').optional().notEmpty().withMessage('duration cannot be empty'),
  body('features').optional().isArray().withMessage('features must be a list'),
  body('status').optional().isIn(['active', 'inactive', 'Active', 'Inactive']).withMessage('status must be active or inactive'),
  validate,
  packageController.updatePackage
);

router.delete(
  '/api/packages/:id',
  authMiddleware,
  adminMiddleware,
  param('id').notEmpty().withMessage('package id is required'),
  validate,
  packageController.deletePackage
);

/**
 * @swagger
 * /api/packages/me:
 *   get:
 *     summary: Get current user's packages
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user package list
 *       401:
 *         description: Unauthorized
 */
router.get('/api/packages/me', authMiddleware, packageController.getMyPackages);

/**
 * @swagger
 * /api/packages/{id}/renew:
 *   post:
 *     summary: Renew package
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Package renewed
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/api/packages/:id/renew',
  authMiddleware,
  param('id').notEmpty().withMessage('package id is required'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('amount must be greater than 0'),
  validate,
  packageController.renewPackage
);

/**
 * @swagger
 * /api/packages/subscribe:
 *   post:
 *     summary: Subscribe to a service package
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               packageId:
 *                 type: string
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               features:
 *                 type: array
 *     responses:
 *       201:
 *         description: Package subscribed
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Package already active
 */
router.post(
  '/api/packages/subscribe',
  authMiddleware,
  body('name').notEmpty().withMessage('package name is required'),
  body('price').notEmpty().withMessage('price is required'),
  validate,
  packageController.subscribePackage
);

module.exports = router;
