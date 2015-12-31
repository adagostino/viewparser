$app.require('peerConnection', ['utils', 'listener'], function(utils, Listener) {

  var TURNSERVERS = [
    'turn.naar.io?transport=udp',
    'turn.naar.io?transport=tcp'
  ];

  var CONFIGURATION = {};

  var CONNECTION_STATES = {
    'READY': 'ready',
    'CONNECTED': 'connected',
    'FAILED': 'failed'
  };

  var PeerConnection = function() {};

  PeerConnection.prototype.init = function(options) {
    // TODO(TJ): Check for webrtc support here.
    this._setConnectionState(CONNECTION_STATES.READY);
  };

  PeerConnection.prototype.open = function() {
    this._createPC();
  };

  PeerConnection.prototype._createPC = function() {
    if (this._pc) return;

    this._gatheringDone = false;
    this._candidateQueue = [];
    this._candidateReceivedCt = 0;
    this._candidateGatheredCt = 0;

    this._log('Creating Peer Connection with configuration:', CONFIGURATION);
    this._pc = new RTCPeerConnection(CONFIGURATION);
    this._pc.oniceconnectionstatechange = this.$callback(this._onIceConnectionStateChange);
    this._pc.onsignalingstatechange = this.$callback(this._onSignalingStateChange);
    this._pc.onicecandidate = this.$callback(this._onIceCandidate);
  };

  PeerConnection.prototype.close = function() {
    if (!this._pc) return;
    this._log('Closing Connection');
    try {
      this._pc.getLocalStreams().forEach(_stopStream);
      this._pc.signalingState !== 'closed' && this._pc.close();
      this._pc = null;
    } catch(err) {
      this._warn('Exception disposing webrtc peer', err);
    }
    this._candidateReceivedCt = 0;
    this._candidateGatheredCt = 0;
    this._candidateQueue = [];
    this._gatheringDone = false;
  };

  PeerConnection.prototype._onIceConnectionStateChange = function(e) {
    var state = e.target.iceConnectionState;
    this._log('Ice Connection State', state);
    switch(state) {
      case 'connected':
        this._setConnectionState(CONNECTION_STATES.CONNECTED);
        break;
      case 'completed':
        break;
      case 'disconnected':
        //this._setConnectionState(CONNECTION_STATES.READY);
        break;
      case 'failed':
        this._setConnectionState(CONNECTION_STATES.FAILED);
        break;
      case 'closed':
        this._setConnectionState(CONNECTION_STATES.READY);
        break;
    }
    this.iceConnectionState = state;
  };

  PeerConnection.prototype._onSignalingStateChange = function(e) {
    var state = this._pc ? this._pc.signalingState : 'closed';
    this._log('Signaling state change:', state);
    if (state === 'stable') {
      // drain the queue.
      this._drainIceQueue();
    }
  };

  PeerConnection.prototype._drainIceQueue = function() {
    while (this._candidateQueue.length) {
      var candidate = this._candidateQueue.shift();
      this._addIceCandidate(candidate);
    }
  };

  // This is the gathering (local) of ice candidates.
  PeerConnection.prototype._onIceCandidate = function(e) {
    var candidate = e.candidate;
    if (candidate) {
      this._log('Ice Candidate Gathered (#', this._candidateGatheredCt++ ,')', candidate);
      this.$trigger('iceCandidate', candidate);
      this._gatheringDone = false;
    } else {
      this.$trigger('iceCandidateGatheringDone');
      this._gatheringDone = true;
      this._log('Ice Candidate gathering finished');
    }
  };

  // This is the applying of ice candidates directly to the peer connection (private)
  PeerConnection.prototype._addIceCandidate = function(candidate) {
    var success = function() { this._onAddIceCandidateSuccess(candidate);};
    var error = function() { this._onAddIceCandidateError(candidate);};
    this._pc.addIceCandidate(candidate, this.$callback(success), this.$callback(error));
  };

  PeerConnection.prototype._onAddIceCandidateSuccess = function(candidate) {
    this._log('Successfully added candidate', candidate.candidate);
  };

  PeerConnection.prototype._onAddIceCandidateError = function(candidate) {
    this._error('Error adding candidate', candidate.candidate);
  };

  // This is the applying of remote ice candidates and called from onMessage.
  PeerConnection.prototype.addIceCandidate = function(iceCandidate) {
    // console.log(iceCandidate);
    // iceCandidate = iceCandidate.candidate || iceCandidate;
    var candidate = new RTCIceCandidate(iceCandidate);
    this._log('ICE candidate (', this._candidateReceivedCt++ ,') Received', candidate);
    switch(this._pc.signalingState) {
      case 'closed':
        this._error('Error adding Ice Candidate -- PeerConnection object is closed.');
        break;
      case 'stable':
        // Only add candidates if the signaling state is stable and we've set the remote description.
        // Otherwise fall through.
        if (this._pc.remoteDescription) {
          this._addIceCandidate(candidate);
          break;
        }
        /* falls through */
      default:
        this._candidateQueue.push(candidate);
        break;
    }
  };

  // Process Offer/Answer
  PeerConnection.prototype._processOfferAnswer = function(type, sdp, callback) {
    this._log('SDP', type, 'received', sdp);
    var $cb = this.$callback(callback);
    var offerAnswer = new RTCSessionDescription({
      'type': type,
      'sdp': sdp
    });

    if (this._pc.signalingState === 'closed') {
      this._error('PeerConnection is closed');
      return $cb('PeerConnection is closed');
    }

    var success = function() { this._setRemoteDescriptionSuccess(offerAnswer, $cb, type === 'answer'); }.bind(this);
    var error = function() { this._setRemoteDescriptionError(offerAnswer, $cb);}.bind(this);

    this._pc.setRemoteDescription(offerAnswer, success, error);
  };

  // Offer

  PeerConnection.prototype.processOffer = function(sdpOffer, callback) {
    this._processOfferAnswer('offer', sdpOffer, callback);
  };

  PeerConnection.prototype.createOffer = function(callback) {
    this._log('Creating offer');
    var $cb = this.$callback(callback);
    var success = function(offer) { this._createOfferSuccess(offer, $cb); }.bind(this);
    var error = function() { this._createOfferError($cb); }.bind(this);
    this._pc.createOffer(success, error);
  };

  PeerConnection.prototype._createOfferSuccess = function(offer, callback) {
    this._log('Successfully created offer (', offer.type, '):', offer.sdp);
    // TODO(TJ): Add simulcast stuff (https://github.com/Kurento/kurento-utils-js/blob/master/lib/WebRtcPeer.js)
    var success = function() { this._setLocalDescriptionSuccess(offer, callback); }.bind(this);
    var error = function() { this._setLocalDescriptionError(offer, callback); }.bind(this);
    this._pc.setLocalDescription(offer, success, error);
  };

  PeerConnection.prototype._createOfferError = function(error, callback) {
    this._error('Error creating offer', error.toString());
    callback('Error creating offer');
  };

  PeerConnection.prototype._setLocalDescriptionSuccess = function(offer, callback) {
    this._log('Successfully set local description (', offer.type, '):', offer.sdp);
    callback(null, offer.sdp);
  };

  PeerConnection.prototype._setLocalDescriptionError = function(offer, callback) {
    this._error('Error setting local description (', offer.type, '):', offer.sdp);
    callback('Error setting local description');
  };

  PeerConnection.prototype._setRemoteDescriptionSuccess = function(offer, callback, processingAnswer) {
    this._log('Successfully set remote description (', offer.type, '):', offer.sdp);
    // set the remote video.
    this._setRemoteStreams();
    // if you are processing an answer, then don't create one -- just exit early.
    if (processingAnswer) {
      return callback(null, offer.sdp);
    }
    // Now generate the answer.
    var success = function(answer) { this._createAnswerSuccess(answer, callback); }.bind(this);
    var error = function() { this._createAnswerError(callback); }.bind(this);
    this._pc.createAnswer(success, error);
  };

  PeerConnection.prototype._setRemoteDescriptionError = function(offer, callback) {
    this._error('Error setting remote description (', offer.type, '):', offer.sdp);
    callback('Error setting remote description');
  };

  // Answer.
  PeerConnection.prototype.processAnswer = function(sdpAnswer, callback) {
    this._processOfferAnswer('answer', sdpAnswer, callback);
  };

  PeerConnection.prototype._createAnswerSuccess = function(answer, callback) {
    this._log('Successfully created answer (', answer.type, '):', answer.sdp);
    var success = function() { this._setLocalDescriptionSuccess(answer, callback); }.bind(this);
    var error = function() { this._setLocalDescriptionError(answer, callback); }.bind(this);
    this._pc.setLocalDescription(answer, success, error);
  };

  PeerConnection.prototype._createAnswerError = function(callback) {
    this._error('Error creating answer', error.toString());
    callback('Error creating answer');
  };


  // Streams.
  PeerConnection.prototype._setStream = function(type, stream) {
    var tracks = stream.getTracks();
    for (var i=0; i<tracks.length; i++) {
      var track = tracks[i];
      var typeStream = '_' + type + 'Stream';
      if (track.kind === 'video') {
        typeStream += 'Video';
        // set enabled for video here.
      } else if (track.kind === 'audio') {
        typeStream += 'Audio';
        // set enbabled for audio here.
      }
      _stopStream(this[typeStream]);
      this[typeStream] = stream;
    }

  };

  PeerConnection.prototype._setLocalStream = function(stream) {
    this._setStream('local', stream);
    this._pc.addStream(stream);
  };

  PeerConnection.prototype._setRemoteStream = function(stream) {
    this._setStream('remote', stream);
  };

  PeerConnection.prototype.setLocalStreams = function(streams) {
    if (!streams) return;
    streams = utils.isArray(streams) ? streams : [streams];
    for (var i=0; i<streams.length; i++) {
      this._setLocalStream(streams[i]);
    }
  };

  PeerConnection.prototype._setRemoteStreams = function() {
    var streams = this._pc.getRemoteStreams();
    for (var i=0; i<streams.length; i++) {
      this._setRemoteStream(streams[i]);
    }
    this.$trigger('remoteStream', this.getRemoteStreams());
  };

  PeerConnection.prototype._getStreams = function(type) {
    var typeStream = '_' + type + 'Stream';
    return {
      'audio': this[typeStream + 'Audio'],
      'video': this[typeStream + 'Video']
    };
  };

  var _stopStream = function(stream) {
    stream && stream.getTracks().forEach(_stopTrack);
  };

  var _stopTrack = function(track) {
    track.stop && track.stop();
  };

  PeerConnection.prototype.getLocalStreams = function() {
    return this._getStreams('local');
  };

  PeerConnection.prototype.getRemoteStreams = function() {
    return this._getStreams('remote');
  };

  PeerConnection.prototype._setConnectionState = function(state) {
    this.connectionState = state;
  };

  // Configuration builder.
  var _buildIceServer = function(url, type, username, credential) {
    type = type || 'stun';
    url = type + ':' + url;
    credential = credential ? credenctial : username;
    var iceServer = {
      'urls': url
    };
    if (username) iceServer.username = username;
    if (credential) iceServer.credential = credential;
    return iceServer;
  };

  var _buildConfig = function() {
    var iceServers = [];
    // First build the stun servers.
    for (var i=0; i<5; i++) {
      var url = 'stun' + (i ? i : '') + '.l.google.com:19302';
      iceServers.push(_buildIceServer(url));
    }
    // Now build the turn servers.
    for (var i=0; i<TURNSERVERS.length; i++) {
      var url = TURNSERVERS[i];
      iceServers.push(_buildIceServer(url, 'turn', 'naarnia'));
    }
    CONFIGURATION.iceServers = iceServers;
  };

  _buildConfig();

  return $app.extend(Listener, PeerConnection);
});