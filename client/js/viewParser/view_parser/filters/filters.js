var __className = 'filters';
$require(__className, ['singleton', 'extend', 'ngParser', 'base'], function(singleton, extend, ngParser, Base) {

  var valueFn = function (value) {
    return function () {
      return value;
    };
  };

  var Filters = function(){};

  Filters.prototype.init = function() {
    this._filters = {};
  };

  Filters.prototype.addFilter = function(fn, name) {
    name = name || this.__get__className();
    if (!this._filters[name]) {
      this._filters[name] = fn;
      ngParser.registerFilter(name, valueFn(fn));
    } else {
      console.warn('Filter of name', name, 'already exists. Not adding filter:', fn);
    }
    return this._filters[name];
  };

  Filters.prototype.getFilter = function(name) {
    return this._filters[name];
  };

  return singleton.create(extend(Base, Filters));
});