//Express js for Node JS
const path = require('path');
const express = require('express');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const config = require('config');
const indexRouter = require('./routes');
var cookieParser = require('cookie-parser');
const errorHandler = require('errorhandler');
require('dotenv').config();
const app = express();
// const PORT = process.env.PORT || 3001;

//  "mongodb://superuser:password@127.0.0.1:27017/admin",
const server = require('http').Server(app);

const isProduction = process.env.NODE_ENV === 'production';

//Connect Database
connectDB();

//Create upload directory for uploading files
const fileDIR = config.get("uploadDir") + "/";
!fs.existsSync(fileDIR) ? fs.mkdir(fileDIR, err => {
  console.log("Error while creating upload DIR")
}) : null

// const corsOptions = {
//   origin: 'https://www.euroboxpv.it/', // Replace with the URL of your React application
// };

// app.use(cors(corsOptions));
app.use(cors());
app.use(cookieParser());
app.use(require('morgan')('dev'));
// app.use(upload.array());
//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Function to serve all static files
// inside public directory.
app.use(express.static('public')); 
app.use('/uploads', express.static('uploads'));

if (!isProduction) {
  //######## This middleware is only intended to be used in a development environment, as the full error stack traces 
  //and internal details of any object passed to this module will be sent back to the client when an error occurs.
  app.use(errorHandler());
}

app.use('/', indexRouter);

const PORT = isProduction ? process.env.PRODUCTION_PORT : process.env.STAGING_PORT
console.log(PORT)
// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../web/build')));
// app.use(express.static(path.join(__dirname, 'build')));

app.use(express.json({limit: "50mb", extended: true}))
app.use(express.urlencoded({limit: "50mb", extended: true, parameterLimit: 50000}))
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});