$require('portStore',
[
  'extend',
  'singleton',
  'config',
  'blackList',
  'constants'
],
function(
  extend,
  singleton,
  config,
  BlackList,
  Constants
) {
  // Redis cluster starts at 30001.
  var _defaultPortRange = {'min': config.ports.range.min, 'max': config.ports.range.max};

  var PortStore = function(){};

  PortStore.prototype.init = function() {
    this.numPortsUsed = 0;
    this._minPort = _defaultPortRange.min;
    this._maxPort = _defaultPortRange.max;
    this._blacklist = new BlackList(this._minPort, this._maxPort);
    this.port = 3001;
    this._addPortToMap(this.port);

    this._prefix = '__port__::';
    this._super();
  };

  PortStore.prototype._getKey = function(key) {
    if (key === 'port') {
      return this._getOpenPort();
    }
    this._super(key);
  };

  PortStore.prototype._setKey = function(key, value) {
    this._super.apply(this, arguments);
    if (this._isPortKey(key) && value === 0) this.numPortsUsed--;
  };

  PortStore.prototype._numPortsLeft = function() {
    return this._maxPort - this._minPort - this._blacklist.length - this.numPortsUsed;
  };

  PortStore.prototype._getRandomPort = function() {
    var port = this._minPort + Math.floor(Math.random()*(this._maxPort - this._minPort));
    return this._blacklist.contains(port) ? this._getRandomPort() : port;
  };

  PortStore.prototype._addPortToMap = function(port) {
    var key = this._getKeyName(port);
    if (!this._map[key]) {
      this._map[key] = 1;
      this.numPortsUsed++;
      return true;
    }
    return false;
  };

  PortStore.prototype._getOpenPort = function() {
    if (!this._numPortsLeft()) return null;
    var port = this._getRandomPort();
    return this._addPortToMap(port) ? port : this._getOpenPort();
  };

  PortStore.prototype._isPortKey = function(key) {
    return key.indexOf(this._prefix) === 0;
  };

  PortStore.prototype._getKeyName = function(port) {
    return this._prefix + port;
  };

  // Public methods

  PortStore.prototype.getOpenPort = function(callback) {
    this.get('port', callback);
  };

  PortStore.prototype.freePort = function(port) {
    this.set(this._getKeyName(port), 0);
  };

  return Singleton.create(extend(Constants, PortStore));
});