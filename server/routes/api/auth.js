const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const { check, validationResult, param } = require('express-validator');
const User = require('../../models/User');
const authController = require('../../controller/auth.controller');
const multer = require('multer');
const fs = require('fs');
const config = require('config');
const mongoose = require('mongoose');
const status = require('../../constants/apiStatusCode');

/*
* Register/Create user
* Owner : Kinjal
* Route:  api/auth/createUser
*/
router.post('/createUser', [
  check('email', 'Email is required!').not().isEmpty(),
  check('email', 'Please enter a valid email address!').isEmail()
    .custom((value, { req }) => {
      return new Promise((resolve, reject) => {
      
         const user = User.findOne({ email: req.body.email, isActive: true, isDelete: false }, function (err, user) {
          
          if (err) {
            reject(new Error('Server Error'))
          } else if (Boolean(user)) {
            reject(new Error('User is already exists!'))
          }
          else {
            resolve(true)
          }         
        });
      })
    }),
  // check('password', 'Password is required!').not().isEmpty(),
  check('phoneNumber', 'phoneNumber is required').not().isEmpty(),
  check('fullName', 'fullName is required').not().isEmpty(),
], authController.doRegister);

/***
* Name:   Authenticate User and get Token
* Owner : Kinjal
* Route:  api/auth/login
*/
router.post('/login', [
  check('email', 'Email is required!').not().isEmpty(),
  check('email', 'Please enter a valid email address!').isEmail(),
  check('password', 'Password is required!').exists()],
  authController.doLogin);

/***
* Name:   user forgot password
* Owner : Kinjal
* Route:  api/auth/forgotPassword
*/
router.post('/forgotPassword', [
  check('email', 'Email is required!').not().isEmpty(),
  check('email', 'Please enter a valid email address!').isEmail()
],
  authController.forgotPassword);

/***
* Name:   Reset forgot password
* Owner : Kinjal
* Route:  api/auth/resetPassword
*/
router.post('/resetPassword', [
  check('verifyForgotCode', 'Code is required!').not().isEmpty(),
  check('email', 'Email is required!').not().isEmpty(),
  check('email', 'Please enter a valid email address!').isEmail(),
  check('newPassword', 'New Password is required!').not().isEmpty(),
], authController.resetPassword);

/***
* Name:   To get users
* Owner : Kinjal
* Route:  api/auth/list
*/
router.get('/list', authMiddleware, authController.getUsers);

/* 
* Name:   To update user info
* Owner : Kinjal
* Route:  api/auth/update
*/
router.put('/update/:id', authMiddleware, [ 
  param('id').custom((value, { req }) => {
    return new Promise((resolve, reject) => {
      let id = req.params.id
     
      User.findOne({ _id: mongoose.Types.ObjectId(id) }, function (err, user) {
        if (err) {
          reject(new Error('Internal Server Error'))
        }
        if (Boolean(user)) {
          resolve(true)
        } else {
          reject(new Error('User not found!'))
        }
      });
    });
  })
] , authController.updateProfile);

/**
* Name:   To delete user info
* Owner : Kinjal
* Route:  api/auth/removeUser
*/
router.delete('/removeUser/:id', authMiddleware, 
[
  param('id').custom((value, { req }) => {
    return new Promise((resolve, reject) => {
      let id = req.params.id
     
      User.findOne({ _id: mongoose.Types.ObjectId(id) }, function (err, user) {
        if (err) {
          reject(new Error('Internal Server Error'))
        }
        if (Boolean(user)) {
          resolve(true)
        } else {
          reject(new Error('User not found!'))
        }
      });
    });
  })
],authController.deleteUser)

/**
* Name:   To logout user
* Owner : Kinjal
* Route:  api/auth/logout
*/
router.get('/logout/:id',  authController.logout);

/**
* Name:   To get User Profile
* Owner : Kinjal
* Route:  api/auth/Get User Profile
*/
router.get('/Get User Profile', authController.getProfileInformation);

/**
* Name:   To delete many/single user
* Owner : Kinjal
* Route:  api/auth/deleteMany
*/
router.post('/deleteMany', authMiddleware, authController.deleteMultipleUsers)

/**
* Name:   To list all users
* Owner : Kinjal
* Route:  api/auth/listAll
*/
router.get('/listAll', authController.listAllUsers);

/**
* Name:   To check user token expire or not
* Owner : Kinjal
* Route:  api/auth/listAll
*/
router.get('/isTokenExpire', authMiddleware, authController.tokenExpire);

module.exports = router;