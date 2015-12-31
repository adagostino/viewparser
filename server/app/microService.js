// Helper class to spawn a process.
$require('microService',
[
  'extend',
  'config',
  'utils',
  'child_process',
  'os',
  'observer'
],
function(
  extend,
  config,
  utils,
  cp,
  os,
  Observer
) {

  var MicroService = function(){};

  MicroService.prototype.__beforeInit = function(options) {
    // options: {'numProcesses': num}
    options = options || {};
    this.options = options;
    this._super();
    this.isMaster = options && options.hasOwnProperty('isMaster') ? options.isMaster : !!options;
    this._workers = {
      'pids': {},
      'pidsArray': [],
      'length': 0
    };
  };

  MicroService.prototype.__afterInit = function() {
    if (!this.isMaster) return;
    // Default to one service per cpu core.
    var np = typeof this.numProcesses === 'number' ? this.numProcesses : this.options.numProcesses;
    np = typeof np === 'number' ? np : os.cpus().length;
    this.numProcesses = np;

    if (!this.numProcesses) {
      this.process = process;
    }
    this._setProcessListeners();
    this.spawn();
  };

  // Master Methods.
  MicroService.prototype.spawn = function() {
    if (!this.isMaster || !this.numProcesses || this.process) return;
    // Not the greatest to check the templateType if it's a server here. But okay for now.
    this.process = cp.fork(config.helpers.spawn, [this.__className, this.numProcesses, JSON.stringify(this.options)]);
    this.process.on('message', this._onProcessMessage.bind(this));
    console.log('Master (', this.__className,') is online:', this.process.pid);
  };

  MicroService.prototype._setProcessListeners = function() {
    process.on('SIGINT', function() {
      console.log('Process for (', this.__className, ':', this.process.pid, ') received SIGINT: ', arguments);
      this._onProcessExit();
    }.bind(this));

    process.on('exit', function(code) {
      console.log('Process for (', this.__className, ':', this.process.pid, ') received EXIT: ', code);
      this._onProcessExit(code);
    }.bind(this));

    process.on('uncaughtException', function() {
      console.trace('Process for (', this.__className, ':', this.process.pid, ') received UNCAUGHT EXCEPTION: ', arguments);
      this._onProcessExit(666);
    }.bind(this));

    //this.process.on('exit', this._onProcessExit.bind(this));
  };

  MicroService.prototype._onProcessMessage = function(message) {
    if (!message) return;
    switch(message.type) {
      case 'workerOnline':
        this._workers.pids[message.pid] = 1;
        this._workers.pidsArray.push(message.pid);
        this._workers.length++;
        console.log('Worker (', this.__className, ') is online:', message.pid);
        break;
      case 'workerOffline':
        delete this._workers.pids[message.pid];
        for (var i=0; i<this._workers.pidsArray.length; i++) {
          if (this._workers.pidsArray[i] === message.pid) {
            this._workers.pidsArray.splice(i, 1);
            break;
          }
        }
        this._workers.length--;
        break;
      case 'messageFromWorker':
        this.onMessageFromWorker(message);
        break;
      default:
        break;
    }
  };

  MicroService.prototype.onMessageFromWorker = function(message) {
    // Leave this blank to for user to use if they'd like later.
    //console.log('Process for (', this.__className, ':', this.process.pid, ') received message from worker (', message.pid, ') :', message.data);
    var data = message.data;
    switch(data.type) {
      case 'spawn':
        this.grow(1);
        break;
      default:
        break;
    }
  };

  MicroService.prototype._onProcessExit = function(code) {
    this.process && console.log('Process for (', this.__className, ':', this.process.pid, ') exited with code: ', code);
    if (code && !this.isMaster) {
      // Have to send a message to master to spawn a new one.
      this.sendMasterMessage({
        'type': 'spawn'
      });
    }
  };

  MicroService.prototype.kill = function(pid) {
    if (this.process) {
      pid ? this._killWorker(pid) : this._killProcess();
    } else if (this.worker) {
      this.worker.kill();
    }
  };

  MicroService.prototype.prune = function(num) {
    // Just kill a number of random workers.
    this._pruneOrGrow('prune', num);
  };

  MicroService.prototype.grow = function(num) {
    // Grow your workers by num.
    this._pruneOrGrow('grow', num);
  };

  MicroService.prototype._pruneOrGrow = function(type, num) {
    num = parseInt(num);
    if (!this.process || isNaN(num)) return;
    this.process.send({'type': type, 'value': num})
  };

  MicroService.prototype._killProcess = function() {
    console.log('Killing entire process for (', this.__className, '):', this.process.pid);
    this.process.send({'type': 'kill'});
  };

  MicroService.prototype._killWorker = function(pid) {
    if (!this._workers[pid]) return;
    this.process.send({'type': 'killWorker', 'value': pid});
  };

  MicroService.prototype.fork = function() {
    // Create another microprocess
    if (!this.process) return;
    this.process.send({'type': 'fork'});
  };

  MicroService.prototype.sendWorkerMessage = function(pid, header, body) {
    this.process.send({'type': 'messageToWorker', 'pid': pid, 'header': header, 'body': body});
  };

  MicroService.prototype.getNumWorkers = function() {
    return this._workers.length;
  };

  MicroService.prototype.getWorkerPidByInd = function(ind) {
    return this._workers.pidsArray[ind];
  };

  // Slave methods.
  MicroService.prototype.onFork = function(worker) {
    if (this.isMaster) return;
    this.worker = worker;
    this.process = this.worker.process;
    // May want to listen to disconnect here.
    this.worker.on('disconnect', this._onWorkerDisconnect.bind(this));
    this._setProcessListeners();
  };

  MicroService.prototype._onWorkerDisconnect = function() {
    var pid = this.process.pid;
    if (this.worker.suicide) {
      console.log('Worker (', this.__className, ') committed suicide:', pid);
    } else {
      console.log('Worker (', this.__className, ') died:', pid);
    }
    //TODO(TJ): Handle removing listeners etc.
  };

  MicroService.prototype.sendMasterMessage = function(msg) {
    this.process.send({
      'type': 'messageFromWorker',
      'pid': this.process.pid,
      'data': msg
    });
  };

  return extend(Observer, MicroService);
});