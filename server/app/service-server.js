// A service stands by itself and allows connections via tcp.
$require('serviceServer', ['extend', 'routerDealer'], function(extend, RouterDealer) {
  var Service = function() {};

  Service.prototype.__templateType = 'service';


  return extend(RouterDealer, Service);
});