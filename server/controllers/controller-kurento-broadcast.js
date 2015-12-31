$require('controllerKurentoBroadcast', ['extend', 'controllerKurentoRoom'], function(extend, Room) {

  var Broadcast = function() {};

  Broadcast.prototype.init = function() {
    // When first created, create the composite and an endpoint for the creator.
    this.mediaElements = ['WebRtcEndpoint', 'DispatcherOneToMany'];
  };

  // will have arguments same as this.mediaElements.
  Broadcast.prototype.onMediaElementsCreated = function(webRtcEndpoint, dispatcherOneToMany) {
    console.log('Created media elements for Broadcast');
    // This is important to set here. The room and its participants need to know how to create media.
    this.setHub(dispatcherOneToMany);
  };

  Broadcast.prototype.setBroadcaster = function(participant) {
    // set a hubport as the source.
    var cb = function() { this._setBroadcaster(participant); }.bind(this);
    participant.mediaConnected ? cb() : participant.$on('mediaConnected', cb);
  };

  Broadcast.prototype._setBroadcaster = function(participant) {
    if (this._broadcaster) return;
    this._broadcaster = participant;
    this.hub.setSource(participant.hubPort, this._onBroadcasterSet.bind(this));
  };

  Broadcast.prototype._onBroadcasterSet = function(error) {
    if (error) return this._onError(error);
  };

  Broadcast.prototype.stop = function(message) {
    this._super(message);
    if (!this._broadcaster || this._broadcaster.socket !== message.socket) return;
    // If the broadcaster leaves, shut it all down.
    for (var key in this._participants.controllers) {
      this.stop(this._participants.controllers[key]);
    }
  };

  return extend(Room, Broadcast);
});