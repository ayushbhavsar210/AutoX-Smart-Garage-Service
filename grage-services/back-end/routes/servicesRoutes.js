const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const validate = require('../middleware/validationMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Garage services
 */

/**
 * @swagger
 * /services:
 *   get:
 *     summary: List all services
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Services list
 */
router.get('/services', servicesController.getServices);
router.get('/api/services', servicesController.getServices);

/**
 * @swagger
 * /services/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Service details
 *       404:
 *         description: Service not found
 */
router.get(
  '/services/:id',
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  servicesController.getServiceById
);
router.get('/api/services/:id', servicesController.getServiceById);

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a service
 *     tags: [Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, description]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Engine Oil Change
 *               price:
 *                 type: number
 *                 example: 1499
 *               description:
 *                 type: string
 *                 example: Complete synthetic oil replacement
 *     responses:
 *       201:
 *         description: Service created
 *       400:
 *         description: Validation error
 */
router.post(
  '/services',
  authMiddleware,
  adminMiddleware,
  body('name').notEmpty().withMessage('name is required'),
  body('description').notEmpty().withMessage('description is required'),
  validate,
  servicesController.createService
);
router.post('/api/services', authMiddleware, adminMiddleware, servicesController.createService);

/**
 * @swagger
 * /services/{id}:
 *   put:
 *     summary: Update a service
 *     tags: [Services]
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
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service updated
 *       400:
 *         description: Validation error
 */
router.put(
  '/services/:id',
  authMiddleware,
  adminMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  servicesController.updateService
);
router.put('/api/services/:id', authMiddleware, adminMiddleware, servicesController.updateService);

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Delete a service
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Service deleted
 */
router.delete(
  '/services/:id',
  authMiddleware,
  adminMiddleware,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer'),
  validate,
  servicesController.deleteService
);
router.delete('/api/services/:id', authMiddleware, adminMiddleware, servicesController.deleteService);

/**
 * @swagger
 * /services/search:
 *   get:
 *     summary: Search services
 *     tags: [Services]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: false
 *         schema:
 *           type: string
 *         description: Search keyword
 *     responses:
 *       200:
 *         description: Matching services
 */
router.get('/services/search', servicesController.searchServices);

/**
 * @swagger
 * /services/category/{category}:
 *   get:
 *     summary: Get services by category
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Services by category
 */
router.get(
  '/services/category/:category',
  param('category').notEmpty().withMessage('category is required'),
  validate,
  servicesController.getServicesByCategory
);

module.exports = router;
