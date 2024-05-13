const statusCode = require('../constants/apiStatusCode')

module.exports = function (res, data, message, errors = []) {

  var response = {};

  response.status = statusCode.BAD_REQUEST;
  response.success = false;
  response.data = data;
  response.message = (message) ? message : "Bad request"
  response.errors = errors

  res.status(response.status);
  return res.json(response);

};