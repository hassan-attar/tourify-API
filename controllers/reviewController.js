const Review = require('./../models/reviewModel');
const factoryFunc = require('./factoryFuncHandler');
// const catchAsync = require('./../utils/catchAsync');
// const AppError = require('./../utils/appError');
// const APIFeatures = require('./../utils/APIFeatures');

exports.getAllReviews = factoryFunc.getAll(Review, {
  populate: {
    path: 'tour',
    select: 'name',
  },
  docName: 'review',
});
exports.runBeforeDeleteReview = (req, res, next) => {
  // This can be inserted into the stack of middlewares to run before a specific controller to handle some issues.
  next();
};
exports.getReviewById = factoryFunc.getOne(Review, { docName: 'review' });
exports.createReview = factoryFunc.createOne(Review, { docName: 'review' });
exports.deleteReview = factoryFunc.deleteOne(Review, { docName: 'review' });
exports.updateReview = factoryFunc.updateOne(Review, { docName: 'review' });

/*
catchAsync(async (req, res, next) => {
  console.log(Review);
  const filter = {};
  if (req.params.tourId) filter.tour = req.params.tourId;

  const features = new APIFeatures(
    Review.find(filter).populate({
      path: 'tour',
      select: 'name',
    }),
    req.query
  )
    .filter()
    .sort()
    .selectFields()
    .paginate();
  const reviews = await features.query;

  if (!reviews.length) return next(new AppError('No review found!', 404));
  const filteredGuidesReviews = reviews.map((review) => {
    review.tour.guides = undefined;
    return review;
  });

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews: filteredGuidesReviews,
    },
  });
});

catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;

  const newReview = await Review.create({
    review: req.body.review,
    rating: req.body.rating,
    user: req.user._id,
    tour: req.body.tour,
  });

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});
*/
