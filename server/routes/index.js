var express = require('express');
const router = express.Router();
const apiRoutes = require('./api');

/* GET home page. */
router.get('/', function (req, res) {
  res.render('index', { title: 'Node started' });
});

router.use('/', apiRoutes);

module.exports = router;