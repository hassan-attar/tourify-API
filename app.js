const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const xss = require('xss-clean');
const mongoSanatize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
////////////////////////////////////////////////////////////////////////////////
// Global Middleware, apply to all requests
// Set security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: {
      allowOrigins: ['*'],
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['*'],
        scriptSrc: ["* data: 'unsafe-eval' 'unsafe-inline' blob:"],
      },
    },
  })
);
// Set rate limit on the same IP requests
app.use(
  '/api',
  rateLimit({
    max: 100,
    windowMs: 30 * 60 * 1000,
    handler: (req, res, next, options) => {
      return next(
        new AppError('Too many request! Please try again in half an hour.', 429)
      );
    },
  })
);
// Put body data on req.body, limit data rate to 10kb per requests
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Data Sanitization against NoSQL query injection
app.use(mongoSanatize());

// Data Sanitization against XSS (Croos Site Scripting Attack)
app.use(xss());

// Compressing the text in responses
app.use(compression());
// logger for development environment
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// set a reqest time on the req object
app.use((req, res, next) => {
  req.requestTime = new Date().toUTCString();
  next();
});

// Seperate Requests based on their path to the Routes
app.use('/', viewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/tours', tourRouter);

////////////////////////////////////////////////////////////////////////////////
// UNDEFINED URL ON THE SERVER REACH HERE
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find path ${req.originalUrl} on the server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
