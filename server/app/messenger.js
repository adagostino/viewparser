$require('messenger', ['extend', 'portStore', 'baseMessenger'], function(extend, portStore, BaseMessenger) {

  var Messenger = function(){};

  // Master methods.

  Messenger.prototype.__afterInit = function() {
    if (!this.isMaster) return;
    this._super();
    this.port !== false ? this._getPort() : this._setup();
  };

  Messenger.prototype._getPort = function() {
    portStore.getOpenPort(this._onPortCallback.bind(this));
  };

  Messenger.prototype._onPortCallback = function(port) {
    this.port = port;
    this._setup();
  };

  return extend(BaseMessenger, Messenger);
});