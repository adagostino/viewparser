$app.require('call', ['peerConnection', 'media'], function(PeerConnection, Media) {
  var Call = function() {};

  Call.prototype.init = function(opts) {
    this.socket = opts ? opts.socket : null;
    this.pc = new PeerConnection();
    this.pc.$on('iceCandidate', this._onIceCandidateGathered.bind(this));
    this.pc.$on('remoteStream', this._onRemoteStream.bind(this));
    this.socket.$on('message', this._onMessage.bind(this));
  };

  Call.prototype.connect = function() {
    // get the media, set it, create offer.
    this.pc.open();
    this.getMediaStreams(this._onMediaRequestSuccess, true);
  };

  Call.prototype.disconnect = function(fromRemote) {
    if (!fromRemote) {
      var message = {
        'type': 'disconnect'
      };
      this._send(message);
    }
    // close out the streams on the elements.
    this.$trigger('disconnect');
    this.pc.close();
  };

  Call.prototype._onMediaRequestSuccess = function(streams) {
    this.pc.setLocalStreams(streams);
    this.pc.createOffer(this._onOfferCreated.bind(this));
    this.$trigger('localStreams', this.pc.getLocalStreams())
  };

  Call.prototype._onOfferCreated = function(error, offerSdp) {
    if (error) return;
    var message = {
      'type': 'offer',
      'sdp': offerSdp
    };
    // send it.
    this._send(message);
  };

  Call.prototype._onRemoteStream = function(e, streams) {
    // set the remote streams to their tags.
    this.$trigger('remoteStreams', streams);
  };

  var _stripCandidate = function (candidate) {
    var fields = ['candidate', 'sdpMLineIndex', 'sdpMid'];
    var strippedCandidate = {};
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      strippedCandidate[field] = candidate[field];
    }
    return strippedCandidate;
  };

  Call.prototype._onIceCandidateGathered = function (e, candidate) {
    var message = {
      'type': 'icecandidate',
      'candidate': _stripCandidate(candidate)
    };
    // send it.
    this._send(message);
  };

  Call.prototype._onMessage = function(e, message) {
    // Messages from the server.
    this._log('Received message from server', message);
    switch(message.type) {
      case 'answer':
        this._onAnswerReceived(message.sdp);
        break;
      case 'icecandidate':
        this._onIceCandidateReceived(message.candidate);
        break;
      default:
        break;
    }
  };

  Call.prototype._onAnswerReceived = function(sdp) {
    this.pc.processAnswer(sdp);
  };

  Call.prototype._onIceCandidateReceived = function(candidate) {
    this.pc.addIceCandidate(candidate);
  };

  Call.prototype._send = function(message) {
    // send it through the websocket
    this.socket.emit(message);
  };

  return $app.extend(Media, Call);
});