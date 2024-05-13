const jwt = require('jsonwebtoken');
const config = require('config');
const sendUnAuthorizedResponse = require('../responses/unauthorizedError');

module.exports = function (req, res, next) {
  //Get token from header
  const token = req.header('Authorization');

  // Check if not token
  if (!token) {
    // Authentication credentials were missing or incorrect!
    return sendUnAuthorizedResponse(res, { isForceLogout: true }, 'Your session token has been expired! Please try to login again!', [])
  }

  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded.user;
    next();
  } catch (err) {
    return sendUnAuthorizedResponse(res, { isForceLogout: true }, 'Your session token has been expired! Please try to login again!', [])
  }

};