$require('constants',['extend', 'utils', 'zmq', 'observer'], function(extend, utils, zmq, Observer) {

  var Constants = function(){};

  Constants.prototype.__beforeInit = function() {
    this._super.apply(this, arguments);
    this._map = {};
    this._callbacks = {};
    process.on('SIGINT', function() {
      this._onProcessExit(0);
    }.bind(this));
    process.on('exit', function(code) {
      console.log('Process for (', this.__className, ':', process.pid, ') received EXIT: ', code);
      this._onProcessExit(code);
    }.bind(this));

  };

  Constants.prototype.init = function() {
    this.tcp = 'tcp://*:'+ this.port;
  };

  Constants.prototype.__afterInit = function() {
    this._startRequester();
  };

  Constants.prototype.start = function() {
    console.log('Starting', this.__className);
    this._startResponder();
  };

  Constants.prototype._startResponder = function() {
    if (this.responder) return;
    this.responder = zmq.socket('rep');
    this.responder.on('message', this.onRequest.bind(this));
    this.responder.bind(this.tcp);
    console.log('Responder for (', this.__className, ':', process.pid, ') connected to: ', this.tcp);
  };

  Constants.prototype._startRequester = function() {
    if (this.requester) return;
    this.requester = zmq.socket('req');
    this.requester.on('message', this.onResponse.bind(this));
    var tcp = this.tcp.replace('*', 'localhost');
    this.requester.connect(tcp);
    console.log('Requester for (', this.__className, ':', process.pid, ') connected to: ', tcp);
  };

  Constants.prototype._onProcessExit = function(code) {
    process && console.log('Process for (', this.__className, ':', process.pid, ') exited with code: ', code);
    this.requester && this.requester.close();
    this.responder && this.responder.close();
    this.requester = this.responder = null;
  };

  Constants.prototype.onRequest = function(data) {
    console.log('Responder (', this.__className,':', process.pid, ') received request');
    var request = JSON.parse(data),
        type = request.type;

    var result;
    switch(type) {
      case 'get':
        result = this._getKey(request.key);
        break;
      case 'set':
        this._setKey(request.key, request.val);
        break;
      default:
        return false;
        break;
    }

    this.responder.send(JSON.stringify({
      'type': request.type,
      'data': result,
      'id': request.id,
    }));
  };

  Constants.prototype._getKey = function(key) {
    // Later can use Path.whatever from observejs.
    return this._map[key];
  };

  Constants.prototype._setKey = function(key, value) {
    // Later can use Path.whatever from observejs.
    this._map[key] = value;
  };

  Constants.prototype.onResponse = function(data) {
    console.log('Requester (', this.__className, ':', process.pid, ') received response');
    var response = JSON.parse(data),
        id = parseInt(response.id);

    if (this._callbacks[id]) {
      var callback = this._callbacks[id];
      delete this._callbacks[id];
      callback && callback(response.data);
    }
  };

  var id = 0;
  Constants.prototype.get = function(key, callback) {
    this._callbacks[id] = callback;
    this.requester.send(JSON.stringify({
      'type': 'get',
      'key': key,
      'id': id
    }));
    id++;
  };

  Constants.prototype.set = function(key, value) {
    this.requester.send(JSON.stringify({
      'type': 'set',
      'key': key,
      'val': value
    }));
  };

  return extend(Observer, Constants);
});