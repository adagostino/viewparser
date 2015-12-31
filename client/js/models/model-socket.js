$app.require('modelSocket', ['utils', 'model'], function(utils, Model) {
  var Socket = function(){};

  Socket.prototype.init = function() {
    var x = location.protocol + '//' + location.hostname + ':3002';
    this._socket = io.connect(x, {'forceNew' : true , 'multiplex': false});
    this._socket.on('connect', this.$callback(this._onConnect));
    this._socket.on('disconnect', this.$callback(this._onDisconnect));
    this._socket.on('message', this.$callback(this._onMessage));
    this._queue = [];
  };

  Socket.prototype._onConnect = function() {
    this._connected = true;
    this._drainQueue();
  };

  Socket.prototype._onDisconnect = function() {
    this._connected = false;
  };

  Socket.prototype._onMessage = function(message) {
    this.$trigger('message', message);
  };

  Socket.prototype._drainQueue = function() {
    for (var i=0; i<this._queue.length; i++) {
      this.emit(this._queue[i]);
    }
    this._queue = [];
  };

  Socket.prototype.emit = function(data) {
    this._connected ? this._send(data) : this._enqueue(data);
  };

  Socket.prototype._send = function(data) {
    var jsonMessage = JSON.stringify(data);
    this._log('Sending message:', jsonMessage);
    this._socket.emit('message', data);
  };

  Socket.prototype._enqueue = function(data) {
    this._log('Enqueuing message', JSON.stringify(data));
    this._queue.push(data);
  };

  Socket.prototype.disconnect = function() {
    this.$trigger('disconnect');
    this._socket.disconnect();
  };



  return $app.extend(Model, Socket);
});