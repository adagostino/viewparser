$require('redisManager',
[
  'extend',
  'singleton',
  'config',
  'credentials',
  'ioredis',
  'microService'
],
function(
  extend,
  singleton,
  config,
  credentials,
  Redis,
  MicroService
) {

  // Get Redis cluster set up
  // http://redis.io/topics/admin#running-redis-on-ec2

  // http://redis.io/topics/cluster-tutorial

  // Now connect to cluster is ioredis.
  // https://github.com/luin/ioredis#cluster

  // Now set the adaptor in socket.io
  // https://github.com/socketio/socket.io-redis

  // https://github.com/tj/connect-redis

  //https://github.com/sshin/vchat/blob/master/controllers/user.js


  var RedisManager = function() {};

  RedisManager.prototype.init = function() {
    this._nodes = this._getClusterNodes();
    this._clusters = [];
    this.numProcesses = 0;
    this.start();
  };

  RedisManager.prototype.start = function() {
    if (this._cluster) return;
    this._cluster = this._createCluster();
  };

  RedisManager.prototype.stop = function() {
    if (!this._cluster) return;
    for (var i=0; i<this._clusters.length; i++) {
      this._clusters[i].disconnect();
    }
    this._cluster = null;
    this._clusters = [];
  };

  RedisManager.prototype.getCluster = function() {
    return this._cluster;
  };

  RedisManager.prototype._onProcessExit = function(code) {
    this._super(code);
    try { this.stop(); } catch(err) { console.log(err) };
  };

  RedisManager.prototype._getClusterNodes = function() {
    var numPorts = parseInt(config.redis.numPorts || 3),
        startPort = parseInt(config.redis.startPort || 30001),
        host = config.redis.host || '127.0.0.1';
    var a = [];
    for (var i=0; i<numPorts; i++) {
      a.push({
        port: startPort + i,
        host: host
      });
    }
    return a;
  };

  RedisManager.prototype._createCluster = function() {
    var cluster = new Redis.Cluster(this._nodes);
    this._clusters.push(cluster);
    return cluster;
  };

  // add get and set and pub/sub etc here.
  RedisManager.prototype.getPubSub = function() {
    return {
      'pubClient': this._createCluster(),
      'subClient': this._createCluster()
    };
  };

  RedisManager = extend(MicroService, RedisManager);

  return singleton.create(RedisManager);
});