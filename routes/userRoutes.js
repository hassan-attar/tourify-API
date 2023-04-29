const express = require('express');

const router = express.Router();
const userControllers = require('../controllers/userControllers');
const authControllers = require('./../controllers/authController');
// Users Routes
// Access to All
router.route('/signup').post(authControllers.signUp);
router.route('/login').post(authControllers.login);
router.route('/logout').get(authControllers.logout);
router.route('/forgotpassword').post(authControllers.forgotPassword);
router.route('/resetpassword/:token').patch(authControllers.resetPassword);
router.route('/').post(userControllers.createUser);

// Only to Logged in users\
router.use(authControllers.protectRoute);

router.route('/me').get(userControllers.getMe, userControllers.getUserById);
router.route('/updatemypassword').patch(authControllers.updateMyPassword);
router
  .route('/updateme')
  .patch(
    userControllers.updateUserPhoto,
    userControllers.resizeUserImage,
    userControllers.updateMe
  );
router.route('/deleteme').delete(userControllers.deleteMe);

// Only Restricted to Administrator
router.use(authControllers.restrictTo('admin'));

router.route('/').get(userControllers.getAllUsers);
router
  .route('/:id?')
  .get(userControllers.getUserById)
  .patch(userControllers.updateUser)
  .delete(userControllers.deleteUser);

module.exports = router;
