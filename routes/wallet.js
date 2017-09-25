var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json(
      {
        "/:name":"POST - create a new wallet with name",
        "/:name/create_address":"POST - create a new address",
        "/:name/send":"POST to send money to an address",
        "/status":"GET the status of the service"
    }
    )
});

module.exports = router;
