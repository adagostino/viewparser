$require('socketBase', ['extend', 'config','socket'], function(extend, config, Socket) {

  var SocketBase = function(){};

  SocketBase.prototype.__beforeInit = function() {
    this._super.apply(this, arguments);
    // Should always spin up two so that if one goes down, the other can handle things.
    if (typeof config.processes.sockets === 'number') this.numProcesses = config.processes.sockets;
    if (this.numProcesses === 0) this.port = false;
  };


  return extend(Socket, SocketBase);
});

