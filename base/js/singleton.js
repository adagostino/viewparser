var __className = 'singleton';
$require(__className, function() {
  var global = this;

  var Singleton = function(){
    this._singletons = {};
  };

  Singleton.prototype.create = function(inputClass, name) {
    name = name || global.__className;
    if (!name || !inputClass) return;
    if (this._singletons[name]) return this._singletons[name];
    this._singletons[name] = new inputClass();
    return this._singletons[name];
  };

  var s = new Singleton();

  this.Singleton = s;

  return s;
});