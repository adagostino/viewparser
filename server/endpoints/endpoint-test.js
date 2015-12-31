$require('endpointTest', ['extend', 'utils', 'endpointBase'], function(extend, utils, EndpointBase) {

  var EndpointTest = function(){};

  EndpointTest.prototype.init = function() {
    this.url = '/test';
  };

  EndpointTest.prototype.get = function(req, res) {
    // Can connect to db singleton and make calls from here. Then send response. Or maybe have a controller. THE WORLD IS YOURS.
    this._genericMessage('get');
    res.send('<div>Test Bruh!!</div>');
  };


  return extend(EndpointBase, EndpointTest)
});

