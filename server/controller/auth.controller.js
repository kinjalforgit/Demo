const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const { validationResult } = require('express-validator');
const sendBadRequestResponse = require('../responses/badRequest');
const sendCreatedRequestResponse = require('../responses/created');
const sendServerErrorResponse = require('../responses/serverError');
const sendNotFoundResponse = require('../responses/notFound');

/***
 * Register/Create user
*/
exports.doRegister = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'Registration Error!', errors.array())
    }

    const { fullName, email, phoneNumber } = req.body

    const isEmailExist = await User.findOne({ email: email, isActive: true, isDelete: false }).select('_id');
    if (isEmailExist) {
      return sendNotFoundResponse(res, {}, "User is already exist with this email", errors.array())
    }

    const isMobileExist = await User.findOne({ phoneNumber: phoneNumber, isActive: true, isDelete: false }).select('_id');
    if (isMobileExist) {
      return sendNotFoundResponse(res, {}, "User is already exist with this mobile number", errors.array())
    }
      
    let user = new User({
      fullName : fullName ? fullName : "",
      phoneNumber : phoneNumber ? phoneNumber :"",
      email: email ? email : "",
    });
    
    // Save user
    await user.save().then(() => {

      const payload = {
        user: {
          id: user.id,
          email: user.email
        }
      }

      // Generate token
      jwt.sign(payload, config.get('jwtSecret'), { expiresIn: '3h' }, async (err, token) => {

        await User.findByIdAndUpdate({_id: user.id},{ $set: {userToken: token}});
        if (err) throw err;
        else  {
          return sendCreatedRequestResponse(res,  { token: token, user: user }, 'User registered successfully', [])
        }
      });

    }).catch((error) => {
      return sendBadRequestResponse(res, {}, 'Error while creating user!', errors.array())
    });

  } catch (err) {
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])
  }
}