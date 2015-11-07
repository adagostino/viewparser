// Basic req object for endpoints. Can take a full Express req and turn it into something that can be
// stringified and can also add method parity to the req transferred over the microservice..
$require('req', function() {
  var accepts = require('accepts'),
      typeis = require('type-is');

  var req = function(reqObj) {
    // Constructor -- get all useful fields.
    reqObj = reqObj || {};
    this._extend(reqObj, this);
  };

  req.prototype.fields = ['baseUrl', 'body', 'cookies', 'fresh', 'headers', 'hostname', 'ip', 'ips', 'originalUrl',
  'params', 'path', 'protocol', 'query', 'route', 'secure', 'signedCookies', 'stale', 'subdomains', 'xhr'];

  req.prototype.get = req.prototype.header = function (name) {
    var lc = name.toLowerCase();

    switch (lc) {
      case 'referer':
      case 'referrer':
        return this.headers.referrer
          || this.headers.referer;
      default:
        return this.headers[lc];
    }
  };

  req.prototype._extend = function(fromThis, toThis) {
    for (var i=0; i< this.fields.length; i++) {
      toThis[this.fields[i]] = fromThis[this.fields[i]];
    }
    return toThis;
  };

  req.prototype.json = function() {
    return this._extend(this, {});
  };

  req.prototype.accepts = function () {
    var accept = accepts(this);
    return accept.types.apply(accept, arguments);
  };

  req.prototype.acceptsCharsets = function () {
    var accept = accepts(this);
    return accept.charsets.apply(accept, arguments);
  };

  req.prototype.acceptsEncodings = function () {
    var accept = accepts(this);
    return accept.encodings.apply(accept, arguments);
  };

  req.prototype.acceptsLanguages = function () {
    var accept = accepts(this);
    return accept.languages.apply(accept, arguments);
  };

  req.is = function is(types) {
    var arr = types;

    // support flattened arguments
    if (!Array.isArray(types)) {
      arr = new Array(arguments.length);
      for (var i = 0; i < arr.length; i++) {
        arr[i] = arguments[i];
      }
    }

    return typeis(this, arr);
  };

  return req;
});