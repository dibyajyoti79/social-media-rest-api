const express = require('express');
const { register, login, followAndUnfollow, logout,updatePassword, updateProfile, deleteProfile, getProfile, getUserProfile, getAllUsers, forgetPassword, resetPassword } = require('../controllers/user');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

router.route('/register').post(register);

router.route('/login').post(login);

router.route('/logout').get(isAuthenticated, logout);

router.route('/follow/:id').get(isAuthenticated,followAndUnfollow);

router.route('/update/password').put(isAuthenticated, updatePassword);

router.route('/update/profile').put(isAuthenticated, updateProfile);

router.route('/delete/me').delete(isAuthenticated, deleteProfile)

router.route('/me').get(isAuthenticated, getProfile);

router.route('/user/:id').get(getUserProfile);

router.route('/users').get(isAuthenticated,getAllUsers);

router.route('/forget/password').post(forgetPassword);

router.route('/password/reset/:token').put(resetPassword);

module.exports = router; 