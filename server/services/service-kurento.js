$require('serviceKurento',
[
  'extend',
  'config',
  'controllerKurento',
  'controllerKurentoLoop',
  'controllerKurentoMirror',
  'controllerKurentoConference',
  'controllerKurentoBroadcast',
  'controllerKurentoPresentation',
  'serviceServer'
],
function(
  extend,
  config,
  ControllerKurento,
  ControllerKurentoLoop,
  ControllerKurentoMirror,
  ControllerKurentoConference,
  ControllerKurentoBroadcast,
  ControllerKurentoPresentation,
  Service
) {
  var Kurento = function() {};

  Kurento.prototype.init = function() {
    this.port = config.kurento.servicePort;
    this.numProcesses = 1;
    this._queue = [];
    this._controllers = {};
    this.getClient();
  };

  // Slave.
  Kurento.prototype.getClient = function() {
    if (this.isMaster) return;
    var kurentoCtrl = new ControllerKurento();
    kurentoCtrl.getClient(this._setKurentoClient.bind(this));
  };

  Kurento.prototype._setKurentoClient = function(client) {
    console.log('KURENTO CLIENT SET', client);
    this._kurentoClient = client;
    this._drainQueue();
  };

  Kurento.prototype.enqueueMessage = function(message) {
    this._queue.push(message);
  };

  Kurento.prototype._drainQueue = function() {
    for (var i=0; i<this._queue.length; i++) {
      this.onMessage(this._queue[i]);
    }
    this._queue = [];
  };

  Kurento.prototype.onMessage = function(message) {
    this._kurentoClient ? this.processMessage(message) : this.enqueueMessage(message);
    this.acknowledge(message);
  };

  Kurento.prototype.processMessage = function(message) {
    // When a message is sent to the Kurento Service, figure out what to do with it.
    // message = {'socket': socketId, 'data': {data sent from client} }
    switch(message.data.type) {
      case 'connect':
        this.connectToKurento(message);
        break;
      case 'disconnect':
        this.disconnectFromKurento(message);
        break;
      case 'icecandidate':
        this.sendIceCandidateToKurento(message);
        break;
      case 'offer':
        this.sendOfferToKurento(message);
        break;
      default:
        break;
    }
  };

  Kurento.prototype.acknowledge = function(message) {
    //console.log('Kurento got message', message);
    this.responder.send(JSON.stringify({
      'messageType': -1,
      'data': message.data,
      'socket': message.socket
    }));
  };

  Kurento.prototype.connectToKurento = function(message) {
    // This is where you'd choose which controller to use. Right now we only have one controller -- the mirror.
    var socket = message.socket;
    if (this._controllers[socket]) this.disconnectFromKurento(message);
    //this.connectToLoop(message);
    //this.connectToMirror(message);
    this.connectToConference(message);
    //this.connectToBroadcast(message);
    //this.connectToPresentation(message);
  };

  Kurento.prototype.connectToLoop = function(message) {
    console.log('Connecting to loop', message.socket);
    this._controllers[message.socket] = new ControllerKurentoLoop({
      'client': this._kurentoClient,
      'onMessage': this.onMessageFromKurento.bind(this),
      'socket': message.socket
    });
  };

  Kurento.prototype.connectToMirror = function(message) {
    console.log('Connecting to mirror', message.socket);
    this._controllers[message.socket] = new ControllerKurentoMirror({
      'client': this._kurentoClient,
      'onMessage': this.onMessageFromKurento.bind(this),
      'socket': message.socket
    });
  };

  Kurento.prototype.connectToConference = function(message) {
    if (!this._conference) {
      console.log('Creating conference');
      this._conference = new ControllerKurentoConference({
        'client': this._kurentoClient,
        'onMessage': this.onMessageFromKurento.bind(this)
      });
    }
    console.log('Connecting to conference', message.socket);
    this._conference.addParticipant(message);
    this._controllers[message.socket] = this._conference;
  };

  Kurento.prototype.connectToBroadcast = function(message) {
    if (!this._broadcast) {
      console.log('Creating broadcast');
      this._broadcast = new ControllerKurentoBroadcast({
        'client': this._kurentoClient,
        'onMessage': this.onMessageFromKurento.bind(this)
      });
    }
    console.log('Connecting to broadcast', message.socket, this._broadcast.getNumParticipants());
    var isBroadcaster = !!!this._broadcast.getNumParticipants();
    var participant = this._broadcast.addParticipant(message);
    isBroadcaster && this._broadcast.setBroadcaster(participant);
    this._controllers[message.socket] = this._broadcast;
  };

  Kurento.prototype.connectToPresentation = function(message) {
    if (!this._presentation) {
      console.log('Creating Presentation');
      this._presentation = new ControllerKurentoPresentation({
        'client': this._kurentoClient,
        'onMessage': this.onMessageFromKurento.bind(this)
      });
    }
    var isPresenter = this._presentation.getNumParticipants() < 2;
    isPresenter ? this._presentation.addPresenter(message) : this._presentation.addParticipant(message);
    this._controllers[message.socket] = this._presentation;
  };

  Kurento.prototype.disconnectFromKurento = function(message) {
    console.log('disconnect', message);
    var socket = message.socket;
    var ctrl = this._getController(message);
    if (!ctrl) return;
    ctrl.stop(message);
    this._controllers[socket] = null;
  };

  Kurento.prototype._getController = function(message) {
    var ctrl = this._controllers[message.socket];
    // TODO(TJ): log error.
    return ctrl;
  };

  Kurento.prototype.sendIceCandidateToKurento = function(message) {
    var ctrl = this._getController(message);
    if (!ctrl) return;
    console.log('Sending Ice Candidate to Kurento for Socket (', message.socket, '):', message);
    ctrl.onIceCandidateReceived(message);
  };

  Kurento.prototype.sendOfferToKurento = function(message) {
    var ctrl = this._getController(message);
    if (!ctrl) return;
    console.log('Sending Offer to Kurento for Socket(', message.socket, '):', message);
    ctrl.setOffer(message);
  };

  Kurento.prototype.onMessageFromKurento = function(message) {
    this.sendMessageToRegisteredPort(message, 3002);
  };

  Kurento.prototype.closeSockets = function() {
    this._super();
    for (var socket in this._controllers) {
      this._controllers[socket] && this._controllers[socket].stop();
    }
  };

  return extend(Service, Kurento);
});