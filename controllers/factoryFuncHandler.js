const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIfeatures = require('./../utils/APIFeatures');

/*
Options Object Paramaters:
1) docName: name of a single document in the context of the model
2) populate options object

*/

exports.getAll = (model, options) =>
  catchAsync(async (req, res, next) => {
    // options variable
    const singleDocName = options.docName || 'document';
    const populateObj = options.populateObj;

    // Hack for making Nested Routes Work.
    const filter = {};
    if (req.params.tourId) filter.tour = req.params.tourId;

    const features = new APIfeatures(model.find(filter), req.query)
      .filter()
      .sort()
      .selectFields()
      .paginate();

    if (populateObj) features.query = features.query.populate(populateObj);
    // SEND RESPONSE
    const documents = await features.query;

    // if (!documents.length)
    //   return next(
    //     new AppError(
    //       `No ${singleDocName} was found based on search criteria!`,
    //       404
    //     )
    //   );

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: {
        [singleDocName + 's']: documents,
      },
    });
  });

exports.getOne = (model, options) =>
  catchAsync(async (req, res, next) => {
    // options variable
    const singleDocName = options.docName || 'document';
    const populateObj = options.populateObj;
    const populateReviews = options.populateReviews || false;

    let query = model.findById(req.params.id);

    if (populateReviews) query = query.populate('reviews');
    if (populateObj) query = query.populate(populateObj);
    const documents = await query;

    if (!documents)
      return next(new AppError(`No ${singleDocName} was found!`, 404));

    res.status(200).json({
      status: 'success',
      data: {
        [singleDocName]: documents,
      },
    });
  });

exports.deleteOne = (model, options) =>
  catchAsync(async (req, res, next) => {
    //DEFAULT PARAMs
    const singleDocName = options.docName || 'document';

    const docId = req.params.id;

    if (!docId)
      return next(new AppError(`Please provide the ${singleDocName} ID`, 400));

    const doc = await model.findByIdAndDelete(docId);

    if (!doc) return next(new AppError(`No ${singleDocName} was found!`, 404));

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.createOne = (model, options) =>
  catchAsync(async (req, res, next) => {
    // Options Variables
    const singleDocName = options.docName || 'document';

    // Hack for making Nested Routes Work
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user._id;
    const newDoc = await model.create(req.body);

    // I don't think this makes sense
    if (!newDoc)
      return next(new AppError(`No ${singleDocName} was found!`, 404));

    res.status(201).json({
      status: 'success',
      data: {
        [singleDocName]: newDoc,
      },
    });
  });

exports.updateOne = (model, options) =>
  catchAsync(async (req, res, next) => {
    // Options Variables
    const singleDocName = options.docName || 'document';

    const document = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document)
      return next(new AppError(`No ${singleDocName} was found!`, 404));

    res.status(200).json({
      status: 'success',
      data: {
        [singleDocName]: document,
      },
    });
  });
