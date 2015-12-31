// Read in the server config file.
require('./readConfig.js');
// Start the Kurento service
var Kurento = $class('serviceKurento');
var ks = new Kurento();

var soc = $class('socketKurento');
var s = new soc();

//return;
// Now start up the server.
var ServerTest = $class('serverTest');
var s = new ServerTest();
