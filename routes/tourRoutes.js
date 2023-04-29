const express = require('express');

const router = express.Router();
const tourControllers = require('../controllers/tourControllers');
const authControllers = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

// RE-Direct Route
router.use('/:tourId/reviews', reviewRouter);

// Access to All
router
  .route('/top-5-cheap')
  .get(tourControllers.aliasTop5Cheap, tourControllers.getAllTours);

router
  .route('/top-5')
  .get(tourControllers.aliasTop5Tours, tourControllers.getAllTours);

router.route('/tour-stat').get(tourControllers.getTourStat);
router.route('/').get(tourControllers.getAllTours);
router.route('/:id?').get(tourControllers.getTour);

// Tours Routes
//ALIAS

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourControllers.getToursWithin);

router
  .route('/distances/:latlng/unit/:unit')
  .get(tourControllers.getToursDistance);

router.use(authControllers.protectRoute);
// ONLY AUTHENTICATED USERS ARE ALLOWED

router
  .route('/')
  .post(
    authControllers.restrictTo('admin', 'lead-guide'),
    tourControllers.createTour
  );
router.route('/monthly-plan/:year?').get(tourControllers.getMonthlyPlan);

// Routes

router
  .route('/:id?')
  .patch(
    authControllers.restrictTo('admin', 'lead-guide'),
    tourControllers.updateTourPhotos,
    tourControllers.resizeTourImages,
    tourControllers.updateTour
  )
  .delete(
    authControllers.restrictTo('admin', 'lead-guide'),
    tourControllers.deleteTour
  );
module.exports = router;
