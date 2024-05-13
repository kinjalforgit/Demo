var express = require('express');
var router = express.Router();

const authRoutes = require("./auth");

router.use('/api/auth', authRoutes)

module.exports = router;