$require('serverTest',
[
  'extend',
  'server',
  'endpointApiTest',
  'endpointClient'
],
function(
  extend,
  Server,
  EndpointApiTest,
  EndpointClient
) {

  var routes = Array.prototype.slice.call(arguments, 2);

  var ServerTest = function() {};

  ServerTest.prototype.init = function() {
    this.routes = routes;
    this.publicRoutes = {
      '/client': './client'
    };
  };

  return extend(Server, ServerTest);
});