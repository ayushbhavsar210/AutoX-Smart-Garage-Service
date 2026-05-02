const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const contactController = require('../controllers/contactController');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form API
 */

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Rahul Patel
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rahul@example.com
 *               message:
 *                 type: string
 *                 example: Need quote for full service
 *     responses:
 *       201:
 *         description: Contact request submitted
 *       400:
 *         description: Validation error
 */
router.post(
  '/api/contact',
  body('name').notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('valid email is required'),
  body('message').notEmpty().withMessage('message is required'),
  validate,
  contactController.submitContactForm
);

/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: List contact form submissions
 *     tags: [Contact]
 *     responses:
 *       200:
 *         description: Contact submissions list
 */
router.get('/api/contact', contactController.listContactSubmissions);

module.exports = router;
