$require('serverTest',
[
  'extend',
  'config',
  'server',
  //'endpointApiTest',
  'endpointClient',
  //'socketKurento'
],
function(
  extend,
  config,
  Server,
  //EndpointApiTest,
  EndpointClient
  //SocketKurento
) {

  var routes = Array.prototype.slice.call(arguments, 3, arguments.length - 1);
  var sockets = Array.prototype.slice.call(arguments, arguments.length - 1);

  var ServerTest = function() {};

  ServerTest.prototype.init = function() {
    this.routes = routes;
    this.sockets = sockets;
    this.publicRoutes = {
      '/client': './client'
    };
    if (typeof config.processes.servers === 'number') this.numProcesses = config.processes.servers;
    // Don't set port to false here.
  };

  return extend(Server, ServerTest);
});