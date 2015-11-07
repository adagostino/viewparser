// Just a wrapper for console.log
$require('logger', function() {
  var addTime = function(arguments) {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(new Date().getTime() + ' :');
    return args;
  };

  var wrapConsole = function(name) {
    var fn = console[name];
    console[name] = function() {
      var args = addTime(arguments);
      fn.apply(undefined, args);
    }
  };

  wrapConsole('log');
  wrapConsole('error');
  wrapConsole('warn');

  return {};
});