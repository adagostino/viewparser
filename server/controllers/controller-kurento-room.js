$require('controllerKurentoRoom',
[
  'extend',
  'controllerKurentoParticipant',
  'controllerKurento'
],
function(
  extend,
  Participant,
  Kurento
) {

  var Room = function() {};

  Room.prototype.__beforeInit = function() {
    this._super.apply(this, arguments);

    this._queue = {};
    this._participants = {
      'controllers': {},
      'length': 0
    }; // Participants can be any controller
    this._numParticipants = 0;
  };

  Room.prototype._drainQueue = function() {
    console.log('Draining queue for', this.__className);
    for (var id in this._queue) {
      var participant = this._queue[id];
      this._addParticipant(participant);
    }
    this._queue = {};
  };

  Room.prototype.addParticipant = function(message, viewOnly) {
    var participant = new Participant({
      'onMessage': this.onMessage,
      'socket': message.socket,
      'viewOnly': !!viewOnly
    });
    this._numParticipants++;
    this.hub ? this._addParticipant(participant) : this._enqueueParticipant(participant);
    return participant;
  };

  Room.prototype._addParticipant = function(participant) {
    console.log('Adding participant in', this.__className,'for socket', participant.socket);
    this._participants.controllers[participant.socket] = participant;
    participant.setHub(this.hub);
    participant.setPipeline(this._pipeline);
    this._participants.length++;
  };

  Room.prototype.setHub = function(hub) {
    this.hub = hub;
    // for now remember to drain queue.
    this.onConnectMedia();
    this._drainQueue();
  };

  Room.prototype._enqueueParticipant = function(participant) {
    console.log('Queueing participant for socket', participant.socket);
    this._queue[participant.socket] = participant;
  };

  Room.prototype.setOffer = function(message) {
    var participant = this.getParticipant(message.socket);
    if (!participant) return;
    participant.setOffer(message);
  };

  Room.prototype.stop = function(message) {
    var participant = this.getParticipant(message.socket);
    if (!participant) return;
    participant.stop();

    if (this._participants.controllers[message.socket]) {
      delete this._participants.controllers[message.socket];
      this._participants.length--;
    } else {
      delete this._queue[message.socket];
    }
    this._numParticipants--;
  };

  Room.prototype.onIceCandidateReceived = function(message) {
    var participant = this.getParticipant(message.socket);
    if (!participant) return;
    participant.onIceCandidateReceived(message);
  };

  Room.prototype.getParticipant = function(id) {
    return this._participants.controllers[id] || this._queue[id];
  };

  Room.prototype.getNumParticipants = function() {
    return this._numParticipants;
  };

  Room.prototype.getNumConnectedParticipants = function() {
    return this._participants.length;
  };

  Room.prototype.getNumConnectingParticipants = function() {
    return this._numParticipants - this._participants.length;
  };

  return extend(Kurento, Room);
});