const SUCCESS = 200; //Response successful GET, PUT, PATCH or DELETE
const CREATED = 201; //Response to a POST that result in creation
const DELETED = 204; //Response to DELETE content
const BAD_REQUEST = 400; //The request is malformed, such as body not parse
const UNAUTHORIZED = 401; //Token not valid
const NOTFOUND = 404; //Non existent resource is requested
const SERVER_ERROR = 500

module.exports = {
  SUCCESS,
  CREATED,
  DELETED,
  BAD_REQUEST,
  UNAUTHORIZED,
  SERVER_ERROR,
  NOTFOUND
}