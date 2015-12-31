$require('controllerKurentoPresentation',
[
  'extend',
  'controllerKurentoParticipant',
  'controllerKurentoConference'
],
function(
  extend,
  Participant,
  Conference
) {

  var Presentation = function() {};

  Presentation.prototype.addPresenter = function(message) {
    // A presenter attaches source to the composite hubport and sink to the dispatcherOneToMany hubport.
    this.addParticipant(message, true);
  };

  Presentation.prototype.addParticipant = function(message, isPresenter) {
    this._super(message, !!!isPresenter);
  };

  return extend(Conference, Presentation);
});