var __className = 'base';
$require(__className, ['idGenerator'], function(idGenerator) {
  var global = this;

  var Base = function(){};

  Base.prototype.__isScope_ = true;

  Base.prototype.__BASEURL = '';

  Base.prototype.__beforeInit = function() {
    this.__id = idGenerator();
  };

  Base.prototype.__get__className = function() {
    return global.__className;
  };

  // Logging.
  Base.prototype._console = function(type, args) {
    var a = [this.__className.toUpperCase() + ':'];
    var b = Array.prototype.slice.call(args, 0);
    var c = a.concat(b);
    console[type].apply(console, c);
  };

  Base.prototype._log = function() {
    this._console('log', arguments);
  };

  Base.prototype._warn = function() {
    this._console('warn', arguments);
  };

  Base.prototype._error = function() {
    this._console('error', arguments);
  };

  Base.prototype._isAdmin = false;

  return Base;
});