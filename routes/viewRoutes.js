const express = require('express');

const router = express.Router();
const viewControllers = require('./../controllers/viewControllers');
const authControllers = require('./../controllers/authController');

router.get('/me', authControllers.protectRoute, viewControllers.getAccount);
router.post(
  '/submit-user-data',
  authControllers.protectRoute,
  viewControllers.updateUserData
);
router.use(authControllers.userLoggedIn);

router.get('/', viewControllers.getOverview);
router.get('/tour/:slug', viewControllers.getTour);
router.get('/login', viewControllers.getLoginForm);
router.get(
  '/my-tours',
  authControllers.protectRoute,
  viewControllers.getMyTours
);
module.exports = router;
