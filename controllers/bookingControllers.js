const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const AppError = require('./../utils/appError');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factoryFunc = require('./factoryFuncHandler');
const Booking = require('../models/bookingModel');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // get the current tour
  const tour = await Tour.findById(req.params.tourId);
  // get data from stripe to create the checkout session for the tour
  const { data } = await stripe.prices.search({
    query: `active:'true' AND product:'${tour.id}'`,
  });
  const priceId = data[0].id;
  // console.log(priceId);
  //make a stripe session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/`,
    currency: 'cad',
    customer_email: req.user.email,
    client_reference_id: req.params.id,
    automatic_tax: {
      enabled: true,
    },
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
  });
  // send session to client
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.deleteBooking = factoryFunc.deleteOne(Booking, { docName: 'booking' });
exports.createBooking = factoryFunc.createOne(Booking, { docName: 'booking' });
exports.updateBooking = factoryFunc.updateOne(Booking, { docName: 'booking' });
exports.getBooking = factoryFunc.getOne(Booking, { docName: 'booking' });
exports.getAllBookings = factoryFunc.getAll(Booking, { docName: 'booking' });
