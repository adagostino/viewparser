$require('portStore', ['extend', 'singleton', 'constants'], function(extend, singleton, Constants) {
  var PortStore = function(){};

  PortStore.prototype.init = function() {
    this.port = 3001;
    this.numPortsUsed = 0;
    this._minPort = 5000;
    this._maxPort = 25000;

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

  PortStore.prototype._getOpenPort = function() {
    if (this.numPortsUsed >= (this._maxPort - this._minPort)) return null;
    var port = this._minPort + Math.floor(Math.random()*(this._maxPort - this._minPort)),
        key = this._getKeyName(port);

    if (!this._map[key]) {
      this._map[key] = 1;
      this.numPortsUsed++;
      return port;
    } else {
      return this._getOpenPort();
    }
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