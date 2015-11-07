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
        for (var i=0; i<num; i++) {
          cluster.fork();
        }
        break;
      default:
        break;
    }
  });
  var numForks = 0;
  // Setup the master.
  cluster.setupMaster({
    args: Array.prototype.slice.call(process.argv, 2) // get args form the command line (like processClass)
  });
  cluster.on('online', function(worker) {
    process.send({
      'type': 'workerOnline',
      'pid': worker.process.pid
    });
  });
  cluster.on('exit', function(worker, code, signal) {
    process.send({
      'type': 'workerOffline',
      'pid': worker.process.pid
    });
    if (worker.suicide) return;
    cluster.fork({
      'idx': numForks
    });
    numForks++;
  });

  for (var i = 0; i < numProcesses; i++) {
    // Fork them
    cluster.fork({
      'idx': numForks
    });
    numForks++;
  }
} else {
  // console.log('index', process.env['idx']);
  // Load up the JS.
  require('./readConfig.js');
  // Get the process class.
  var ProcessClass = $class(processClass);
  // Create a child process.
  processOptions['isMaster'] = false;
  processOptions['processIndex'] = parseInt(process.env['idx']);
  var child = new ProcessClass(processOptions);
  // Call the onFork method if it exists.
  child.onFork && child.onFork(cluster.worker);
}
