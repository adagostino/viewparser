$require('controllerKurentoPresenter',
[
  'extend',
  'controllerKurento'
],
function(
  extend,
  Kurento
) {

  var Presenter = function() {};

  Presenter.prototype.init = function() {
    this.mediaElements = ['WebRtcEndpoint'];
    // A presenter has two hubs -- the source hub and the sink hub.
    // The presenter uses its webRtcEndpoint as a source and connects it to the source hub.
    // The sink hub then connects it's source to the webrtcEndpoint's sink.
  };

  Presenter.prototype.onMediaElementsCreated = function(webRtcEndpoint) {
    console.log('Media elements created for presenter for socket', this.socket);
    // Assumes you've set the Hubs first.
    // Should always call Presenter.setHubs(sourceHub, sinkHub) then Presenter.setPipeline(pipeline)
    this.createHubPorts();
  };

  Presenter.prototype.setHubs = function(sourceHub, sinkHub) {
    this.setSourceHub(sourceHub);
    this.setSinkHub(sinkHub);
  };

  Presenter.prototype.setSourceHub = function(hub) {
    this.sourceHub = hub;
  };

  Presenter.prototype.setSinkHub = function(hub) {
    this.sinkHub = hub;
  };

  Presenter.prototype.createHubPorts = function() {
    this._createSourceHubPort();
    this._createSinkHubPort();
  };

  Presenter.prototype._createSourceHubPort = function() {
    this.sourceHub.createHubPort(this._onSourceHubPortCreated.bind(this));
  };

  Presenter.prototype._onSourceHubPortCreated = function(error, hubPort) {
    if (error) return this._onError(error);
    this.sourceHubPort = hubPort;
    this.connectSource();
  };

  Presenter.prototype._createSinkHubPort = function() {
    this.sinkHub.createHubPort(this._onSinkHubPortCreated.bind(this));
  };

  Presenter.prototype._onSinkHubPortCreated = function(error, hubPort) {
    if (error) return this._onError(error);
    this.sinkHubPort = hubPort;
    this.connectSink();
  };

  Presenter.prototype.connectSource = function() {
    this._webRtcEndpoint.connect(this.sourceHubPort, this._onSourceConnected.bind(this));
  };

  Presenter.prototype._onSourceConnected = function(error) {
    if (error) return this._onError(error);
    this.sourceConnected = true;
    this._onHubPortConnected();
  };

  Presenter.prototype.connectSink = function() {
    this.sinkHubPort.connect(this._webRtcEndpoint, this._onSinkConnected.bind(this));
  };

  Presenter.prototype._onSinkConnected = function(error) {
    if (error) return this._onError(error);
    this.sinkConnected = true;
    this._onHubPortConnected();
  };

  Presenter.prototype._onHubPortConnected = function() {
    console.log('#### Hub ports created for Presenter', this.socket, this.sourceConnected, this.sinkConnected);
    this.sourceConnected && this.sinkConnected && this.onConnectMedia();
  };

  Presenter.prototype.stop = function() {
    this._webRtcEndpoint && this._webRtcEndpoint.release();
    this.sourceHubPort && this.sourceHubPort.release();
    this.sinkHubPort && this.sinkHubPort.release();
  };

  return extend(Kurento, Presenter);
});