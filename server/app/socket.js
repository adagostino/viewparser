// https://www.npmjs.com/package/socket.io-ioredis
// https://github.com/luin/ioredis/issues/34
$require('socket',
[
  'extend',
  'redisManager',
  'socket.io',
  'socket.io-ioredis',
  'config',
  'http',
  'routerDealer'
],
function(
  extend,
  redis,
  socketIo,
  socketIoRedis,
  config,
  http,
  RouterDealer
) {
  var Socket = function() {};

  Socket.prototype.__templateType = 'socket';

  Socket.prototype.__beforeInit = function(options) {
    // options {url: str}
    options = options || {};
    this._super(options);
    this.server = this.options.server;
    this.publicRoute = this.options.publicRoute || '';
    // A map kept in master of all sockets by their id.
    this._sockets = {};
  };

  Socket.prototype._setup = function() {
    if (!this.isMaster || this.started) return;
    this._super();
    this.started = true;
    this._setupIo();
  };

  Socket.prototype._setupIo = function() {
    //this.io = socketIo(this.server); // this.port
    this.io = socketIo(this.port);
    this.io.adapter(socketIoRedis(redis.getPubSub()));
    this.io.on('connection', this.onConnection.bind(this));
  };

  // http://socket.io/docs/rooms-and-namespaces/#rooms
  Socket.prototype.onConnection = function(socket) {
    console.log('Socket Connected: ', socket.id);
    // Store the socket.
    this._sockets[socket.id] = socket;
    // Send Request
    socket.on('message', function(data) { this.onSocketMessage(data, socket); }.bind(this));
    socket.on('disconnect', function() { this.onSocketDisconnect(socket) }.bind(this));
    // superize this method to have the socket join a room.
    this.joinRoom(socket);
  };

  Socket.prototype.joinRoom = function(socket) {

  };

  Socket.prototype.onSocketMessage = function (data, socket) {
    // data should have a message type in it always.
    var message = {
      'data': data,
      'socket': socket.id
    };
    //console.log('onSocketMessage:', message, !!this.tcp);
    // If this is a messenger, then send the message. Otherwise, just go directly to onMessage.
    this.tcp ? this.requester.send(JSON.stringify(message)) : this.onMessage(message);
  };

  Socket.prototype.onSocketDisconnect = function(socket) {
    console.log('Socket Disconnected', socket.id);
    // Remove the socket from storage.
    socket.disconnect();
    this._sockets[socket.id] = null;
  };

  // process Response
  Socket.prototype.onResponse = function(data) {
    // Called on the Master when a response is gotten.
    this._super(data);
    var response = JSON.parse(data);
    this.sendResponse(response.data, response.socket, response.messageType);
  };

  // Send Response.
  // http://socket.io/docs/rooms-and-namespaces/#default-room
  Socket.prototype.sendResponse = function(data, socketId, messageType) {
    // For now we assume a socket only belongs to one room at most.
    var socket = this._sockets[socketId];
    var id = messageType <= 0 ? socketId : _getRoomFromSocket(socket);
    switch(messageType) {
      case 0:
        // Send message back to the original socket.
        socket.emit('message', data);
        break;
      case 1:
        // Broadcast message to everyone in the room but original socket.
        socket.broadcast.to(id).emit('message', data);
        break;
      case 2:
        this.io.to(id).emit('message', data);
        break;
      default:
        break;
    }
  };

  var _getRoomFromSocket = function(socket) {
    var rooms = socket.rooms;
    var id = socket.id;
    for (var i=0; i<rooms.length; i++) {
      if (rooms[i] !== id) {
        id = rooms[i];
        break;
      }
    }
    return id;
  };

  Socket.prototype._onProcessExit = function(code) {
    this._super(code);
    if (this.io) {
      this.io.httpServer.close();
      this.io.close();
    }
  };

  Socket.prototype._onMessageFromConnectedPort = function(message) {
    this.onMessageFromConnectedPort(message.data, message.socket);
  };

  // Slave.
  // Process Request
  Socket.prototype.onMessage = function(message) {
    // Use switch/case statement here to figure out what to do with the message. Left open so it can be superized.
  };

  // Use sendMessage to send a message back after processing it in onMessage.
  Socket.prototype._sendMessage = function(data, socket, messageType) {
    var response = {
      'messageType': messageType,
      'data': data,
      'socket': socket
    };
    // If this is a messenger, only slaves will ever call this method. So if it's a slave, then send the responder
    // a response. Otherwise, just go straight to sendResponse.
    !this.isMaster ? this.responder.send(JSON.stringify(response)) : this.sendResponse(data, socket, messageType);
  };

  Socket.prototype.acknowledgeMessage = function(data, socket) {
    this._sendMessage(data, socket, -1);
  };

  // Most common kind of message -- message from server back to the individual.
  Socket.prototype.sendMessage = function(data, socket) {
    this._sendMessage(data, socket, 0);
  };

  // Second most common message -- send a message to everyone in the room but yourself.
  Socket.prototype.broadcastMessage = function(data, socket) {
    this._sendMessage(data, socket, 1);
  };

  // Least common (next to PMs) -- send a message to everyone in the room including yourself.
  Socket.prototype.emitMessage = function(data, socket) {
    this._sendMessage(data, socket, 2);
  };

  return extend(RouterDealer, Socket);
});