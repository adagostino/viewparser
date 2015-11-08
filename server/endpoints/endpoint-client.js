$require('endpointClient',
[
  'extend',
  'utils',
  'config',
  'express',
  'endpoint'
],
function(
  extend,
  utils,
  config,
  express,
  Endpoint
) {

  var clientConfig = {
    'base': config.site,
    'index': config.index,
    'js': config.client.js
  };

  var EndpointClient = function(){};

  EndpointClient.prototype.init = function() {
    this.url = /^\/(?!client(\/|$)|api(\/|$))/;
    // Setup the static path.
    this.app.use('/client', express.static('./client'));
    $app.start(clientConfig);
  };

  EndpointClient.prototype.get = function(req, res) {
    var startTime = new Date().getTime();
    // Can connect to db singleton and make calls from here. Then send response. Or maybe have a controller. THE WORLD IS YOURS.
    this._genericMessage('get', req.originalUrl);
    $app.loadRoute(req.originalUrl, function(html) {
      console.log('Sent Request', new Date().getTime() - startTime);
      html ? res.send(html) : res.send(404);
    });
  };


  return extend(Endpoint, EndpointClient)
});

