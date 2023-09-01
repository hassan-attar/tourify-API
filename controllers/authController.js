const crypto = require('crypto');
const { promisify } = require('util');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const { stat } = require('fs');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const signAndSendToken = (res, user, statusCode, sendUserToClient = false) => {
  const token = signToken(user._id);
  // never send password to user
  user.password = undefined;
  const data = sendUserToClient ? { user } : undefined;
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 1000
    ),
    httpOnly: true,
  };
  // if in production, only send use cookie on HTTPS
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data,
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);
  await new Email(
    user,
    `${req.protocol}://${req.get('host')}/me`
  ).sendWelcome();
  // const user = await User.create({
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.passwordConfirm,
  // });
  signAndSendToken(res, user, 201, true);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if user send both email and password
  if (!email || !password)
    return next(new AppError('Please provide your email and password!', 400));

  // Check if user exist
  const user = await User.findOne({ email }).select('+password +role');
  // console.log(user);
  // if user dosen't exist or password is incorrect
  if (!user || !(await user.isPasswordCorrectAndSame(password, user.password)))
    return next(new AppError('email or password is incorrect', 401));

  // sign web token and send it to the user
  signAndSendToken(res, user, 200, true);
});

exports.logout = (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protectRoute = catchAsync(async (req, res, next) => {
  //1) get the token and test if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError(
        'Access Denied due to invalid token! Plaese log in again.',
        401
      )
    );

  // 2) Verification of the token
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );
  // 3) get current User
  const currentUser = await User.findById(decodedToken.id)
    .select('+passwordChangedAt')
    .select('+role');

  if (!currentUser)
    return next(
      new AppError(
        'The user belonging to this token dose no longer exist! Please log in again.',
        401
      )
    );
  // 4) Check if the password was changed after issuing the token
  if (currentUser.hasPasswordChangedAfter(decodedToken.iat))
    return next(
      new AppError('Password has recently changed! Please log in again.', 401)
    );

  req.user = currentUser;
  res.locals.user = currentUser;
  // GRANT ACCESS TO THE USER
  next();
});

exports.userLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) get the token and test if it's there
      const decodedToken = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 2) get current User
      const currentUser = await User.findById(decodedToken.id)
        .select('+passwordChangedAt')
        .select('+role');

      // Check if current user still exist
      if (!currentUser) return next();
      // 3) Check if the password was changed after issuing the token
      if (currentUser.hasPasswordChangedAfter(decodedToken.iat)) return next();

      // LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
});

exports.restrictTo = (...authorizedRoles) => {
  return (req, res, next) => {
    if (!authorizedRoles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action!', 403)
      );

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 0) If user didn't provide email
  if (!req.body.email)
    return next(new AppError('Please provide your email address', 400));

  // 1) Search for user by the email
  const user = await User.findOne({ email: req.body.email });

  // We should not give hint to potential hacker!
  if (!user)
    return next(
      new AppError('There is no user associated to this email!', 404)
    );

  // 2) Create a random token
  const resetToken = user.createPasswordResetToken();
  user.save({ validateBeforeSave: false });
  /*
      Why I didn't do User.findByIdAndUpdate()?
      Becuase in this way, validators will not run, pre-save middlewares also will not run

  */

  // 3) Send the token to user by email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${resetToken}`;
  try {
    await new Email(user, resetUrl).sendPasswordReset();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiresIn = undefined;
    user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email, Please try again later!',
        500
      )
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to your email.',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) find user based on the token, check if it has expired

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpiresIn: { $gt: Date.now() },
  });

  // 2) compare token with the resetPasswordToken in the database

  if (!user)
    return next(
      new AppError('Token is invalid or has expired! Please try again.', 400)
    );

  // 3) If ok, update password, delete resetPasswordToken, expireIn
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresIn = undefined;
  await user.save();
  // 4) Update passwordChangedAt
  // 5) Log user in
  signAndSendToken(res, user, 200);
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  if (
    !req.body.currentPassword ||
    !req.body.password ||
    !req.body.passwordConfirm
  )
    return next(
      new AppError(
        'Please provide your current password, and a new password and passwordConfirm',
        400
      )
    );

  // 1) Get current user
  const user = await User.findById(req.user._id).select('+password');
  // 2) check if current Posted password is correct
  if (
    !(await user.isPasswordCorrectAndSame(
      req.body.currentPassword,
      user.password
    ))
  )
    return next(new AppError('Incorrect password! Please try again.', 401));

  // 2.1) Check if the new password is different than the old one
  if (await user.isPasswordCorrectAndSame(req.body.password, user.password))
    return next(
      new AppError(
        'New password is the same as the old one, Please pick another password',
        400
      )
    );
  // 3) update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) log user in with new JWT
  signAndSendToken(res, user, 200);
});
