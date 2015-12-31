$app.require('directive-video-call', ['utils', 'call'], function(utils, Call) {
  var VideoCall = function(){};

  VideoCall.prototype.init = function() {
    // If it's on the server, then bail out.
    if (!utils.isClient()) return;

    // For now just assume webrtc support -- maybe put it in the peer connection.
    this._setupCall();
    this._connectCall();

    this.$on('unload', this.$callback(this._onUnload));
  };

  VideoCall.prototype.$onRender = function() {
    // Get the local and remote elements once this view has been rendered.
    this.$el = $(this.el);
    this._media = {
      'local': {
        'audio': this.$el.find('.local-audio')[0],
        'video': this.$el.find('.local-video')[0]
      },
      'remote': {
        'audio': this.$el.find('.remote-audio')[0],
        'video': this.$el.find('.remote-video')[0]
      }
    };
  };

  VideoCall.prototype._setupCall = function() {
    this._call = new Call({
      'socket': this.socket
    });
    this._call.$on('localStreams', this.$callback(this._onLocalStreams));
    this._call.$on('remoteStreams', this.$callback(this._onRemoteStreams));
    this._call.$on('disconnect', this.$callback(this._onDisconnect));
    this.socket.$on('disconnect', function() {
      this._call.disconnect();
    }.bind(this));

  };

  VideoCall.prototype._connectCall = function() {
    this._call.connect();
  };

  VideoCall.prototype._onLocalStreams = function(e, streams) {
    this._log('Attaching local streams', streams);
    this._localStreams = streams;
    // Attach the media.
    var audio = this._media.local.audio,
        video = this._media.local.video;
    //attachMediaStream(audio, streams.audio);
    attachMediaStream(video, streams.video);
    //audio.play();
    video.play();
  };

  VideoCall.prototype._onRemoteStreams = function(e, streams) {
    this._log('Attaching remote streams', streams);
    var video = this._media.remote.video;
    attachMediaStream(video, streams.video);
    video.play();
  };

  VideoCall.prototype._onUnload = function() {
    this._call.disconnect();
  };

  VideoCall.prototype._onDisconnect = function() {

  };

  return $app.addDirective({
    'directive': VideoCall,
    'template': 'client/templates/directives/directive-video-call.html',
    '$scope': {
      'socket': 'socket' // one-way binding from parent to child.
    }
  })

});