$require('controllerKurentoParticipant', ['extend', 'config', 'controllerKurento'], function(extend, config, Kurento) {

  var Participant = function() {};

  Participant.prototype.init = function(opts) {
    this.mediaElements = ['WebRtcEndpoint'];
    this.viewOnly = opts.viewOnly || false;
  };

  Participant.prototype.onMediaElementsCreated = function(webRtcEndpoint) {
    console.log('Media elements created for socket', this.socket);
    this.createHubPort();
  };

  Participant.prototype.setHub = function(hub) {
    console.log('Adding hub for participant with socket', this.socket);
    this._hub = hub;
  };

  Participant.prototype.createHubPort = function() {
    this._hub.createHubPort(this._onHubPortCreated.bind(this));
  };

  Participant.prototype._onHubPortCreated = function(error, hubPort) {
    if (error) return this._onError(error);
    console.log('created hubport for socket', this.socket);
    this.hubPort = hubPort;
    this.connectSink();
  };

  Participant.prototype.connectSink = function() {
    // And in turn, we want the hub to return the media to the endpoint.
    this.hubPort.connect(this._webRtcEndpoint, this._onSinkConnected.bind(this));
  };

  Participant.prototype._onSinkConnected = function(error) {
    if (error) return this._onError(error);
    console.log('connected hubport as source to webrtcEndpoint for socket',this.socket);
    this.viewOnly ? this.maybeConnectMedia() : this.connectSource();
  };

  Participant.prototype.connectSource = function() {
    // Connect is always Source.connect(Sink) -- Which means the connecter is supplying the media to the connectee.
    // In this case, we want the endpoint to give the media to the hub.
    this._webRtcEndpoint.connect(this.hubPort, this._onSourceConnected.bind(this));
  };

  Participant.prototype._onSourceConnected = function(error) {
    if (error) return this._onError(error);
    this.sourceConnected = true;
    console.log('connected webrtcEndpoint as source to hubport for socket', this.socket);
    this.maybeConnectMedia();
  };

  Participant.prototype.disconnectSource = function() {
    this._webRtcEndpoint.disconnect(this.hubPort, this._onSourceDisconnected.bind(this));
  };

  Participant.prototype._onSourceDisconnected = function(error) {
    if (error) return this._onError(error);
    this.sourceConnected = false;
    console.log('connected hubport for socket', this.socket);
  };

  Participant.prototype.maybeConnectMedia = function() {
    !this.mediaConnected && this.onConnectMedia();
    // Testing mute and unmute.
    if (this.viewOnly) {
      //setTimeout(this.unmute.bind(this), 5000);
    }
  };

  Participant.prototype.mute = function() {
    if (!this.sourceConnected) return;
    this.disconnectSource();
  };

  Participant.prototype.unmute = function() {
    if (this.sourceConnected) return;
    this.connectSource();
    if (this.viewOnly) {
      //setTimeout(this.mute.bind(this), 5000);
    }
  };

  Participant.prototype.stop = function() {
    this._webRtcEndpoint && this._webRtcEndpoint.release();
    this.hubPort && this.hubPort.release();
  };

  return extend(Kurento, Participant);
});