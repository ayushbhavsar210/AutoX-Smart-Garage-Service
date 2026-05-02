const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const reviewController = require('../controllers/reviewController');

router.get('/customer/ratings/reviewables', authMiddleware, reviewController.getReviewableBookings);

router.post(
  '/customer/ratings',
  authMiddleware,
  body('bookingId').isInt({ gt: 0 }).withMessage('bookingId must be a positive integer'),
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('comment must be up to 500 characters'),
  validate,
  reviewController.submitRating
);

module.exports = router;
