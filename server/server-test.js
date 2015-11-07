$require('serverTest', ['extend', 'server', 'endpointHome'], function(extend, Server, EndpointHome) {

  var routes = Array.prototype.slice.call(arguments, 2);

  var ServerTest = function() {};

  ServerTest.prototype.init = function() {
    this.routes = routes;
  };

  return extend(Server, ServerTest);
});