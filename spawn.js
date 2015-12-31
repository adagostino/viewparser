// Arguments: processClass, numProcesses
var processClass = process.argv[2],
    numProcesses = process.argv[3] ? parseInt(process.argv[3]) : 1,
    processOptions = process.argv[4] ? JSON.parse(process.argv[4]) : {};

var cluster = require('cluster');
if (cluster.isMaster) {
  // Set up listeners
  process.on('message', function(m) {
    switch(m.type) {
      case 'fork':
        cluster.fork();
        break;
      case 'kill':
        for (var id in cluster.workers) {
          cluster.workers[id].kill();
        }
        process.exit(0);
        break;
      case 'killWorker':
        for (var id in cluster.workers) {
          var v = parseInt(m.value);
          var pid = cluster.workers[id].process.pid;
          if (pid === v) {
            cluster.workers[id].kill();
            break;
          }
        }
        break;
      case 'prune':
        var num = parseInt(m.value),
            ct = 0;
        for (var id in cluster.workers) {
          if (ct >= num) break;
          cluster.workers[id].kill();
          ct++;
        }
        break;
      case 'grow':
        var num = parseInt(m.value);
        console.log('Growing', processClass, 'by', num);
        for (var i=0; i<num; i++) {
          fork();
        }
        break;
      case 'messageToWorker':
        if (cluster.workers[m.pid]) {
          cluster.workers[m.pid].send(m.header, m.body);
        } else {
          console.error('TRIED TO SEND MESSAGE TO PROCESS (', m.pid ,') THAT IS NOT CHILD OF', process.pid);
        }
        break;
      case '':
        break;
      default:
        break;
    }
  });
  var numForks = 0;
  var _workers = [];

  var fork = function() {
    var n = cluster.fork({
      'idx': numForks
    });
    numForks++;
    n.on('message', function(m) {
      process.send(m);
    });
  };

  // Setup the master.
  cluster.setupMaster({
    args: Array.prototype.slice.call(process.argv, 2) // get args form the command line (like processClass)
  });
  cluster.on('online', function(worker) {
    process.send({
      'type': 'workerOnline',
      'pid': worker.process.pid
    });
    _workers.push(worker)
  });
  cluster.on('exit', function(worker, code, signal) {
    process.send({
      'type': 'workerOffline',
      'pid': worker.process.pid
    });
    for (var i=0; i<_workers.length; i++) {
      if (_workers[i].process.id == worker.process.id) {
        _workers[i].splice(i, 1);
      }
    }
    console.log('worker exited', worker.process.pid, worker.suicide, code, signal);
    if (worker.suicide) return;
    fork();
  });

  for (var i = 0; i < numProcesses; i++) {
    // Fork them
    fork();
  }
} else {
  // Load up the JS.
  require('./readConfig.js');
  // console.log('index', process.env['idx']);
  // Get the process class.
  var ProcessClass = $class(processClass);
  // Create a child process.
  processOptions['isMaster'] = false;
  processOptions['processIndex'] = parseInt(process.env['idx']);
  var child = new ProcessClass(processOptions);
  // Call the onFork method if it exists.
  child.onFork && child.onFork(cluster.worker);
  process.on('message', function(messageHeader, messageBody) {
    child.onProcessMessage && child.onProcessMessage(messageHeader, messageBody);
  });
}
