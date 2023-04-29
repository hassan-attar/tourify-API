const multer = require('multer');
const sharp = require('sharp');

const AppError = require('./../utils/appError');
const Tour = require('./../models/tourModel');
const APIfeatures = require('./../utils/APIFeatures');
const catchAsync = require('./../utils/catchAsync');
const factoryFunc = require('./factoryFuncHandler');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('Files must be of type image! Please submit images.', 400),
      false
    );
  }
};

const upload = multer({ strorage: multerStorage, fileFilter: multerFilter });
exports.updateTourPhotos = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1,
  },
  {
    name: 'images',
    maxCount: 3,
  },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover && !req.files.images) return next();

  if (req.files.imageCover) {
    req.body.imageCover = `tour-${req.params.id}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }

  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const fileName = `tour-${req.params.id}-${i + 1}.jpeg`;
        await sharp(file.buffer)
          .resize(2000, 1333)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${fileName}`);

        req.body.images.push(fileName);
      })
    );
  }
  next();
});

exports.getTour = factoryFunc.getOne(Tour, {
  docName: 'tour',
  populate: {
    path: 'guides',
    select: `-__v -passwordChangedAt`,
  },
  populateReviews: true,
});
exports.getAllTours = factoryFunc.getAll(Tour, { docName: 'tour' });
exports.createTour = factoryFunc.createOne(Tour, { docName: 'tour' });
exports.deleteTour = factoryFunc.deleteOne(Tour, 'tour');
exports.updateTour = factoryFunc.updateOne(Tour, { docName: 'tour' });

exports.aliasTop5Tours = (req, res, next) => {
  req.query.sort = '-ratingsAverage -ratingsQuantity';
  req.query.limit = '5';
  next();
};
exports.aliasTop5Cheap = (req, res, next) => {
  req.query.sort = 'price -ratingsAverage';
  req.query.limit = '5';
  next();
};

exports.getTourStat = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { price: { $gte: 500 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        averageRating: { $avg: '$ratingsAverage' },
        totalReviews: { $sum: '$ratingsQuantity' },
        averagePrice: { $avg: '$price' },
        maxPrice: { $max: '$price' },
        minPrice: { $min: '$price' },
        numTour: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: stats.length,
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const requestedYear = req.params.year * 1 || 2021;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $addFields: {
        year: { $year: '$startDates' },
        month: { $month: '$startDates' },
      },
    },
    {
      $match: {
        year: { $eq: requestedYear },
      },
    },
    {
      $group: {
        _id: '$month',
        numTours: { $sum: 1 },
        tourList: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { month: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3958.8 : distance / 6371;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide your latitude and longitude in lat,lng format',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  if (!tours || !tours.length) {
    return next(new AppError('No tour found within the distance', 404));
  }

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getToursDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',').map((el) => el * 1);

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide your latitude and longitude in lat,lng format',
        400
      )
    );
  }

  // console.log(distance, radius, lat, lng, unit);
  const tours = await Tour.aggregate([
    {
      $geoNear: {
        distanceField: 'distance',
        distanceMultiplier: unit === 'mi' ? 0.000621371 : 0.001,
        near: { type: 'Point', coordinates: [lng, lat] },
        spherical: true,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

/*
catchAsync(async (req, res, next) => {
  const features = new APIfeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .selectFields()
    .paginate();

  // SEND RESPONSE
  const tours = await features.query;

  if (!tours.length)
    return next(
      new AppError('No tour was found based on search criteria!', 404)
    );

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
});

catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id)
    .populate({
      path: 'guides',
      select: `-__v -passwordChangedAt`,
    })
    .populate('reviews');
  // const tour = await Tour.findOne({ _id: req.params.id });

  if (!tour) return next(new AppError('No tour was found!', 404));

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

POST Function

catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  if (!newTour) return next(new AppError('No tour was found!', 404));

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
});

catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!tour) return next(new AppError('No tour was found!', 404));

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});
*/
