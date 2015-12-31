$app.require('media', ['utils', 'model'], function(utils, Model) {

  var MEDIA = {
    'AUDIO': 'audio',
    'VIDEO': 'video'
  };

  var CONSTRAINTS = {
    'mandatory': {
      'audio': false,
      'video': false
    },
    'optional': {
      'audio': [], // fill these in with the google optional later
      'video': []
    }
  };

  var Media = function() {};

  // Getting and Setting Media Info.
  Media.prototype.getMediaInfo = function(callback) {
    MediaStreamTrack.getSources(this.$callback(callback));
  };

  Media.prototype._saveSource = function(type, sourceId) {
    utils.setLocal(type, sourceId);
  };

  Media.prototype._getSavedMedia = function(type, callback) {
    var mediaId = utils.getLocal(type);

    this.getMediaInfo(function(mediaInfos) {
      var media = utils.searchArray(mediaInfos, {'id': mediaId});
      callback(media, mediaId);
    }.bind(this));
  };

  Media.prototype.getAudioSource = function(callback) {
    this._getSavedMedia(MEDIA.AUDIO, this.$callback(callback));
  };

  Media.prototype.getVideoSource = function(callback) {
    this._getSavedMedia(MEDIA.VIDEO, this.$callback(callback));
  };

  Media.prototype.saveAudioSource = function(source) {
    this._saveSource(MEDIA.AUDIO, source ? source.id : source);
  };

  Media.prototype.saveVideoSource = function(source) {
    this._saveSource(MEDIA.VIDEO, source ? source.id : source);
  };

  // Getting streams.
  Media.prototype._getStream = function(type, callback) {
    this._getSavedMedia(type, function(media, mediaInfos) {
      media = media || {'kind': type, 'id': ''};
      this._getStreamFromMedia(media, callback);
    }.bind(this));
  };

  var _getConstraintsFromMedia = function(media) {
    var baseOptional = CONSTRAINTS.optional[media.kind] || [];
    var optional = [];
    // copy the constraints.
    for (var i=0; i<baseOptional.length; i++) {
      optional.push(baseOptional[i]);
    }
    // The most important constraint is the media id;
    if (media.id) {
      optional.unshift({'sourceId': media.id});
    }
    // constraints = {'audio': {'mandatory': {}, 'optional': []}, 'video': true}
    // If there are no optional constraints, then just set the constraint to true.
    var constraints = {};
    constraints[media.kind] = optional.length ? {'optional': optional} : true;

    return constraints;
  };

  Media.prototype._getStreamFromMedia = function(media, callback) {
    var constraints = _getConstraintsFromMedia(media);
    getUserMedia(constraints, function(stream) {
      callback(stream, media);
    }, function(error) {
      console.error('MEDIA: Getting stream from media id:', media.id, 'failed.', error);
      callback(null, media);
    });
  };

  Media.prototype.getAudioStream = function(callback) {
    this._getStream(MEDIA.AUDIO, this.$callback(callback));
  };

  Media.prototype.getVideoStream = function(callback) {
    this._getStream(MEDIA.VIDEO, this.$callback(callback));
  };

  Media.prototype.getMediaStreams = function(callback, getDefaults) {
    var ct = 0, // Get audio and video now.
        numStreams = 2,
        streams = [],
        $cb = this.$callback(callback);

    var promise = function(stream) {
      ct++;
      stream && streams.push(stream);
      ct === numStreams && $cb(streams);
    };

    getDefaults ? this._getStreamFromMedia({'kind': MEDIA.AUDIO}, promise) : this._getStream(MEDIA.AUDIO, promise);
    getDefaults ? this._getStreamFromMedia({'kind': MEDIA.VIDEO}, promise) : this._getStream(MEDIA.VIDEO, promise);
  };

  return $app.extend(Model, Media);
});