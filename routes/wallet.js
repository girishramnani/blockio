var express = require('express');
var utils = require("../wallet_store/utils");
var _ = require("lodash");
var router = express.Router();
var network = "testnet";
var baseWalletLocation = "../wallets/"

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
        "file": baseWalletLocation + walletName,
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
                  "status": "success",
                  "secret": secret
                });
            } 
          });
        });
      });
      
    
}


router.post("/:name",
    function(req,res) {
    var walletName = req.params.walletName;
    var copayer = req.params.copayerName;
    var holders = 2;
    var minSign = 2;

    createWallet(walletName,copayer,holders,minSign,(data)=>res.json(data));
})

router.post("/:name/create_address",
    function(req,res) {

        
    }
)

module.exports = router;
