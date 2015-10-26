// Read in the server config file.
var config = require('./config.json');
// http://stackoverflow.com/questions/1801160/can-i-use-jquery-with-node-js
// http://developpeers.com/blogs/fix-for-homebrew-permission-denied-issues
var jsdom = require("jsdom").jsdom;
var doc = jsdom();
var window = doc.defaultView;
global.$ = require('jquery')(window);
$.support.cors = true;
global.document = window.document;
global.XMLHttpRequest = window.XMLHttpRequest;

var express = require('express');
var app = express();

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});


// Now read in all of the dependencies for the server.
config.client.js = config.client.js.map(function(item){
  return config.client.relative + item;
});

var serverJs = config.server.js;
var js = [].concat(config.client.js, config.server.js);

for (var i=0; i<js.length; i++) {
  require(config.server.relative + js[i]);
}
// Now create the config object for the client side of the app.
var clientConfig = {
  'base': config.site,
  'index': config.index,
  'js': config.client.js
};

app.use('/client', express.static('./client'));

app.get('/api/test', function(req, res) {
  res.send('awesome');
});

app.get(/^\/(?!client(\/|$)|api(\/|$))/,function(req, res){
  var startTime = new Date().getTime();
  console.log('Received Request', req.originalUrl);
  $app.loadRoute(req.originalUrl, function(html) {
    console.log('Sent Request', new Date().getTime() - startTime);
    //res.send(404);
    html ? res.send(html) : res.send(404);
  });
});

setTimeout(function(){
  $app.start(clientConfig);
}, 0);







