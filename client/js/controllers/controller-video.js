$app.require('controller-video', ['modelSocket'], function(Socket) {
  var VideoController = function() {};

  VideoController.prototype.init = function() {
    // Probably set up the websocket here, then pass to the directives.
    this.socket = new Socket();
    console.log(this.socket);
    this.$on('unload', this.$callback(this._onUnload));
  };

  VideoController.prototype._onUnload = function() {
    this._log('unload called');
    this.socket.disconnect();
  };

  return $app.addController({
    'controller': VideoController
  });
});