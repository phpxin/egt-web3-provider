"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _instanceof(left, right) { if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) { return right[Symbol.hasInstance](left); } else { return left instanceof right; } }

function _classCallCheck(instance, Constructor) { if (!_instanceof(instance, Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var factory = function factory(Web3) {
  var HookedWeb3Provider =
  /*#__PURE__*/
  function (_Web3$providers$HttpP) {
    _inherits(HookedWeb3Provider, _Web3$providers$HttpP);

    function HookedWeb3Provider(_ref) {
      var _this;

      var host = _ref.host,
          transaction_signer = _ref.transaction_signer;

      _classCallCheck(this, HookedWeb3Provider);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(HookedWeb3Provider).call(this, host));
      _this.transaction_signer = transaction_signer; // Cache of the most up to date transaction counts (nonces) for each address
      // encountered by the web3 provider that's managed by the transaction signer.

      _this.global_nonces = {};
      return _this;
    } // We can't support *all* synchronous methods because we have to call out to
    // a transaction signer. So removing the ability to serve any.


    _createClass(HookedWeb3Provider, [{
      key: "send",
      value: function send(payload, callback) {
        var _this2 = this;

        var requests = payload;

        if (!_instanceof(requests, Array)) {
          requests = [requests];
        }

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = requests[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var request = _step.value;

            if (request.method == "egt_sendTransaction") {
              throw new Error("HookedWeb3Provider does not support synchronous transactions. Please provide a callback.");
            }

            if (request.method == 'egt_accounts') {
              return {
                "jsonrpc": "2.0",
                "id": 0,
                "result": this.transaction_signer.getAddresses()
              };
            }
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        var finishedWithRewrite = function finishedWithRewrite() {
          return _get(_getPrototypeOf(HookedWeb3Provider.prototype), "send", _this2).call(_this2, payload, callback);
        };

        return this.rewritePayloads(0, requests, {}, finishedWithRewrite);
      } // Catch the requests at the sendAsync level, rewriting all sendTransaction
      // methods to sendRawTransaction, calling out to the transaction_signer to
      // get the data for sendRawTransaction.

    }, {
      key: "sendAsync",
      value: function sendAsync(payload, callback) {
        var _this3 = this;

        var finishedWithRewrite = function finishedWithRewrite() {
          _get(_getPrototypeOf(HookedWeb3Provider.prototype), "sendAsync", _this3).call(_this3, payload, callback);
        };

        var preRequests = payload;

        if (!_instanceof(payload, Array)) {
          preRequests = [payload];
        }

        var requests = [];
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = preRequests[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var request = _step2.value;

            if (request.method == 'egt_accounts') {
              callback(null, {
                "jsonrpc": "2.0",
                "id": 0,
                "result": this.transaction_signer.getAddresses()
              });
            } else {
              requests.push(request);
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        if (requests.length > 0) {
          this.rewritePayloads(0, requests, {}, finishedWithRewrite);
        }
      } // Rewrite all aoa_sendTransaction payloads in the requests array.
      // This takes care of batch requests, and updates the nonces accordingly.

    }, {
      key: "rewritePayloads",
      value: function rewritePayloads(index, requests, session_nonces, finished) {
        var _this4 = this;

        if (index >= requests.length) {
          return finished();
        }

        var payload = requests[index]; // Function to remove code duplication for going to the next payload

        var next = function next(err) {
          if (err != null) {
            return finished(err);
          }

          return _this4.rewritePayloads(index + 1, requests, session_nonces, finished);
        }; // If this isn't a transaction we can modify, ignore it.


        if (payload.method != "egt_sendTransaction") {
          return next();
        }

        var tx_params = payload.params[0];
        var sender = tx_params.from;
        this.transaction_signer.hasAddress(sender, function (err, has_address) {
          if (err != null || has_address == false) {
            return next(err);
          } // Get the nonce, requesting from web3 if we haven't already requested it in this session.
          // Remember: "session_nonces" is the nonces we know about for this batch of rewriting (this "session").
          //           Having this cache makes it so we only need to call getTransactionCount once per batch.
          //           "global_nonces" is nonces across the life of this provider.


          var getNonce = function getNonce(done) {
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
              _this4.sendAsync({
                jsonrpc: '2.0',
                method: 'egt_getTransactionCount',
                params: [sender, "pending"],
                id: new Date().getTime()
              }, function (err, result) {
                if (err != null) {
                  done(err);
                } else {
                  var new_nonce = result.result;
                  done(null, Web3.prototype.toDecimal(new_nonce));
                }
              });
            }
          }; // Get the nonce, requesting from web3 if we need to.
          // We then store the nonce and update it so we don't have to
          // to request from web3 again.


          getNonce(function (err, nonce) {
            if (err != null) {
              return finished(err);
            } // Set the expected nonce, and update our caches of nonces.
            // Note that if our session nonce is lower than what we have cached
            // across all transactions (and not just this batch) use our cached
            // version instead, even if


            var final_nonce = Math.max(nonce, _this4.global_nonces[sender] || 0); // Update the transaction parameters.

            tx_params.nonce = Web3.prototype.toHex(final_nonce); // Update caches.

            session_nonces[sender] = final_nonce + 1;
            _this4.global_nonces[sender] = final_nonce + 1; // If our transaction signer does represent the address,
            // sign the transaction ourself and rewrite the payload.

            _this4.transaction_signer.signTransaction(tx_params, function (err, raw_tx) {
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
    }]);

    return HookedWeb3Provider;
  }(Web3.providers.HttpProvider);

  return HookedWeb3Provider;
};

if (typeof module !== 'undefined') {
  module.exports = factory(require("web3"));
} else {
  window.HookedWeb3Provider = factory(Web3);
}