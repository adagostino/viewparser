$require('controllerKurentoLoop', ['extend', 'config', 'controllerKurento'], function(extend, config, Kurento) {
  var KurentoMirror = function() {};

  KurentoMirror.prototype.init = function() {
    this.mediaElements = ['WebRtcEndpoint'];
  };

  // will have arguments same as this.mediaElements.
  KurentoMirror.prototype.onMediaElementsCreated = function(webRtcEndpoint) {
    this._webRtcEndpoint.connect(this._webRtcEndpoint, this._onWebRtcEndpointConnected.bind(this));
  };

  KurentoMirror.prototype._onWebRtcEndpointConnected = function(error) {
    if (error) return this._onError(error);
    this.onConnectMedia();
  };

  return extend(Kurento, KurentoMirror);
});