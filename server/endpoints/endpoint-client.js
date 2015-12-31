$require('endpointClient',
[
  'extend',
  'utils',
  'config',
  'express',
  'endpointBase'
],
function(
  extend,
  utils,
  config,
  express,
  EndpointBase
) {

  // Note: Remember to map the files to the 'client' folder.
  var clientConfig = {
    'base': config.site,
    'index': config.index,
    'js': config.client.js.map(function(item){ return config.client.relative + item;}),
    'css': config.client.css.map(function(item) { return config.client.relative + item;})
  };

  var EndpointClient = function(){};

  EndpointClient.prototype.init = function() {
    // Match anything that's not /client, /api, or /socket.io
    this.url = /^\/(?!client(\/|$)|api(\/|$)|socket\.io(\/|$))/;

    // Setup the static path.
    $app.start(clientConfig);
  };

  EndpointClient.prototype.get = function(req, res) {
    // Can connect to db singleton and make calls from here. Then send response. Or maybe have a controller. THE WORLD IS YOURS.
    // Note: Probably want to only render html if it's a bot/spider.
    this._genericMessage('get', req.originalUrl);
    this[req.fromBot() ? 'getRoute': 'getUnloadedApp'](req, res);
  };

  EndpointClient.prototype.getRoute = function(req, res) {
    var startTime = new Date().getTime();
    $app.loadRoute(req.originalUrl, function(html) {
      console.log('Retrieved page (', req.originalUrl, ') for spider in:', new Date().getTime() - startTime);
      html ? res.send(html) : res.send(404);
    });
  };

  EndpointClient.prototype.getUnloadedApp = function(req, res) {
    // Do checks for debug to load minified js or full for config.
    var startTime = new Date().getTime();
    var cb = function(html) {
      console.log('Retrieved unloaded app in:', new Date().getTime() - startTime);
      this.unloadedApp = html;
      res.send(html);
    }.bind(this);

    this.unloadedApp ? cb(this.unloadedApp) : $app.getUnloaded(cb);
  };

  return extend(EndpointBase, EndpointClient)
});

