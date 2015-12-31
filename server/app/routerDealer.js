$require('routerDealer', ['extend', 'zmq', 'messenger'], function(extend, zmq, Messenger) {
  /* To connect on router/dealer (A) to another (B).
      1) Master A calls 'registerWithPort' using B's port and sends a request to B.
      2) Master B receives a request, routes it through to one of its workers. The worker then sends a message to the master.
      3) Master B receives the message and calls 'registerPort' using that port.
      4) On init, worker A then calls 'connectToPort' which connects to Master B's router. And make requests.
      5) Worker from A will make a request to Master B, Master B will send the request down through its req/res process.
      6) Worker from B will receive a request, process it, send an acknowledgement back.
      7) If Worker B needs to send
  */
  var RouterDealer = function() {};

  RouterDealer.prototype.__beforeInit = function() {
    this._super.apply(this, arguments);
    this._registrations = {};
    this._connections = {};
    this.portsToConnect = [];
  };

  // This is called when another router/dealer connects to this router/dealer using 'connectToPort .
  RouterDealer.prototype.onMessageFromWorker = function(message) {
    this._super(message);
    switch(message.data.type) {
      case 'register':
        this.registerPort(message.data.port);
        break;
      case 'toRegisteredPort':
        this.sendMessageToPort(message.data, message.data.port);
        break;
      case 'fromConnectedPort':
        // Remember, when messages are received by the router/dealer, they get sent all the way down to the slave. The slave then has to send them back up.
        this._onMessageFromConnectedPort(message.data.data);
        break;
      default:
        break;
    }
  };

  RouterDealer.prototype._onMessageFromConnectedPort = function(message) {
    this.onMessageFromConnectedPort(message);
  };

  RouterDealer.prototype.onMessageFromConnectedPort = function(message) {
    // keep this open for inheritance.
  };

  RouterDealer.prototype.sendMessageToPort = function(message, port) {
    if (!this._registrations[port]) {
      console.error('ERROR: Trying to send message from ', this.__className, '(', this.process.id, ') to port', port, 'that is not registered.', message);
      return;
    }
    this._registrations[port].send(JSON.stringify({
      'type': 'fromConnectedPort',
      'data': message.data,
      'port': this.port
    }));
  };

  RouterDealer.prototype._setup = function() {
    this._super();
    for (var i=0; i<this.portsToConnect.length; i++) {
      this.registerWithPort(this.portsToConnect[i]);
    }
  };

  // Register this router/dealer with another router/dealer so the other one can send messages back to this one.
  // Masters have registrations, slaves have connections. Slaves connect to another dealer/router.
  RouterDealer.prototype.registerWithPort = function(port) {
    // Master registers the ports.
    var tcp = 'tcp://localhost:' + port;
    var requester = zmq.socket('req').connect(tcp);
    this._connections[port] = requester;
    requester.on('message', function(data) { this.onRegisteredPortResponse(data, port);}.bind(this));
    console.log('Registering port ', this.port, '(', this.__className, ':', this.process.pid, ') with port', port);
    // Now send a message to register with the other Router/Dealer.
    requester.send(JSON.stringify({'type': 'register', 'port': this.port, 'data': {'type': 'register', 'port': this.port}}));
  };

  // When another router/dealer connects with this router/dealer, register the port.
  RouterDealer.prototype.registerPort = function(port) {
    var tcp = 'tcp://localhost:' + port;
    var requester = zmq.socket('req').connect(tcp);
    requester.on('message', function(data) { this.onRegisteredPortResponse(data, port);}.bind(this));
    this._registrations[port] = requester;
    console.log('Registered port ', port, '(', this.__className, ':', this.process.pid, ') with port', this.port);
  };

  RouterDealer.prototype.onRegisteredPortResponse = function(data, port) {
    // you can do something with this, but you may not really care about it. This is for when a service sends a port
    // that registered with it a message. That port then sends an acknowledgement that it got the
    // message and processed it. That acknowledgement is this.
    //console.log('did we get a registered port message?', data, port);
  };

  RouterDealer.prototype.closeSockets = function() {
    this._super();
    for (var key in this._connections) {
      try {
        this._connections[key].close();
      } catch(err) {
        console.log('ERROR: Tried closing CONNECTION to port ', key ,'for', this.__className, '(', this.process.id, ') failed.');
        console.log(err);
      }

    }
    for (var key in this._registrations) {
      try {
        this._registrations[key].close();
      } catch (err) {
        console.log('ERROR: Tried closing REGISTRATION to port ', key ,'for', this.__className, '(', this.process.id, ') failed.');
        console.log(err);
      }
    }
  };

  // Slave
  RouterDealer.prototype.onFork = function() {
    if (this.isMaster) return;
    this._super.apply(this, arguments);
    for (var i=0; i<this.portsToConnect.length; i++) {
      this.connectToPort(this.portsToConnect[i]);
    }
  };

  // Connect to another Router/Dealer
  RouterDealer.prototype.connectToPort = function(port) {
    var tcp = 'tcp://localhost:' + port;
    // Connect to the other RD's ROUTER.
    var requester = zmq.socket('req').connect(tcp);
    this._connections[port] = requester;
    requester.on('message', function(data) { this.onConnectedPortResponse(data, port);}.bind(this));
    console.log('Connecting port ', this.port, '(', this.__className, ':', this.process.pid, ') with port', port);
  };

  // Replace onRequest to listen for registrations.
  RouterDealer.prototype.onRequest = function(messageStr) {
    console.log('Responder (', this.__className,':', this.process.pid, ') received request');
    var message = JSON.parse(messageStr);
    switch(message.type) {
      case 'register':
        this.sendMasterMessage(message);
        this.responder.send(JSON.stringify({
          'messageType': 'acknowledgedMessage',
          'data': message
        }));
        return;
        break;
      case 'fromConnectedPort':
        this.sendMasterMessage(message);
        this.responder.send(JSON.stringify({
          'messageType': 'acknowledgedMessage',
          'data': message
        }));
        return;
      default:
        break;
    }
    this.onMessage(message);
  };

  RouterDealer.prototype.onMessage = function(message) {

  };

  // These are the responses from the connected port.
  RouterDealer.prototype.onConnectedPortResponse = function(data, port) {
    // You can do something with this, but you usually won't care. It's basically when the service you are connected
    // to sends you a response acknowledging it got and processed your request.
    //console.log('did we get a connected port message?', data, port);
  };


  RouterDealer.prototype.sendMessageToRegisteredPort = function(message, port) {
    this.sendMasterMessage({
      'type': 'toRegisteredPort',
      'port': port,
      'data': message
    });
  };


  return extend(Messenger, RouterDealer);
});