const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
const sendOkResponse = require('../responses/ok');
const sendBadRequestResponse = require('../responses/badRequest');
const sendCreatedRequestResponse = require('../responses/created');
const sendServerErrorResponse = require('../responses/serverError');
const sendNotFoundResponse = require('../responses/notFound');
const sendDeleteResponse = require('../responses/deleted');
const mongoose = require('mongoose');
const fs = require('fs');

/***
 * Register/Add user
*/
exports.doRegister = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'Registration Error!', errors.array())
    }

    const { fullName, email, phoneNumber, createdBy } = req.body

    let user = new User({
      fullName : fullName ? fullName : "",
      phoneNumber : phoneNumber ? phoneNumber :"",
      email: email ? email : "",
      createdBy: mongoose.Types.ObjectId(createdBy) ? mongoose.Types.ObjectId(createdBy) : null,
    })

    await user.save().then(() => {

      const payload = {
        user: {
          id: user.id,
          email: user.email
        }
      }

      jwt.sign(payload, config.get('jwtSecret'), { expiresIn: '3h' }, async (err, token) => {

        //Todo Check this
        await User.findByIdAndUpdate({_id: user.id},{ $set: {userToken: token}});
        if (err) throw err;
        else  {
          return sendCreatedRequestResponse(res,  { token: token, user: user }, 'User registered successfully', [])
        }
      });

    }).catch((error) => {
      console.log(error)
      return sendBadRequestResponse(res, {}, 'Error while creating user!', errors.array())
    });

  } catch (err) {
    console.log(err)
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])
  }
}

/***
* Name:   Authenticate User and get Token
* Owner : Kinjal
* Route:  api/auth
*/
exports.doLogin = async (req, res) => {
  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'Login Error!', errors.array())
    }

    const { email, password } = req.body

    let user = await User.findOne({ email: email, isActive: true, isDelete: false });
    if (!user) {
      return sendBadRequestResponse(res, {}, 'User dose not exist with this email!', errors.array())
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendBadRequestResponse(res, {}, 'Password not match!', errors.array())
    }

    const payload = {
      user: {
        id: user.id,
        email: user.email
      }
    }

    jwt.sign(payload, config.get('jwtSecret'), { expiresIn: '3h' }, async (err, token) => {

      if (err) throw err;

      if (token != null) {
        return sendOkResponse(res, { token: token, user: user }, 'User authenticated and logged-in successfully', [])
      }
    });

  } catch (err) {
    console.log(err)
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])
  }
}

/***
* Name:   user forgot password
* Owner : Kinjal
* Route:  api/auth/forgotPassword
*/
exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  try {

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'Forgot Password Error!', errors.array())
    }

    const { email } = req.body

    let user = await User.findOne({ email: email, isActive: true, isDelete: false });
    // console.log('user=> ',user)
    if (!user) {
      return sendBadRequestResponse(res, {}, 'Email dose not exist! Please enter valid email!', errors.array())
    }
    else {
      // Get the user and send email
      let verifyForgotCode = Math.floor(100000 + Math.random() * 900000);
      let html = '<p style=\"text-align: center;\"><img style=\"width: 40%; object-fit: contain;\" src=\"http://foundersapproach.org/API/ecomplicato/logo.png\" /></p>\r\n<p>This email has been sent to you because you entered your email on a verification page. If it wasn&rsquo;t you, please ignore this message.</p>\r\n<p><span style=\"font-weight: 400;\">Please input the below code into the app to reset your password</span>.</p>\r\n<p><strong>Your verification Code :</strong></p>\r\n<h3>{code}</h3>\r\n<p style=\"text-align: left;\">Best,<br />Eurobox Impianti Team</p>'.toString();

      // html += html.replace("{app_icon_url}","");
      html = html.replace('{code}', verifyForgotCode);
      // console.log(html)

      const isMailSent = await sendEmail(email, 'Reset your Password', html);

      if (isMailSent) {
        const isUpdate = await User.findByIdAndUpdate({ _id: user._id },
          {
            $set: { verifyForgotCode: verifyForgotCode }
          }, { new: true }
        );
        if(isUpdate) {
          return sendOkResponse(res, {email:email}, 'There is an Email sent to you for resetting password', errors.array())
        }


      } else {
        return sendServerErrorResponse(res, {}, 'Error sending email!', errors.array())
      }

    }
  } catch (err) {
    console.log(err)
    return sendServerErrorResponse(res, {}, 'Internal server error!', errors.array())
  }
}

/***
* Name:   Reset forgot password
* Owner : Kinjal
* Route:  api/auth/resetPassword
*/
exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  try {

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'Reset Password Error!', errors.array())
    }

    const { email, verifyForgotCode, newPassword } = req.body

    let user = await User.findOne({ email: email, verifyForgotCode: verifyForgotCode, isActive: true, isDelete: false });
    if (!user) {
      return sendBadRequestResponse(res, {}, 'Verification code not found', errors.array())
    }
    else {

      //Encrypt password
      const salt = await bcrypt.genSaltSync(10);
      user.password = await bcrypt.hash(newPassword, salt);

      const isUpdate = await User.findByIdAndUpdate({ _id: user.id, isActive: true, isDelete: false },
        {
          $set: { password: user.password, verifyForgotCode: '' }
        }, { new: true });
        if (isUpdate) {
          return sendOkResponse(res, {}, 'Password reset successfully', errors.array())
        }
        else {
          return sendServerErrorResponse(res, {}, 'Error restting password!', [])
        }
    }

  } catch (err) {
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])
  }
}

function sendEmail(toEmail, subject, html) {

  return new Promise(async (resolve, reject) => {
    var mail = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.get('appEmail'),
        pass: config.get('appPassword')
      }
    });
    var mailOptions = {
      from: config.get('appEmail'),
      to: toEmail,
      subject: subject,
      html: html,//'<h1>Welcome</h1><p>Verification Code :1111</p>' ,
    };

    mail.sendMail(mailOptions, function (error, info) {
      if (error) {
        // console.log('mail err ',error)
        reject(error)
      } else {
        console.log('Email sent: ' + info.response);
        resolve(true)
      }
    });
  });
}

exports.getUsers = async( req, res ) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'List User Error!', errors.array())
    }

    const page = req.query.page ? req.query.page : 1 ;
    const limit = req.query.limit ? req.query.limit : 10;
    const search_text = req.query.search_text;

    let compareObj = {}
    compareObj.isActive = true
    compareObj.isDelete = false

    if (search_text) {
      // compareObj.name = new RegExp('^' + search_text,'i')
      compareObj = {$text: {$search: "\""+search_text+"\""}}
    }

    // console.log(compareObj)

    const user = await User.find(compareObj)
    .sort({createdAt: -1})
    .limit(limit * 1)
    .skip((page-1) * limit);

    if (user.length > 0) {
      const count = await User.find(compareObj).countDocuments();

      let data = {
        users: user,
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        currentPage: page

      }
      return sendOkResponse(res, data, 'Users listed successfully', [])

    }
    else {
      return sendNotFoundResponse(res, {}, 'User not found', [])
    }

  }
  catch(err) {
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])

  }
}

exports.updateProfile = async (req, res) => {
  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'Update Profile Error!', errors.array())
    }

    const { fullName, phoneNumber, email } = req.body

    var updateObject = {}

    if (fullName) {
      updateObject.fullName = fullName
    }

    if (phoneNumber) {
      updateObject.phoneNumber = phoneNumber
    }

    if (email) {
      updateObject.email = email
    }

    updateObject.updatedBy = req.user.id

    await User.findOneAndUpdate({ _id: req.params.id, isActive: true, isDelete: false },
      {
        $set: updateObject
      },
      { new: true },
      async function (err, result) {

        if (err) {
          return sendBadRequestResponse(res, {}, 'Error while updating user!', errors.array())
        }
        else {
          return sendOkResponse(res, { user: result }, 'User has updated successfully', [])
        }
      }).clone();

  } catch (err) {
    console.log(err)
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'Delete User Error!', errors.array())
    }

    await User.findOneAndUpdate(
      { _id: req.params.id, isActive: true, isDelete: false },
      {
        $set: {
          isDelete: true,
          isActive: false
        }
      },
      { new: true },
      async (err, userResult) => {
        if (err) return sendBadRequestResponse(res, {}, 'There is an error while delete user', [])
        else {

          return sendDeleteResponse(res, {}, 'User deleted successfully', [])
        }
      }
    ).clone().catch(function(err){ console.log(err)});
  } catch (err) {
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])
  }
}

exports.logout = async (req, res) => {
  try {
    const data = await User.findByIdAndUpdate(req.params.id, {
      userToken: undefined,
      isLoggedOut: true
    });
    return sendOkResponse(res, data, 'Users has ben successfully logout', [])
  } catch (e) {
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])
  }
};

exports.getProfileInformation = async( req, res ) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'List User Error!', errors.array())
    }

    const user = await User.findById({_id:req.params.user_id, isActive: true, isDelete: false});

    if (user) {
        return sendOkResponse(res, {user:user}, 'Profile Information listed successfully', [])
    }
   else {
    return sendOkResponse(res, {user:userResponse}, 'Profile not found', [])
   }

  }
  catch(err) {
    console.log(err)
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])
  }
}

/*
  Delete Multiple User
*/
exports.deleteMultipleUsers = async (req, res) => {
  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'Delete Multiple User Error!', errors.array())
    }

    const { userIds } = req.body;

    if (userIds.length < 0) {
      return sendBadRequestResponse(res, {}, 'No user avaialable to delete', [])
    }
    else {

      userIds.forEach(async (id)=> {

        let pid = await User.findById(id).select('_id');

        if (pid != null) {
          await User.findOneAndUpdate(
            { _id: id, isActive: true, isDelete: false },
            {
              $set: {
                isDelete: true,
                isActive: false
              }
            },
            { new: true },
           (err, result) => {
              if (err) return sendBadRequestResponse(res, {}, 'There is an error while delete user', [])
            }
          ).clone().catch(function(err){
            console.log(err)
          });
        }
      })
      return sendDeleteResponse(res, {}, 'User deleted successfully', [])
    }

  } catch (err) {
    console.log(err)
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])
  }
}

// Get all users
exports.listAllUsers = async( req, res ) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'List User Error!', errors.array())
    }

    let compareObj = {}
    compareObj.isActive = true
    compareObj.isDelete = false

    const user = await User.find(compareObj).select('fullName');

    if (user.length > 0) {
      return sendOkResponse(res, user, 'Users listed successfully', [])
    }
    else {
      return sendNotFoundResponse(res, {}, 'User not found', [])
    }

  }
  catch(err) {
    console.log(err)
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])

  }
}

exports.tokenExpire = async (req, res) => {
  try {
    return sendOkResponse(res, { isForceLogout: false }, 'Your token is not expired', [])
  } catch (e) {
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])
  }
};

exports.searchUsers = async( req, res ) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return sendBadRequestResponse(res, {}, 'List User Error!', errors.array())
    }

    const page = req.query.page ? req.query.page : 1 ;
    const limit = req.query.limit ? req.query.limit : 10;

    const search_text = req.query.search_text;

    const searchRegExp = new RegExp(search_text, 'i');

    const user = await User.find({
      isActive: true, 
      isDelete: false, 
      $or: [
        { fullName: searchRegExp },
        { phoneNumber: searchRegExp },
        { email: searchRegExp }
      ]
    })
    .sort({createdAt: -1})
    .limit(limit * 1)
    .skip((page-1) * limit);

    if (user.length > 0) {
      const count = await User.find({
        isActive: true, 
        isDelete: false, 
        $or: [
          { fullName: searchRegExp },
          { phoneNumber: searchRegExp },
          { email: searchRegExp }
        ]
      }).countDocuments();

      let data = {
        users: user,
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        currentPage: page

      }
      return sendOkResponse(res, data, 'Users listed successfully', [])

    }
    else {
      return sendNotFoundResponse(res, {}, 'User not found', [])
    }

  }
  catch(err) {
    return sendServerErrorResponse(res, {}, 'Internal server error!', [])

  }
}