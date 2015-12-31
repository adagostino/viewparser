$require('socketKurento',
[
  'extend',
  'config',
  'socketBase'
],
function(
  extend,
  config,
  SocketBase
) {

  var KMSPORT = config.kurento.servicePort;

  var SocketKurento = function(){};

  SocketKurento.prototype.init = function() {
    this.port = 3002;
    this.portsToConnect = [KMSPORT];
  };

  SocketKurento.prototype.onConnection = function(socket) {
    // Note: could probably do some sort of load balancing here with multiple kms services. Store which kms service
    // to always use for a specific socket.
    this._super(socket);
    this.onSocketMessage({'type': 'connect'}, socket);
  };

  SocketKurento.prototype._joinRoom = function(socket) {
    // have it join a room here. check the header etc.
  };

  SocketKurento.prototype.onSocketDisconnect = function(socket) {
    this._super(socket);
    this.onSocketMessage({'type': 'disconnect'}, socket);
  };

  // When KMS sends the socket a message.
  SocketKurento.prototype.onMessageFromConnectedPort = function(message, socket) {
    this.sendResponse(message, socket, 0);
  };

  // Slave.
  // Socket receives a message from the client.
  SocketKurento.prototype.onMessage = function(message) {
    // a little inefficient -- try to figure out onRequest later.
    this.sendKms(message);
  };

  SocketKurento.prototype.sendKms = function(message) {
    this._connections[KMSPORT].send(JSON.stringify(message));
    this.acknowledgeMessage(message.data, message.socket);
  };


  return extend(SocketBase, SocketKurento);
});
