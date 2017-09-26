var _ = require('lodash');
var url = require('url');
var read = require('read')
var log = require('npmlog');
var Client = require('bitcore-wallet-client');
var FileStorage = require('./filestorage');
var host = "http://35.202.171.134:3232";

var Utils = function() {};



Utils.shortID = function(id) {
  return id.substr(id.length - 4);
};

Utils.confirmationId = function(copayer) {
  return parseInt(copayer.xPubKeySignature.substr(-4), 16).toString().substr(-4);
}


Utils.doLoad = function(client, doNotComplete, walletData, password, filename, cb) {
  
  try {
    client.import(walletData);
  } catch (e) {
    cb({"error":'Corrupted wallet'});
  };
  if (doNotComplete) return cb(client);


  client.on('walletCompleted', function(wallet) {
    Utils.doSave(client, filename, password, function() {
      log.info('Your wallet has just been completed. Please backup your wallet file or use the export command.');
    });
  });
  client.openWallet(function(err, isComplete) {
    if (err) throw err;
    return cb(client);
  });
};


Utils.getClient = function(filename, opts, cb) {
  opts = opts || {};


  var storage = new FileStorage({
    filename: filename,
  });

  var client = new Client({
    baseUrl: url.resolve(host, '/bws/api'),
    verbose: true
  });

  storage.load(function(err, walletData) {
    if (err) {
      if (err.code == 'ENOENT') {
        if (opts.mustExist) {
          cb({"error":"user wallet doesnt exist"});
        }
      } else {
        cb({"error":err});
      }
    }

    if (walletData && opts.mustBeNew) {
      cb({"error":'wallet already exists use other name'});
    }
    if (!walletData) return cb(client);
    var json;
    try {
      json = JSON.parse(walletData);
    } catch (e) {
      cb({"error":'Invalid wallet'});
    };

      Utils.doLoad(client, opts.doNotComplete, walletData, null, filename, cb);
  });
};

Utils.doSave = function(client, filename, password, cb) {
  var opts = {};

  var str = client.export();

  var storage = new FileStorage({
    filename: filename,
  });

  storage.save(str, function(err) {
    cb({"error":err});
  });
};


Utils.saveClient = function(filename, client, opts, cb) {
  if (_.isFunction(opts)) {
    cb = opts;
    opts = {};
  }   
  var storage = new FileStorage({
    filename: filename,
  });

  console.log(' * Saving file', filename);

  storage.exists(function(exists) {
    if (exists && opts.doNotOverwrite) {
      return cb({"error":"username already taken"});
    }

    Utils.doSave(client, filename, null, cb);
    
  });
};

Utils.findOneTxProposal = function(txps, id) {
  var matches = _.filter(txps, function(tx) {
    return _.endsWith(Utils.shortID(tx.id), id);
  });

  if (!matches.length)
    Utils.die('Could not find TX Proposal:' + id);

  if (matches.length > 1) {
    console.log('More than one TX Proposals match:' + id);
    Utils.renderTxProposals(txps);
    program.exit(1);
  }

  return matches[0];
};

Utils.UNITS = {
  'btc': 100000000,
  'bit': 100,
  'sat': 1,
};

Utils.parseAmount = function(text) {
  if (!_.isString(text))
    text = text.toString();

  var regex = '^(\\d*(\\.\\d{0,8})?)\\s*(' + _.keys(Utils.UNITS).join('|') + ')?$';
  var match = new RegExp(regex, 'i').exec(text.trim());

  if (!match || match.length === 0) throw new Error('Invalid amount');

  var amount = parseFloat(match[1]);
  if (!_.isNumber(amount) || _.isNaN(amount)) throw new Error('Invalid amount');

  var unit = (match[3] || 'sat').toLowerCase();
  var rate = Utils.UNITS[unit];
  if (!rate) throw new Error('Invalid unit')

  var amountSat = parseFloat((amount * rate).toPrecision(12));
  if (amountSat != Math.round(amountSat)) throw new Error('Invalid amount');

  return amountSat;
};


Utils.UNITS = {
  btc: {
    name: 'btc',
    toSatoshis: 100000000,
    maxDecimals: 8,
    minDecimals: 8,
  },
  bit: {
    name: 'bit',
    toSatoshis: 100,
    maxDecimals: 2,
    minDecimals: 2,
  },
};

Utils.renderAmount = function(satoshis, unit, opts) {
  function clipDecimals(number, decimals) {
    var x = number.toString().split('.');
    var d = (x[1] || '0').substring(0, decimals);
    return parseFloat(x[0] + '.' + d);
  };

  function addSeparators(nStr, thousands, decimal, minDecimals) {
    nStr = nStr.replace('.', decimal);
    var x = nStr.split(decimal);
    var x0 = x[0];
    var x1 = x[1];

    x1 = _.dropRightWhile(x1, function(n, i) {
      return n == '0' && i >= minDecimals;
    }).join('');
    var x2 = x.length > 1 ? decimal + x1 : '';

    x0 = x0.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    return x0 + x2;
  };

  opts = opts || {};

  var u = Utils.UNITS[unit || 'bit'];
  var amount = clipDecimals((satoshis / u.toSatoshis), u.maxDecimals).toFixed(u.maxDecimals);
  return addSeparators(amount, opts.thousandsSeparator || ',', opts.decimalSeparator || '.', u.minDecimals) + ' ' + u.name;
};

Utils.renderTxProposals = function(txps) {
  if (_.isEmpty(txps))
    return;

  console.log("* TX Proposals:")

  _.each(txps, function(x) {
    var missingSignatures = x.requiredSignatures - _.filter(_.values(x.actions), function(a) {
      return a.type == 'accept';
    }).length;
    console.log("\t%s [\"%s\" by %s] %s => %s", Utils.shortID(x.id), x.message, x.creatorName, Utils.renderAmount(x.amount), x.outputs[0].toAddress);

    if (!_.isEmpty(x.actions)) {
      console.log('\t\tActions: ', _.map(x.actions, function(a) {
        return a.copayerName + ' ' + (a.type == 'accept' ? '✓' : '✗') + (a.comment ? ' (' + a.comment + ')' : '');
      }).join('. '));
    }
    if (missingSignatures > 0) {
      console.log('\t\tMissing signatures: ' + missingSignatures);
    } else {
      console.log('\t\tReady to broadcast');
    }
  });

};

module.exports = Utils;
