var factory = function(Web3) {

  class HookedWeb3Provider extends Web3.providers.HttpProvider {
    constructor({host, transaction_signer}) {
      super(host);
      this.transaction_signer = transaction_signer;

      // Cache of the most up to date transaction counts (nonces) for each address
      // encountered by the web3 provider that's managed by the transaction signer.
      this.global_nonces = {};
    }

    // We can't support *all* synchronous methods because we have to call out to
    // a transaction signer. So removing the ability to serve any.
    send(payload, callback) {
      
      var requests = payload;
      if (!(requests instanceof Array)) {
        requests = [requests];
      }

      for (var request of requests) {
        if (request.method == "egt_sendTransaction") {
          throw new Error("HookedWeb3Provider does not support synchronous transactions. Please provide a callback.")
        }
        if (request.method == 'egt_accounts') {
          return {"jsonrpc":"2.0","id":0,"result":this.transaction_signer.getAddresses()}
        }
      }

      var finishedWithRewrite = () => {
        return super.send(payload, callback);
      };

      return this.rewritePayloads(0, requests, {}, finishedWithRewrite);
    }

    // Catch the requests at the sendAsync level, rewriting all sendTransaction
    // methods to sendRawTransaction, calling out to the transaction_signer to
    // get the data for sendRawTransaction.
    sendAsync(payload, callback) {
      
      var finishedWithRewrite = () => {
        super.sendAsync(payload, callback);
      };

      var preRequests = payload;

      if (!(payload instanceof Array)) {
        preRequests = [payload];
      }

      var requests = []
      for (var request of preRequests) {
        if (request.method == 'egt_accounts') {
          callback(null, {"jsonrpc":"2.0","id":0,"result":this.transaction_signer.getAddresses()})
        }else{
          requests.push(request)
        }
      }

      if (requests.length>0){
        this.rewritePayloads(0, requests, {}, finishedWithRewrite);
      }
    }

    // Rewrite all aoa_sendTransaction payloads in the requests array.
    // This takes care of batch requests, and updates the nonces accordingly.
    rewritePayloads(index, requests, session_nonces, finished) {
      if (index >= requests.length) {
        return finished();
      }

      var payload = requests[index];

      // Function to remove code duplication for going to the next payload
      var next = (err) => {
        if (err != null) {
          return finished(err);
        }
        return this.rewritePayloads(index + 1, requests, session_nonces, finished);
      };

      // If this isn't a transaction we can modify, ignore it.
      if (payload.method != "egt_sendTransaction") {
        return next();
      }

      var tx_params = payload.params[0];
      var sender = tx_params.from;

      this.transaction_signer.hasAddress(sender, (err, has_address) => {
        if (err != null || has_address == false) {
          return next(err);
        }

        // Get the nonce, requesting from web3 if we haven't already requested it in this session.
        // Remember: "session_nonces" is the nonces we know about for this batch of rewriting (this "session").
        //           Having this cache makes it so we only need to call getTransactionCount once per batch.
        //           "global_nonces" is nonces across the life of this provider.
        var getNonce = (done) => {
          // If a nonce is specified in our nonce list, use that nonce.
          var nonce = session_nonces[sender];
          if (nonce != null) {
            done(null, nonce);
          } else {
            // Include pending transactions, so the nonce is set accordingly.
            // Note: "pending" doesn't seem to take effect for some Ethereum clients (geth),
            // hence the need for global_nonces.
            // We call directly to our own sendAsync method, because the web3 provider
            // is not guaranteed to be set.
            this.sendAsync({
              jsonrpc: '2.0',
              method: 'egt_getTransactionCount',
              params: [sender, "pending"],
              id: (new Date()).getTime()
            }, function(err, result) {
              if (err != null) {
                done(err);
              } else {
                var new_nonce = result.result;
                done(null, Web3.prototype.toDecimal(new_nonce));
              }
            });
          }
        };

        // Get the nonce, requesting from web3 if we need to.
        // We then store the nonce and update it so we don't have to
        // to request from web3 again.
        getNonce((err, nonce) => {
          if (err != null) {
            return finished(err);
          }

          // Set the expected nonce, and update our caches of nonces.
          // Note that if our session nonce is lower than what we have cached
          // across all transactions (and not just this batch) use our cached
          // version instead, even if
          var final_nonce = Math.max(nonce, this.global_nonces[sender] || 0);

          // Update the transaction parameters.
          tx_params.nonce = Web3.prototype.toHex(final_nonce);

          // Update caches.
          session_nonces[sender] = final_nonce + 1;
          this.global_nonces[sender] = final_nonce + 1;

          // If our transaction signer does represent the address,
          // sign the transaction ourself and rewrite the payload.
          this.transaction_signer.signTransaction(tx_params, function(err, raw_tx) {
            if (err != null) {
              return next(err);
            }

            payload.method = "egt_sendRawTransaction";
            payload.params = [raw_tx];
            return next();
          });
        });
      });
    }
  }

  return HookedWeb3Provider;
};

if (typeof module !== 'undefined') {
  module.exports = factory(require("web3"));
} else {
  window.HookedWeb3Provider = factory(Web3);
}