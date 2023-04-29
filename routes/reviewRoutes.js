const express = require('express');

const router = express.Router({ mergeParams: true });
const authControllers = require('./../controllers/authController');
const reviewControllers = require('./../controllers/reviewController');

router.use(authControllers.protectRoute);

router
  .route('/')
  .get(reviewControllers.getAllReviews)
  .post(authControllers.restrictTo('user'), reviewControllers.createReview);

router
  .route('/:id')
  .get(reviewControllers.getReviewById)
  .delete(
    authControllers.protectRoute,
    authControllers.restrictTo('admin'),
    reviewControllers.runBeforeDeleteReview,
    reviewControllers.deleteReview
  )
  .patch(
    authControllers.restrictTo('user', 'admin'),
    reviewControllers.updateReview
  );

module.exports = router;
