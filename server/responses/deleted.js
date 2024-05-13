const statusCode = require('../constants/apiStatusCode')

module.exports = function (res, data, message, errors = []) {

  var response = {};

  response.status = statusCode.DELETED;
  response.success = true;
  response.data = data;
  response.message = (message) ? message : "Deleted successfully"
  response.errors = errors

  //res.status(response.status);

  return res.json(response);

};