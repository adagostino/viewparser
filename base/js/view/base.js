var __className = 'base';
$require(__className, ['idGenerator'], function(idGenerator) {
  var global = this;

  var Base = function(){};

  Base.prototype.__isScope_ = true;

  Base.prototype.__beforeInit = function() {
    this.__id = idGenerator();
  };

  Base.prototype.__get__className = function() {
    return global.__className;
  };

  Base.prototype._isAdmin = false;

  return Base;
});