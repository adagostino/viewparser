$require('endpointHome', ['extend', 'utils', 'endpoint'], function(extend, utils, Endpoint) {

  var EndpointHome = function(){};

  EndpointHome.prototype.init = function() {
    this.url = '/';
  };

  EndpointHome.prototype.get = function(req, res) {
    // Can connect to db singleton and make calls from here. Then send response. Or maybe have a controller. THE WORLD IS YOURS.
    this._genericMessage('get');
    res.send('<div>Welcome Home</div>');
  };


  return extend(Endpoint, EndpointHome)
});

