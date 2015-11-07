$require('baseMessenger', ['extend', 'utils', 'zmq', 'microService'], function(extend, utils, zmq, MicroService) {

  var BaseMessenger = function() {};

  BaseMessenger.prototype.__beforeInit = function(options) {
    // options: {'port': num}
    this._super(options);
    // The IPC has to be unique
    this.ipc = this.options.ipc || 'ipc://'+ this.__className + '_' + utils.guid() + '.ipc';
    // To pass on to spawn.
    this.options.ipc = this.ipc;
  };

  BaseMessenger.prototype._setup = function() {
    this.tcp = this.tcp || this.options.tcp || (this.port ? 'tcp://*:'+ this.port : null);
    // Set up the Router/Dealer.
    this.startRouter();
    this.startDealer();
    this.startRequester();
    !this.numProcesses && this.tcp && this.startResponder();
  };

  BaseMessenger.prototype.startRouter = function() {
    if (this.router || !this.tcp || !this.isMaster) return;
    this.router = zmq.socket('router').bind(this.tcp);
    this.router.on('message', this._onRouterMessage.bind(this));
    console.log('Router for (', this.__className, ':', this.process.pid, ') bound to: ', this.tcp);
  };

  BaseMessenger.prototype._onRouterMessage = function() {
    console.log('Router for (', this.__className, ':', this.process.pid, ') received a message');
    var frames = Array.prototype.slice.call(arguments);
    this.dealer.send(frames);
  };

  BaseMessenger.prototype.startDealer = function() {
    if (this.dealer || !this.tcp || !this.isMaster) return;
    this.dealer = zmq.socket('dealer').bind(this.ipc);
    this.dealer.on('message', this._onDealerMessage.bind(this));
    console.log('Dealer for (', this.__className, ':', this.process.pid, ') bound to: ', this.ipc);
  };

  BaseMessenger.prototype._onDealerMessage = function() {
    console.log('Dealer for (', this.__className, ':', this.process.pid, ') received a message');
    var frames = Array.prototype.slice.call(arguments);
    this.router.send(frames);
  };

  BaseMessenger.prototype.startRequester = function() {
    if (this.requester || !this.tcp || !this.isMaster) return;
    var tcp = this.tcp.replace('*', 'localhost');
    this.requester = zmq.socket('req').connect(tcp);
    this.requester.on('message', this.onResponse.bind(this));
    console.log('Requester for (', this.__className, ':', this.process.pid, ') connected to: ', this.tcp);
  };

  BaseMessenger.prototype.onResponse = function(data) {
    console.log('Requester (', this.__className, ':', this.process.pid, ') received response');
  };

  BaseMessenger.prototype.closeSockets = function() {
    this.router && this.router.close();
    this.dealer && this.dealer.close();
    this.requester && this.requester.close();
    this.responder && this.responder.close();
    this.router = this.dealer = this.requester = this.responder = null;
  };

  BaseMessenger.prototype._onProcessExit = function(code) {
    this.closeSockets();
    code && this.isMaster && portStore.freePort(this.port);
    this._super(code);
  };

  // Slave methods.

  BaseMessenger.prototype.onFork = function() {
    if (this.isMaster) return;
    this._super.apply(this, arguments);
    this.startResponder();
  };

  BaseMessenger.prototype.startResponder = function() {
    if (this.responder) return;
    this.responder = zmq.socket('rep').connect(this.ipc);
    this.responder.on('message', this.onRequest.bind(this));
    console.log('Responder for (', this.__className, ':', this.process.pid, ') connected to: ', this.ipc);
  };

  BaseMessenger.prototype.onRequest = function(data) {
    // Let user define this.
    console.log('Responder (', this.__className,':', this.process.pid, ') received request');
  };


  return extend(MicroService, BaseMessenger);
});