$require('endpointApiTest', ['extend', 'utils', 'endpoint'], function(extend, utils, Endpoint) {

  var EndpointApiTest = function(){};

  EndpointApiTest.prototype.init = function() {
    this.url = '/api/test';
  };

  EndpointApiTest.prototype.get = function(req, res) {
    // Can connect to db singleton and make calls from here. Then send response. Or maybe have a controller. THE WORLD IS YOURS.
    this._genericMessage('get');
    res.send('Success');
  };


  return extend(Endpoint, EndpointApiTest)
});

