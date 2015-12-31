$require('controllerKurentoPresentation',
[
  'extend',
  'controllerKurentoParticipant',
  'controllerKurentoPresenter',
  'controllerKurentoRoom'
],
function(
  extend,
  Participant,
  Presenter,
  Room
) {

  var Presentation = function() {};

  Presentation.prototype.init = function() {
    // When first created, create the composite and an endpoint for the creator.
    this.mediaElements = ['WebRtcEndpoint', 'Composite', 'DispatcherOneToMany'];
  };

  Presentation.prototype.onMediaElementsCreated = function(webRtcEndpoint, composite, dispatcherOneToMany) {
    console.log('#### Media Elements Created for Presentation');
    this.sourceHub = composite;
    this.sinkHub = dispatcherOneToMany;
    // composite creates hubPort, dispatcher creates hubPort. composite connects to dispatcher, dispatcher sets its
    // hubport as the source.
    this.connectHubs();
  };

  Presentation.prototype.connectHubs = function() {
    console.log('#### Connecting Hubs for Presentation');
    var promises = [
      this._getHubPortPromise(this.sourceHub),
      this._getHubPortPromise(this.sinkHub)
    ];
    Promise.all(promises).then(this._onHubPortsCreated.bind(this)).catch(this._onError.bind(this));
  };

  Presentation.prototype._getHubPortPromise = function(hub) {
    return new Promise(function(resolve, reject) {
      hub.createHubPort(function(error, hubPort) {
        console.log('Hub port created for Presentation');
        return error ? reject(error) : resolve(hubPort);
      });
    });
  };

  Presentation.prototype._onHubPortsCreated = function(hubPorts) {
    console.log('#### Hub ports created for Presentation');
    this.sourceHubPort = hubPorts[0];
    this.sinkHubPort = hubPorts[1];
    this.connectSource();
  };

  Presentation.prototype.connectSource = function() {
    console.log('#### Connecting Source for Presentation');
    this.sourceHubPort.connect(this.sinkHubPort, this._onSourceConnected.bind(this));
  };

  Presentation.prototype._onSourceConnected = function(error) {
    console.log('#### On Source Connected for Presentation');
    if (error) return this._onError(error);
    this.connectSink();
  };

  Presentation.prototype.connectSink = function() {
    console.log('#### Connecting Sink For Presentation');
    this.sinkHub.setSource(this.sinkHubPort, this._onHubsConnected.bind(this));
  };

  Presentation.prototype._onHubsConnected = function(error) {
    if (error) return this._onError(error);
    console.log('On Hubs Connected')
    this.hasHubs = true;
    this._drainQueue();
  };

  Presentation.prototype.addPresenter = function(message) {
    // A presenter attaches source to the composite hubport and sink to the dispatcherOneToMany hubport.
    var presenter = new Presenter({
      'onMessage': this.onMessage,
      'socket': message.socket
    });
    this.maybeAddParticipant(presenter);
  };

  Presentation.prototype.addParticipant = function(message) {
    var participant = new Participant({
      'onMessage': this.onMessage,
      'socket': message.socket
    });
    this.maybeAddParticipant(participant);
  };

  Presentation.prototype.maybeAddParticipant = function(participant) {
    this._numParticipants++;
    this.hasHubs ? this._addParticipant(participant) : this._enqueueParticipant(participant);
    return participant;
  };

  Presentation.prototype._addParticipant = function(participant) {
    var isPresenter = !!participant.setHubs;
    console.log('Adding', isPresenter ? 'presenter' : 'participant','in', this.__className,'for socket', participant.socket);
    this._participants.controllers[participant.socket] = participant;
    isPresenter ? participant.setHubs(this.sourceHub, this.sinkHub) : participant.setHub(this.sinkHub);
    participant.setPipeline(this._pipeline);
    this._participants.length++;
  };

  return extend(Room, Presentation);
});