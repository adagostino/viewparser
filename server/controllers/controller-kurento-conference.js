$require('controllerKurentoConference', ['extend', 'controllerKurentoRoom'], function(extend, Room) {

  var Conference = function() {};

  Conference.prototype.init = function(opts) {
    // When first created, create the composite and an endpoint for the creator.
    this.mediaElements = ['WebRtcEndpoint', 'Composite'];
  };

  // will have arguments same as this.mediaElements.
  Conference.prototype.onMediaElementsCreated = function(webRtcEndpoint, composite) {
    console.log('Created media elements for Conference', composite);
    this.setHub(composite);
  };

  return extend(Room, Conference);
});