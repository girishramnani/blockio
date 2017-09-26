var express = require('express');
var utils = require("../wallet_store/utils");
var Client = require('bitcore-wallet-client');
var _ = require('lodash');
var url = require('url');
var read = require('read')
var log = require('npmlog');
var Client = require('bitcore-wallet-client');
var router = express.Router();
var network = "testnet";
var baseWalletLocation = "../wallets/";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json(
      {
        "/:name":"POST - create a new wallet with name",
        "/:name/join":"POST - join the wallet",
        "/:name/info":"GET to get the wallet",
        "/:name/create_address":"POST - create a new address",
        "/:name/send":"POST to send money to an address",
        "/:name/balance":"GET the balance of your wallet"
    }
    )
});

function createWallet(walletName,copayerName,holders,min,cb) {

    utils.getClient(baseWalletLocation + walletName,{
      doNotComplete: true
    }, (client) => {

        client.createWallet(walletName, copayerName, holders, min, {
          network: network
        }, function(err, secret) {
          if (err != undefined) {
            cb({"error":err})          
          }
          console.log(' * ' + _.capitalize(network) + ' Wallet Created.');
          utils.saveClient(baseWalletLocation + walletName, client, {
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


function joinWallet(copayerName,secret,cb) {

    utils.getClient(baseWalletLocation + copayerName,{ doNotComplete: true }, (client) => {

      
    client.joinWallet(secret, copayerName, {}, function(err, wallet) {
      if (err) cb({"error":err});
      console.log(' * Wallet Joined.', wallet.name);
      utils.saveClient(baseWalletLocation+copayerName,client,function(){});
      cb({"wallet": wallet});
    });
  
  });

}
function getWallet(walletName,cb) {
  utils.getClient(baseWalletLocation + walletName,{
    mustExist: true
  },(client) => cb({"wallet":JSON.parse(client.export())}))
}


router.post("/:name",
    function(req,res) {
    var walletName = req.params.walletName;
    var copayer = req.params.copayerName;
    var holders = req.params.holders;
    var minSign = 1;

    createWallet(walletName,copayer,minSign,holders,(data)=>res.json(data));
})

router.get("/:name/info",function(req,res) {

  getWallet(req.params.name,(wallet) => res.json(wallet))

})

router.post("/:name/create_address",
    function(req,res) {

        
    }
)

// createWallet("GirishRamnani12","ravi123",1,4,(d)=>{console.log(d)})

// joinWallet("ravi123456","WrbumuSVWKs1Cusmeg9npVKwcseR1GHHXyQ3MohXkuf8GiVRHsHfPU3rLzsS4Tm5qvQCGUVKyWTbtc",(d)=> console.log(d))

getWallet("ravi1234",(d) => console.log(d));


module.exports = router;
