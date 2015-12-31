$require('endpointBase', ['extend', 'config', 'endpoint'], function(extend, config, Endpoint) {

  var EndpointBase = function(){};

  EndpointBase.prototype.__beforeInit = function() {
    this._super.apply(this, arguments);
    // Should always spin up two so that if one goes down, the other can handle things.
    this.numProcesses = config.processes.endpoints || 0;
    if (!this.numProcesses) this.port = false;
  };


  return extend(Endpoint, EndpointBase)
});

