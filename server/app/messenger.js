$require('messenger', ['extend', 'portStore', 'baseRouterDealer'], function(extend, portStore, BaseRouterDealer) {

  var Messenger = function(){};

  // Master methods.

  Messenger.prototype.__afterInit = function() {
    if (!this.isMaster) return;
    this._super();
    this.port !== false ? this._getPort() : this._setup();
  };

  Messenger.prototype._getPort = function() {
    var cb = this._onPortCallback.bind(this);
    this.port ? cb(this.port) : portStore.getOpenPort(cb);
  };

  Messenger.prototype._onPortCallback = function(port) {
    this.port = port;
    this._setup();
  };

  return extend(BaseRouterDealer, Messenger);
});