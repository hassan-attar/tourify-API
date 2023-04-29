const AppError = require('./../utils/appError');

const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicateErrorDB = (err) => {
  const duplicateFields = Object.keys(err.keyValue);

  const message = `Duplicate value for: ${duplicateFields.join(
    ' ,'
  )}. Please try another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  return new AppError(`Invalid input data: ${errors.join('. ')}`, 400);
};

const handleJsonWebTokenError = () =>
  new AppError('Invalid token! Please log in again!', 401);

const handleJwtExpiredTokenError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Production error handler
const sendErrorProd = (err, req, res) => {
  // if error is operational, send details to user
  if (err.isOperational) {
    if (req.originalUrl.startsWith('/api')) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message,
      });
    }
    // if error is Programming or coming from unknown sources, don't leak information
  } else {
    if (req.originalUrl.startsWith('/api')) {
      console.error(
        `##########AT ${new Date(Date.now())} ############# --- E R R O R`,
        err
      );

      res.status(500).json({
        status: 'fail',
        message: 'Something went wrong!',
      });
    } else {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.',
      });
    }
  }
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err,
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // IF we are in development, send a different error!
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  }
  if (process.env.NODE_ENV === 'production') {
    let error = Object.assign({}, err, { message: err.message });

    if (err.name === 'CastError') error = handleCastErrorDB(err);
    if (err.code === 11000) error = handleDuplicateErrorDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (err.name === 'TokenExpiredError') error = handleJwtExpiredTokenError();

    sendErrorProd(error, req, res);
  }
};
