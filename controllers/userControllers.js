const multer = require('multer');
const sharp = require('sharp');

const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const APIfeatures = require('./../utils/APIFeatures');
const catchAsync = require('./../utils/catchAsync');
const factoryFunc = require('./factoryFuncHandler');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}.${ext}`);
//   },
// });
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload images only.', 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });
exports.updateUserPhoto = upload.single('photo');

exports.resizeUserImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

// Helper Functions
const filterObj = (obj, ...alowedFields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((field) => {
    if (alowedFields.includes(field)) {
      filteredObj[field] = obj[field];
    }
  });
  return filteredObj;
};

// Controllers
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.getUserById = factoryFunc.getOne(User, { docName: 'user' });
exports.getAllUsers = factoryFunc.getAll(User, { docName: 'user' });
exports.updateUser = factoryFunc.updateOne(User, { docName: 'user' });
exports.deleteUser = factoryFunc.deleteOne(User, { docName: 'user' });

// User Function
exports.updateMe = catchAsync(async (req, res, next) => {
  // const restrictedFields = ['password', 'passwordConfirm'];
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'You can not update your password here. Please go to the /updateMyPassword route.',
        400
      )
    );
  }
  // get User info,  filter input
  const filteredFields = filterObj(req.body, 'email', 'name');
  if (req.file) filteredFields.photo = req.file.filename;

  // update user info
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredFields,
    { new: true, runValidators: true }
  );

  // res.locals.user = updatedUser;
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message:
      'The route is not Implemented, Please use api/v1/users/signup instead!',
  });
};
