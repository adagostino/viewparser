$require('controllerKurento', ['extend', 'config', 'controllerServer'], function(extend, config, Controller) {
  // public: createMedia, onMediaElementsCreated, connectMediaElements


  var kurentoClient = require('kurento-client');

  var Kurento = function() {};

  Kurento.prototype.__beforeInit = function(opts) {
    this._super.apply(this, arguments);
    // opts {client, offer, onMessage}
    this._options = opts || {};
    this._candidatesQueue = [];
    this._gatheredCandidates = [];
    this.mediaElements = [];
    this.onMessage = opts.onMessage;
    this.socket = opts.socket;
  };

  Kurento.prototype.__afterInit = function() {
    this._options.client && this.setClient(this._options.client);
  };

  Kurento.prototype.setClient = function(client) {
    this._client = client;
    this.createMedia();
  };

  Kurento.prototype.getClient = function(callback) {
    kurentoClient(config.kurento.ws, function(error, client) { this._onClient(error, client, callback);}.bind(this));
  };

  Kurento.prototype._onClient = function(error, client, callback) {
    if (error) return this._onError(error);
    callback(client);
  };

  // Public method to create media. Subclass onMediaElementsCreated to call connectMediaElements
  Kurento.prototype.createMedia = function() {
    // The arguments of this are the media elements you'd like created.
    // So you set them first so you can refer to them later.
    this._mediaElementsToCreate = arguments.length ? Array.prototype.slice.call(arguments) : this.mediaElements;
    // Then create the pipeline. Once it's created, it'll create the media elements you listed above.
    this._createPipeline();
  };

  Kurento.prototype._createPipeline = function() {
    console.log('creating pipeline for', this.__className);
    this._client.create('MediaPipeline', this._onPipelineCreated.bind(this));
  };

  Kurento.prototype.setPipeline = function(pipeline) {
    console.log('setting pipeline for', this.__className);
    this._onPipelineCreated(null, pipeline);
  };

  Kurento.prototype._onPipelineCreated = function(error, pipeline) {
    if (error) this._onError(error);
    this._pipeline = pipeline;
    this._mediaElementsToCreate = this.mediaElements;
    this.createMediaElements();
  };

  Kurento.prototype.createMediaElements = function() {
    // add elements you want to create after the pipeline.
    console.log('Creating media elements for', this.__className);
    var mediaElements = this._mediaElementsToCreate;
    var pipeline = this._pipeline;
    var promises = [];
    for (var i=0; i<mediaElements.length; i++) {
      promises.push(new Promise(function(resolve, reject) {
        pipeline.create(mediaElements[i], function(error, mediaElement) {
          if (error) {
            console.log('Got error while creating media elements', error);
            return reject(error);
          }
          return resolve(mediaElement);
        });
      }));
    }
    this._executeCreateMediaPromises(promises);
  };

  Kurento.prototype._executeCreateMediaPromises = function(promises) {
    Promise.all(promises).then(this._setMediaElementsCreated.bind(this)).catch(this._onError.bind(this));
  };

  Kurento.prototype.onMediaElementsCreated = function() {
    // Leave this open for subclassing. The first will always be the webrtc endpoint, though.
    //this.connectMediaElements.apply(this, arguments);
  };

  Kurento.prototype._setMediaElementsCreated = function(mediaElements) {
    console.log('Setting media elements for', this.__className);
    this.mediaElementsCreated = mediaElements; // Array.prototype.slice.call(arguments);
    //console.log(this.mediaElementsCreated);
    var webrtcEndpoint = mediaElements[0];
    var maxBw = 4000;
    var minBw = 3000;
    var cb = function(error) {
      //if (error) return this._onError(error);
      console.log('callback for setting media elements for', this.__className);
      /*
      for (var mediaElement in this.mediaElementsCreated) {
        mediaElement.setOutputBitrate && mediaElement.setOutputBitrate(1000*(maxBw - minBw)/2.0);
      }
      */
      this._webRtcEndpoint = webrtcEndpoint;
      this._drainCandidateQueue();
      this.onMediaElementsCreated.apply(this, this.mediaElementsCreated);

    }.bind(this);

    var canApplyBandwidth = webrtcEndpoint && webrtcEndpoint.setMaxVideoSendBandwidth;
    var fns = {
      'setMinVideoSendBandwidth': minBw,
      'setMaxVideoSendBandwidth': maxBw,
      'setMaxVideoRecvBandwidth': maxBw
    };

    if (canApplyBandwidth) {
      var promises = [];
      for (var fn in fns) {
        promises.push(new Promise(function (resolve, reject) {
          webrtcEndpoint[fn](fns[fn], function(error) {
            console.log('got an error here?', error, webrtcEndpoint);
            return error ? reject(error) : resolve();
          });
        }));
      }
      Promise.all(promises).then(cb).catch(cb);
    } else {
      cb();
    }
  };

  Kurento.prototype._drainCandidateQueue = function() {
    for (var i=0; i<this._candidatesQueue.length; i++) {
      this.addIceCandidate(this._candidatesQueue[i]);
    }
    this._candidatesQueue = [];
  };

  Kurento.prototype.connectMediaElements = function() {
    // Leave this open for subclassing. The arguments will be the same as you passed in to create.

  };

  Kurento.prototype.onConnectMedia = function() {
    console.log('')
    this.mediaConnected = true;
    this.$trigger('mediaConnected');
    this._webRtcEndpoint.on('OnIceCandidate', this._onIceCandidateGathered.bind(this));
    // Process the offer.
    this._offer && this.processOffer();
  };

  Kurento.prototype._onAskedToGatherCandidates = function(error) {
    if (error) return this._onError(error);
  };

  Kurento.prototype.setOffer = function(message) {
    var offer = message.data.sdp;
    this._offer = offer;
    this._webRtcEndpoint && this.processOffer();
  };

  Kurento.prototype.processOffer = function() {
    this._drainCandidateQueue();
    this._webRtcEndpoint.processOffer(this._offer, this._onOfferProcessed.bind(this));
    this._webRtcEndpoint.gatherCandidates(this._onAskedToGatherCandidates.bind(this));
  };

  Kurento.prototype._onOfferProcessed = function(error, sdpAnswer) {
    if (error) return this._onError(error);
    this.onAnswer(sdpAnswer);
  };

  Kurento.prototype.onAnswer = function(sdpAnswer) {
    this.sendMessage({
      'type': 'answer',
      'sdp': sdpAnswer
    });
  };

  Kurento.prototype._onIceCandidateGathered = function(event) {
    var candidate = kurentoClient.register.complexTypes.IceCandidate(event.candidate);
    this._gatheredCandidates.push(candidate);
    this.sendMessage({'type': 'icecandidate', 'candidate': candidate});
  };

  Kurento.prototype.addIceCandidate = function(candidate) {
    // leave this open for subclassing. Most likely it will always be the webRtcEndpoint.
    this._webRtcEndpoint && this._webRtcEndpoint.addIceCandidate(candidate);
  };

  Kurento.prototype.onIceCandidateReceived = function(message) {
    var candidate = message.data.candidate;
    var iceCandidate = kurentoClient.register.complexTypes.IceCandidate(candidate);
    this._webRtcEndpoint ? this.addIceCandidate(iceCandidate) : this._candidatesQueue.push(iceCandidate);
  };

  Kurento.prototype.stop = function() {
    this._pipeline && this._pipeline.release();
  };

  Kurento.prototype._onError = function(error) {
    console.error('Kurento Error', error);
    this.stop();
    this.sendMessage({'type': 'error', 'error': error});
  };

  Kurento.prototype.sendMessage = function(msg) {
    console.log('Sending Message', this.__className, msg);
    this.onMessage && this.onMessage({
      'data': msg,
      'socket': this.socket
    });
  };


  return extend(Controller, Kurento);
});