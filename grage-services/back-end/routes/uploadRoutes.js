const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File upload APIs
 */

/**
 * @swagger
 * /api/uploads/profile-photo:
 *   post:
 *     summary: Upload profile photo
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageBase64]
 *             properties:
 *               imageBase64:
 *                 type: string
 *                 description: Base64-encoded image string
 *     responses:
 *       200:
 *         description: Profile photo uploaded
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/api/uploads/profile-photo',
  authMiddleware,
  body('imageBase64').custom((value, { req }) => {
    if (value || req.body?.photo) return true;
    throw new Error('imageBase64 is required');
  }),
  validate,
  uploadController.uploadProfilePhoto
);

module.exports = router;
