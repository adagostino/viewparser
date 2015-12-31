// Read in the server config file.
var config = require('./config.json'),
    credentials = require('./credentials.json');

// Get client js, then server js, then both js.
var getJs = function(type) {
  if (!config[type]) return;
  var js = config[type].js,
      rel = config[type].relative || '',
      base = config.relative || '';

  for (var i=0; i<js.length; i++) {
    var path = base + rel + js[i];
    require(path);
  }
};

var req = function(name, obj) {
  $require(name, function(){ return obj});
};

var getRequires = function() {
  var reqs = config.server.require || [];
  for (var i=0; i<reqs.length; i++) {
    req(reqs[i], require(reqs[i]));
  }
};

getJs('client');
// Add the config file as a dependency after getting the client b/c that's when $require will be available.
req('config', config);
req('credentials', credentials);
getRequires();
getJs('server');
getJs('both');