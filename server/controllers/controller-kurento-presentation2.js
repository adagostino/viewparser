$require('controllerKurentoPresentation',
[
  'extend',
  'controllerKurentoConference',
  'controllerKurentoBroadcast'
],
function(
  extend,
  Conference,
  Broadcast
) {

  var Presentation = function() {};

  Presentation.prototype.init = function() {
    // When first created, create the composite and an endpoint for the creator.
    //this.mediaElements = ['WebRtcEndpoint', 'DispatcherOneToMany'];
    this._super.apply(this, arguments);
    // Create the conference for the presenters to be added to.
    this.conference = new Conference({
      'onMessage': this.onMessage
    });
  };

  Presentation.prototype.onMediaElementsCreated = function(webRtcEndpoint, dispatcherOneToMany) {
    console.log(this._pipeline);
    this.conference.setPipeline(this._pipeline);
    //this.conference.setClient(this._client);
    this.setHub(dispatcherOneToMany);

    this.conference.$on('mediaConnected', this._connectConference.bind(this));
  };

  Presentation.prototype._connectConference = function() {
    this.hub.createHubPort(this._onHubPortCreated.bind(this));
  };

  Presentation.prototype._onHubPortCreated = function(error, hubPort) {
    if (error) return this._onError(error);
    console.log('connecting _conferenceHubPort to this.conference.hub');
    this._conferenceHubPort = hubPort;
    //this.conference.hub.connect(this._conferenceHubPort, this._onConferenceConnected.bind(this));
    this._conferenceHubPort.connect(this.conference.hub, this._onHubPortConnected.bind(this));
  };

  Presentation.prototype._onHubPortConnected = function(error) {
    if (error) return this._onError(error);
    console.log('connecting presetation hub to conferenceHubPort');
    this.conference.hub.connect(this._conferenceHubPort, this._onConferenceConnected.bind(this));
  };

  Presentation.prototype._onConferenceConnected = function(error) {
    if (error) return this._onError(error);
    console.log('setting the hub source to the conferenceHubPort');
    this.hub.setSource(this._conferenceHubPort, this._onConferenceSetAsSource.bind(this));
  };

  Presentation.prototype._onConferenceSetAsSource = function(error) {
    if (error) return this._onError(error);
    this._drainQueue();
  };

  Presentation.prototype.addPresenter = function(message) {
    this.conference.addParticipant(message);
  };

  Presentation.prototype.stop = function(message) {
    var participant = this.getParticipant(message.socket) || this.conference.getParticipant(message.socket);
    if (!participant) return;
    participant.stop();
  };

  return extend(Broadcast, Presentation);
});