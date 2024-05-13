const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const User = require('../../models/User');
const authController = require('../../controller/auth.controller');

/*
* Use: To register/create new user
* Route:  api/auth/createUser
*/
router.post('/createUser', [
  check('email', 'Email is required!').not().isEmpty(),
  check('fullName', 'fullName is required').not().isEmpty(),
  check('phoneNumber', 'phoneNumber is required').not().isEmpty(),
], authController.doRegister);

module.exports = router;