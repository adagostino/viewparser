// brew update
// brew install mongodb

var _basePath = '../server/mongodb/';

var BuildHelper = require('./helpers/buildHelper.js'),
    cp = require('child_process'),
    config = require('../config.json');

var mongoHelper = new BuildHelper(_basePath, 'mongo.conf');

mongoHelper.createConfFile = function(node) {
  var conf = [];
  conf.push('port = ' + node.port);
  conf.push('fork = true'); // daemonize it!
  conf.push('logpath = ./mongodb-' + node.port + '.log');
  conf.push('logappend = true');
  conf.push('dbpath = ./db');
  // replSet/shard needs auth and keyfile
  // can create indexes via script described here:
  // ex: mongo test.js (use the Mongo(host:port) in the js file to create a connectiong)
  // https://docs.mongodb.org/manual/tutorial/write-scripts-for-the-mongo-shell/
  // and here
  // https://docs.mongodb.org/manual/reference/method/db.collection.createIndex/
  // note: https://docs.mongodb.org/manual/reference/method/db.collection.createIndex/#behaviors
  return conf.join('\n');
};

mongoHelper.checkDbDirectories = function(nodes) {
  for (var i=0; i<nodes.length; i++) {
    var node = nodes[i];
    var path = this._basePath + node.port + '/db';
    this.checkDirectory(path);
  }
};

mongoHelper.getServerStartCommand = function(node) {
  return 'cd ' + _basePath + node.port + ' && mongod --config ./mongo.conf';
};

var getMongoNodes = function() {
  var port = config.mongo.port || 27017,
      host = config.mongo.host || '127.0.0.1';
  var a = [];
  a.push({
    'port': port,
    'host': host
  });
  return a;
};

// MAIN //
// First get the cluster nodes.
var nodes = getMongoNodes();
// Next make sure the cluster node paths exist.
mongoHelper.checkDirectories(nodes);
// Next make sure the db paths exist
mongoHelper.checkDbDirectories(nodes);
// Now start the servers
mongoHelper.startServers(nodes, function() {
  console.log('ALL MONGO SERVERS STARTED!!');
});