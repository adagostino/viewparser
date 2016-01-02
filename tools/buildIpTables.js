// https://www.linode.com/docs/security/securing-your-server
// sudo apt-get install iptables-persistent

var _basePath = '/tmp/';
var confFile = 'v4';

var BuildHelper = require('./helpers/buildHelper.js'),
    cp = require('child_process'),
    config = require('../config.json'),
    credentials = require('../credentials.json');

var ipHelper = new BuildHelper(_basePath, confFile);

// Overwrite the createConfFile fn.
// https://www.linode.com/docs/security/securing-your-server

ipHelper.createConfFile = function(node) {
  var contents = [];
  contents.push('*filter');
  contents.push('# Allow all loopback (lo0) traffic and reject traffic to localhost that does not originate from lo0.');
  contents.push('-A INPUT -i lo -j ACCEPT');
  contents.push('-A INPUT ! -i lo -s 127.0.0.0/8 -j REJECT');

  contents.push('# Allow ping.');
  contents.push('-A INPUT -p icmp -m state --state NEW --icmp-type 8 -j ACCEPT');

  contents.push('# Allow SSH connections');
  contents.push('-A INPUT -p tcp --dport 22 -m state --state NEW -j ACCEPT');

  contents.push('# Allow HTTP and HTTPS connections from anywhere(the normal ports for web servers).');
  contents.push('-A INPUT -p tcp --dport 80 -m state --state NEW -j ACCEPT');
  contents.push('-A INPUT -p tcp --dport 443 -m state --state NEW -j ACCEPT');

  // open up ports form the config file.
  contents.push('# Open up ports for the application');
  openPorts(contents);

  contents.push('# Allow inbound traffic from established connections. This includes ICMP error returns.');
  contents.push('-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT');

  contents.push('# Log what was incoming but denied (optional but useful).');
  contents.push('-A INPUT -m limit --limit 5/min -j LOG --log-prefix "iptables_INPUT_denied: " --log-level 7');

  contents.push('# Reject all other inbound.');
  contents.push('-A INPUT -j REJECT');

  contents.push('# Log any traffic which was sent to you for forwarding (optional but useful).');
  contents.push('-A FORWARD -m limit --limit 5/min -j LOG --log-prefix "iptables_FORWARD_denied: " --log-level 7');

  contents.push('# Reject all traffic forwarding.');
  contents.push('-A FORWARD -j REJECT');

  contents.push('COMMIT\n');
  return contents.join('\n');
};

var openPorts = function(contents) {
  var portRanges = [];
  // First get the ports for the application.
  portRanges.push(getPortRangeObj(config.ports.range.min, config.ports.range.max));
  // Now get the redis ports.
  portRanges.push(getPortRangeObj(config.redis.startPort, config.redis.startPort + 2*config.redis.numPorts - 1));
  // Now get the mongo port.
  portRanges.push(getPortRangeObj(config.mongo.port));
  // Now get the public turn server port.
  portRanges.push(getPortRangeObj(config.turn.port));
  // Now get the media ports for the turn server.
  portRanges.push(getPortRangeObj(config.turn.range.min, config.turn.range.max)); // could just open up udp

  for (var i=0; i<portRanges.length; i++) {
    var ports = portRanges[i];
    for (var j=0; j<ports.protos.length; j++) {
      var proto = ports.protos[j];
      contents.push(getOpenPortCommand(proto, ports.range));
    }
  }
};

var getPortRangeObj = function(min, max, proto) {
  proto = (proto || 'all').toLowerCase();
  var protos;
  switch(proto) {
    case 'tcp':
      protos = ['tcp'];
      break;
    case 'udp':
      protos = ['udp'];
      break;
    default:
      protos = ['tcp', 'udp'];
      break;
  }
  var range = {
    'min': min
  };
  if (max) range.max = max;
  return {
    'protos': protos,
    'range': range
  }
};

var getOpenPortCommand = function(proto, range) {
  var cmd = '-A INPUT -p ' + proto.toLowerCase() + ' --dport ' + range.min;
  if (range.max) {
    cmd+= ':' + range.max
  }
  cmd+= ' -m state --state NEW -j ACCEPT';
  return cmd;
};

// Overwrite the getServerStartCommand fn.
ipHelper.getServerStartCommand = function(node) {
  var path = _basePath + confFile;
  return 'sudo iptables-restore < ' + path + ' && sudo rm ' + path + ' && sudo apt-get install iptables-persistent';
};

// MAIN //
// First create the nodes (just b/c I want to reuse the buildHelper).
var nodes = [{'port': ''}];
// First create confFiles
ipHelper.checkDirectories(nodes);
// Now Start it up.
ipHelper.startServers(nodes, function() {
  console.log('FINISHED RESTORING THE IPTABLES WITH THE FOLLOWING:\n\n');
  console.log(ipHelper.createConfFile());
});
