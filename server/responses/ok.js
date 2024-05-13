const statusCode = require('../constants/apiStatusCode')

module.exports = function (res, data, message, errors = []) {

  var response = {};

  response.status = statusCode.SUCCESS;
  response.success = true;
  response.data = data;
  response.errors = errors
  response.message = message

  res.status(response.status);
  return res.json(response);

};