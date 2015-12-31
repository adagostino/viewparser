$require('controllerKurentoMirror', ['extend', 'config', 'controllerKurento'], function(extend, config, Kurento) {
  var url = require('url');
  var _marioWings = 'https://raw.githubusercontent.com/Kurento/kurento-tutorial-node/master/kurento-magic-mirror/static/img/mario-wings.png';
  _marioWings = url.format(_marioWings);

  var KurentoMirror = function() {};

  KurentoMirror.prototype.init = function() {
    this.mediaElements = ['WebRtcEndpoint', 'FaceOverlayFilter'];
  };

  // will have arguments same as this.mediaElements.
  KurentoMirror.prototype.onMediaElementsCreated = function(webRtcEndpoint, faceOverlayFilter) {
    this._faceOverlayFilter = faceOverlayFilter;
    this._faceOverlayFilter.setOverlayedImage(_marioWings, -0.35, -1.2, 1.6, 1.6, this._onOverlayImage.bind(this));
  };

  KurentoMirror.prototype._onOverlayImage = function(error) {
    if (error) return this._onError(error);
    this.connectMediaElements();
  };

  KurentoMirror.prototype.connectMediaElements = function() {
    this._webRtcEndpoint.connect(this._faceOverlayFilter, this._onFaceOverlayFilterConnected.bind(this));
  };

  KurentoMirror.prototype._onFaceOverlayFilterConnected = function(error) {
    if (error) return this._onError(error);
    this._faceOverlayFilter.connect(this._webRtcEndpoint, this._onWebRtcEndpointConnected.bind(this));
  };

  KurentoMirror.prototype._onWebRtcEndpointConnected = function(error) {
    if (error) return this._onError(error);
    this.onConnectMedia();
  };

  return extend(Kurento, KurentoMirror);
});