var fs = require('fs'),
    cp = require('child_process');

var pathIs = function(path, type) {
  try {
    var stats = fs.statSync(path);
    switch(type.toLowerCase()) {
      case 'file':
        return stats.isFile();
      case 'directory':
        return stats.isDirectory();
      default:
        return false;
    }
  } catch(err) {
    return false;
  }
};

var builder = function(basePath, confFileName) {
  this._basePath = basePath;
  this._confFileName = confFileName;
  // Make sure the base path exists.
  this.checkDirectory(this._basePath);
};

builder.prototype.checkDirectories = function (nodes) {
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var path = this._basePath + node.port;
    this.checkDirectory(path);
    this.checkConf(node);
  }
};

builder.prototype.checkDirectory = function (path) {
  if (!path) return;
  if (!pathIs(path, 'directory')) {
    fs.mkdirSync(path);
  }
};

builder.prototype.getConfFilePath = function(node) {
  return this._basePath + node.port + '/' + this._confFileName;
};

builder.prototype.checkConf = function (node) {
  var path = this.getConfFilePath(node);
  if (!pathIs(path, 'file')) {
    this.writeConfFile(node, path);
  }
};

builder.prototype.writeConfFile = function(node, path) {
  var body = this.createConfFile(node);
  fs.writeFileSync(path, body);
};

//http://mongodb.github.io/node-mongodb-native/2.0/api/AggregationCursor.html
// redis-cli -h 127.0.0.1 -p 6379
builder.prototype.startServers = function(nodes, callback) {
  var ct = 0;
  var cb = function() {
    ct++;
    ct >= nodes.length && callback();
  };
  //cp.execSync('cd ' + _basePath);
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var cmd = this.getServerStartCommand(node);
    console.log('Starting Server on Port:', node.port);
    cmd && cp.execSync(cmd);
    cb();
  }
};

builder.prototype.createConfFile = function(node) {
  // left empty for inheritance.
  return '';
};

builder.prototype.getServerStartCommand = function(node) {
  // left empty for inheritance
  return '';
};

module.exports = builder;