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
var baseWalletLocation = "wallets/";
var feePerKB = 100e2;

/* GET home page. */
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
            } else {
              cb({
              "status": "success",
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
  },(client) =>{ 

    if(client.error){

      cb(client);

    } else {

      cb({"wallet":JSON.parse(client.export())})
    }

})
}

function createAddress(walletName, cb) {
  utils.getClient(baseWalletLocation + walletName,{ mustExist: true }, (client) => {

    client.createAddress({},(err,resp) => {
      cb(err, resp);
    })
    

  });
}


function getBalance(walletName,cb) {
  utils.getClient(baseWalletLocation + walletName,{ mustExist: true }, (client) => {
        console.log(client)
        client.getBalance({},(err,resp) => {
          console.log(resp,err);
          cb(err, resp);
        })
        
      });

}

function send(walletName,to,amount,note,cb) {
  utils.getClient(baseWalletLocation + walletName,{ mustExist: true }, (client) => {
    
  var parsedAmount = utils.parseAmount(amount);
  client.createTxProposal({
    outputs: [{
      toAddress: to,
      amount: parsedAmount,
    }],
    message: note,
    feePerKb: feePerKb,
  }, (err, txp) => { 

    if (err) cb(err,null);

    client.publishTxProposal({
      txp: txp
    },(err2) => {
      if (err2) cb(err2,null);

      cb(null,txp);

    });

   });

});

} 

function getAddresses(walletName,cb) {
  utils.getClient(baseWalletLocation + walletName,{ mustExist: true }, (client) => {    


  client.getMainAddresses({
    doNotVerify: true
  },(err,addresses) => {

    if (err) {
      cb({"error":err})
    } else {
      cb(addresses)
    }

  })

});
}

router.post("/:name/join",function(req,res){
  joinWallet(req.params.name,req.body.secret,(resp) => res.json(resp))

})


router.post("/:name",
    function(req,res) {
    var walletName = req.params.name;
    var copayer = req.body.copayerName;
    var holders = req.body.holders;
    var minSign = 1;

    createWallet(walletName,copayer,minSign,holders,(data)=>res.json(data));
})

router.get("/:name/info",function(req,res) {

  getWallet(req.params.name,(wallet) => res.json(wallet))

})

router.post("/:name/create_address",
    function(req,res) {
      createAddress(req.params.name,(err, addrData) => {
        if (err) {
          cb({"error":err})
        }
        res.json(addrData);
      })
        
    }
)

router.post("/:name/send", 
  function(req,res) {
     send(req.params.name,req.body.to,req.body.amount,req.body.note,
    (err,txd) => res.json(txd)
    )

  }
)

router.get("/:name/balance", function(req,res) {
  getBalance(req.params.name,(err,balance) => {
    if (err) res.json({"error": err});
    res.json(balance);
    
  })
});

router.get("/:name/addresses",function(req,res) {

  getAddresses(req.params.name,(resp) => res.json(resp))

})




router.get('/', function(req, res, next) {
  res.json(
      {
        "/:name":"POST - create a new wallet with name. POST BODY {'copayername':'a','holder':2} ",
        "/:name/join":"POST - join the wallet. POST BODY {'secret':'sdfdsf'}",
        "/:name/info":"GET to get the wallet.",
        "/:name/create_address":"POST - create a new address. NO POST BODY",
        "/:name/send":"POST to send money to an address",
        "/:name/balance":"GET the balance of your wallet",
        "/:name/addresses":"GET to show all the addresses"
    }
    )
});

// createWallet("testin3","",1,1,(d)=>{console.log(d)})
// getWallet("ravi1",(wallet) => console.log(wallet))

// joinWallet("t1","L9djFK6qNAjNb5jGUrxjtdKzaM7tguQKQGocBsn3zRkZHrwbjtJTBZjwUuYSoj4UswpGWezDzkTbtc",(d)=> console.log(d))

// createAddress("testin3",(err,resp) => console.log(err,resp));

// getBalance("t1",(err,resp) => console.log(err,resp));

// send("testin3","mzFegzauNsyYYQDekRVkxE4SgquzYuir4u","500bit","Hello world",(err,data)=> console.log(data));

module.exports = router;
