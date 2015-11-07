$require('endpoint', ['extend', 'zmq', 'os', 'req', 'messenger'], function(extend, zmq, os, ReqWrapper, Messenger) {

  var Endpoint = function(){};

  Endpoint.prototype.__templateType = 'endpoint';

  Endpoint.prototype.__beforeInit = function(options) {
    // options {url: str}
    options = options || {};
    this._super(options);
    this.app = this.options.app;
    this._reqMap = {};
    //TODO(TJ): support 'wrappers' -- basically middleware.
  };

  Endpoint.prototype._setup = function() {
    if (!this.isMaster || this.started) return;
    this._super();
    this.started = true;
    this._setupListeners();
  };

  Endpoint.prototype._setupListeners = function() {
    this._wrapListener('get');
    this._wrapListener('put');
    this._wrapListener('post');
    this._wrapListener('delete');
  };

  var id = 0;
  Endpoint.prototype._wrapListener = function(type) {
    var fn = this.tcp ? function(req, res) {
      // get a unique id;
      id++;
      this._reqMap[id] = {
        'req': req,
        'res': res
      };

      // Get the important params from request.
      var tempReq = {};
      for (var i=0; i< ReqWrapper.prototype.fields.length; i++) {
        tempReq[ReqWrapper.prototype.fields[i]] = req[ReqWrapper.prototype.fields[i]];
      }

      this.requester.send(JSON.stringify({
        'type': type,
        'id': id,
        'req': tempReq
      }));
    } : this[type];
    // Following line means: this.app('get', '/', function(req, res){});
    this.app[type](this.url, fn.bind(this));
  };

  Endpoint.prototype.onResponse = function(data) {
    // Called on the Master when a response is gotten.
    this._super(data);
    var response = JSON.parse(data),
        id = parseInt(response.id);
    var resReq = this._reqMap[id];
    this._reqMap[id] = null;
    // Need to send the response.
    this.sendResponse(response, resReq.req, resReq.res);
  };

  Endpoint.prototype.sendResponse = function(response, req, res) {
    // Override sendResponse if you need to do something fancy with the res express object. You'll probably need
    // a case statement or something like that.
    // Maybe some clever things can be done here since data can be an object (like setting headers or whatever).
    res.send(response.data);
  };

  // Slave

  Endpoint.prototype.onRequest = function(data) {
    this._super(data);
    var request = JSON.parse(data);
    var type = request.type.toLowerCase();
    var responder = this.responder;
    // Create a really basic 'response' object that has 'send' so that the end user doesn't care if it's Express
    // or a micro service.
    var res = {
      'send': function(data) {
          responder.send(JSON.stringify({
            'type': request.type,
            'id': request.id,
            'data': data
          }));
      }
    };
    // Wrap the request to parity Express req methods.
    var req = new ReqWrapper(request.req);
    // call get/put/post/delete/whatever
    this[type] && this[type](req, res);
  };

  Endpoint.prototype._genericMessage = function(type, args) {
    args = args || '';
    console.log(type.toUpperCase(), 'request for ', this.url, ' (', this.process.pid ,') : ', args);
  };

  Endpoint.prototype.get = function(req, res) {
    this._genericMessage('get', arguments);
    res.send('');
  };

  Endpoint.prototype.put = function(req, res) {
    this._genericMessage('put', arguments);
    res.send('');
  };

  Endpoint.prototype.post = function(req, res) {
    this._genericMessage('post', arguments);
    res.send('');
  };

  Endpoint.prototype.delete = function(req, res) {
    this._genericMessage('delete', arguments);
    res.send('');
  };

  return extend(Messenger, Endpoint);
});