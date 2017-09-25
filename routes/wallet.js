var express = require('express');
var utils = require("../wallet_store/utils");
var _ = require("underscore");
var router = express.Router();
var network = "testnet";
/* GET home page. */
router.get('/', function(req, res, next) {
  res.json(
      {
        "/:name":"POST - create a new wallet with name",
        "/:name/create_address":"POST - create a new address",
        "/:name/send":"POST to send money to an address",
        "/:name/balance":"GET the balance of your wallet"
    }
    )
});

function genOpts(walletName){
    return {
        "file":walletName,
    }
} 
function createWallet(walletName,copayerName,holders,min,cb) {

    utils.getClient(genOpts(walletName), {
        doNotComplete: true
      }, function(client) {
        client.createWallet(walletName, copayerName, holders, min, {
          network: network
        }, function(err, secret) {
          cb({"error":err})
          console.log(' * ' + _.capitalize(network) + ' Wallet Created.');
          utils.saveClient(genOpts(walletName), client, {
            doNotOverwrite: true
          }, function() {
            if (secret) {
              cb({
                  "status":"success",
                  "secret":secret
                });
            } 
          });
        });
      });
      
    
}


router.post("/:name",function(req,res) {

})

createWallet("girish","ravi",2,2,(d)=> console.log(d));


module.exports = router;
