$require('blackList', ['extend', 'config', 'observer'], function(extend, config, Observer) {
  var _blacklistArray = [
    config.serverPort || 3000, // Server
    config.socketPort || 3002, // Socket port
    3478, // TURN Server
    5060, // Freeswitch default port
    5080, // Freeswitch external connections
    6379, // redis port
    8080, // bc everyone uses it
    16379, // redis cluster bus port
    27017, // default mongod port
    27018, // default mongo --shardsvr port
    27019, // default mongo --configsvr port
    29017 // default mongo web status page
  ];

  // Add the redis ports to the blacklist.
  for (var i=0; i<config.redis.numPorts*2; i++) {
    _blacklistArray.push(config.redis.startPort + i);
  }
  // Add the mongo ports to the blacklist.
  _blacklistArray.push(config.mongo.port);

  // Add Kurento ports to the blacklist.
  _blacklistArray.push(config.kurento.servicePort);
  _blacklistArray.push(config.kurento.wsPort);

  var BlackList = function() {};

  BlackList.prototype.init = function(min, max) {
    this._minPort = min || 1024;
    this._maxPort = max || 49151;
    this._start();
  };

  BlackList.prototype._start = function() {
    if (this._started) return;
    this.ports = {};
    this.length = 0;
    for (var i=0; i<_blacklistArray.length; i++) {
      this.addPort(_blacklistArray[i]);
    }
    this._started = true;
  };

  BlackList.prototype._portInRange = function(port) {
    return port >= this._minPort && port <= this._maxPort;
  };

  BlackList.prototype.addPort = function(port) {
    this._portInRange(port) && this._addPort(port);
  };

  BlackList.prototype._addPort = function(port) {
    this.ports[port] = 1;
    this.length++;
  };

  BlackList.prototype.removePort = function(port) {
    this.contains(port) && this._removePort(port);
  };

  BlackList.prototype._removePort = function(port) {
    this.ports[port] = 0;
    this.length--;
  };

  BlackList.prototype.contains = function(port) {
    return !!this.ports[port];
  };

  return extend(Observer, BlackList);
});