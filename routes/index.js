var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/me', function (req, res, next) {
  console.log(req.user);
  res.send(req.user);
});

module.exports = router;
