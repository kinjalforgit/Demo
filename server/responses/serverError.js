const statusCode = require('../constants/apiStatusCode')

module.exports = function (res, data, message, errors = []) {

  var response = {};

  response.status = statusCode.SERVER_ERROR;
  response.success = false;
  response.data = data;
  response.message = (message) ? message : "Internal Server Error"
  response.errors = errors

  res.status(response.status);

  return res.json(response);

};