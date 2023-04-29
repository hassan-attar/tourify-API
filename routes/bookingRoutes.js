const express = require('express');

const router = express.Router({ mergeParams: true });
const authControllers = require('./../controllers/authController');
const bookingControllers = require('./../controllers/bookingControllers');

router.use(authControllers.protectRoute);

router.get('/check-out/:tourId', bookingControllers.getCheckoutSession);

router.use(authControllers.restrictTo('admin'));

router
  .route('/')
  .get(bookingControllers.getAllBookings)
  .post(bookingControllers.creaeteBooking);
router
  .route('/:id')
  .get(bookingControllers.getBooking)
  .patch(bookingControllers.updateBooking)
  .delete(bookingControllers.deleteBooking);
module.exports = router;
