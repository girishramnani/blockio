var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({"api/v1/wallet":"Api for the wallet"})
});

module.exports = router;
