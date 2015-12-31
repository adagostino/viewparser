// http://redis.io/topics/cluster-tutorial
// remember to gem install redis in the redis directory!

var _basePath = '../server/redis/';

var BuildHelper = require('./helpers/buildHelper.js'),
    cp = require('child_process'),
    config = require('../config.json'),
    credentials = require('../credentials.json');

var redisHelper = new BuildHelper(_basePath, 'redis.conf');

// Overwrite the createConfFile fn.
// http://download.redis.io/redis-stable/redis.conf
redisHelper.createConfFile = function(node) {
  var contents = [];
  contents.push('bind ' + node.host);
  contents.push('port ' + node.port);
  contents.push('cluster-enabled yes');
  contents.push('cluster-config-file nodes.conf');
  contents.push('cluster-node-timeout 5000');
  contents.push('appendonly yes');
  contents.push('daemonize yes');
  contents.push('slave-serve-stale-data yes');
  contents.push('logfile ./redis_'+ node.port + '.log');
  contents.push('dir ./');
  // Can't use redis auth with a cluster right now.
  // https://groups.google.com/forum/#!msg/redis-db/Z8lMxTfDct8/Rny9BIK9xGYJ

  //contents.push('requirepass ' + credentials.redisPass);
  //contents.push('masterauth ' + credentials.redisPass);
  return contents.join('\n');
};

// Overwrite the getServerStartCommand fn.
redisHelper.getServerStartCommand = function(node) {
  return 'cd ' + _basePath + node.port + ' && redis-server ./redis.conf';
};

var getClusterNodes = function () {
  var numPorts = parseInt(config.redis.numPorts || 3) * 2, // Times two for the slaves.
      startPort = parseInt(config.redis.startPort || 30001),
      host = config.redis.host || '127.0.0.1';
  var a = [];
  for (var i = 0; i < numPorts; i++) {
    a.push({
      port: startPort + i,
      host: host
    });
  }
  return a;
};

var buildClusterCommand = function(nodes) {
  var a = ['./redis-trib.rb create --replicas 1'];
  for (var i=0; i<nodes.length; i++) {
    a.push(nodes[i].host + ':' + nodes[i].port);
  }
  return a.join(' ');
};

// MAIN //
// First get the cluster nodes.
var nodes = getClusterNodes();
// Next make sure the cluster node paths exist.
redisHelper.checkDirectories(nodes);
// Now start the servers
redisHelper.startServers(nodes, function() {
  console.log('ALL SERVERS STARTED!!');
  console.log('To build the cluster, use this command:');
  console.log(buildClusterCommand(nodes));
});