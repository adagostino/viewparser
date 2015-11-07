$require('server',
[
  'extend',
  'express',
  'os',
  'utils',
  'portStore',
  'microService',
  'endpoint'
],
function(
  extend,
  express,
  os,
  utils,
  portStore,
  MicroService,
  Endpoint
) {
  var Server = function(){};

  Server.prototype.__beforeInit = function(options) {
    this._super(options);
    this.endpoints = {};
    this.port = this.port || this.options.port || 3000;
  };

  Server.prototype.__afterInit = function() {
    // Set up the app, add the routes.
    if (!this.isMaster) return;
    this._super();
    this.routes = this.routes || this.options.routes || [];
    // Start up the port store.
    portStore.start();
    if (!this.numProcesses) this.setupApp();
  };

  Server.prototype.setupApp = function() {
    if (this.app) return;
    this.app = express();
    for (var i=0; i< this.routes.length; i++) {
      this.addEndpoint(this.routes[i]);
    }
    this.app.listen(this.port, function() {
      this.isMaster && console.log('Server (', this.__className, ') has started.');
    }.bind(this));
  };

  Server.prototype.addEndpoint = function(endpointOrOptions) {
    if (!endpointOrOptions) return;
    var ep;

    if (endpointOrOptions.prototype.__templateType === 'endpoint') {
      ep = new endpointOrOptions({'app': this.app});
    } else {
      endpointOrOptions['app'] = this.app;
      ep = new Endpoint(endpointOrOptions);
    }
    this.endpoints[ep.url] = ep;
  };

  // Slave

  Server.prototype.onFork = function() {
    if (this.isMaster) return;
    this._super.apply(this, arguments);
    this.setupApp();
  };


  return extend(MicroService, Server);
});