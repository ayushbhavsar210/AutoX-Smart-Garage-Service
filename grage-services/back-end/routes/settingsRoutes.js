const express = require('express');
const { param, body } = require('express-validator');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: System settings and configuration
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: System settings
 */
router.get('/api/settings', settingsController.getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update system settings
 *     tags: [Settings]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *               supportEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put(
  '/api/settings',
  body('businessName').optional().isLength({ min: 3 }).withMessage('businessName must be at least 3 characters'),
  validate,
  settingsController.updateSettings
);

/**
 * @swagger
 * /api/company-info:
 *   get:
 *     summary: Get company information
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Company info
 */
router.get('/api/company-info', settingsController.getCompanyInfo);

/**
 * @swagger
 * /api/locations:
 *   get:
 *     summary: Get all locations
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Locations list
 */
router.get('/api/locations', settingsController.getLocations);

/**
 * @swagger
 * /api/locations:
 *   post:
 *     summary: Create new location
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address]
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Location created
 */
router.post(
  '/api/locations',
  body('name').notEmpty().withMessage('name is required'),
  body('address').notEmpty().withMessage('address is required'),
  validate,
  settingsController.manageLocation
);

/**
 * @swagger
 * /api/locations/{id}:
 *   put:
 *     summary: Update location
 *     tags: [Settings]
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
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Location updated
 */
router.put(
  '/api/locations/:id',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  settingsController.manageLocation
);

/**
 * @swagger
 * /api/rates:
 *   get:
 *     summary: Get service rates
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Service rates
 */
router.get('/api/rates', settingsController.getServiceRates);

/**
 * @swagger
 * /api/rates:
 *   post:
 *     summary: Update service rates
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceRateUpdates]
 *             properties:
 *               serviceRateUpdates:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Rates updated
 */
router.post(
  '/api/rates',
  body('serviceRateUpdates').isArray().withMessage('serviceRateUpdates must be an array'),
  validate,
  settingsController.updateServiceRates
);

module.exports = router;
