(function(global){
  if (global.$require) return;

  var _classes = {},
      _uninitiated = [],
      _dependencies = {};

  var $require = function(name, dependencies, fn){
    if (_classes[name]) {
      //console.log(name);
      return;
    }

    var depIsFn = typeof dependencies === 'function';
    fn = depIsFn ? dependencies : fn;
    dependencies = depIsFn ? [] : (dependencies || []);
    if (!name || !fn) {
      console.warn('Can not require b/c missing name or fn', arguments);
      _addClasses();
      return;
    }
    var map = {};
    for (var i=0; i<dependencies.length; i++) {
      map[dependencies[i]] = 1;
    }
    _dependencies[name] = map;
    _uninitiated.push({
      'name': name,
      'dependencies': dependencies,
      'fn': fn
    });
    //console.log('require:', name, '[', dependencies.join(', '), ']');
    _checkCircular();
    _addClasses();
  };

  var _checkCircular = function() {
    var o = _uninitiated[_uninitiated.length - 1],
        name = o.name,
        map = _dependencies[name],
        ct = 0;
    for (var dependency in map) {
      if (_dependencies[dependency] && _dependencies[dependency][name]) {
        console.error(name, 'has a circular reference to', dependency,
          'Neither class will be added and your code will probably break ' +
          'b/c $require will return a null for that class.');
        _classes[name] = _classes[dependency] = null;
        ct++;
      }
    }
    return !!ct;
  };

  var _addClasses = function() {
    // This is a loop where we run through the list of _unaddedClasses and check their dependencies and add the class
    // if all dependencies are there. Since dependencies can be out of order or added at different times,
    // we keep running through until no more dependencies are added.
    var addedClasses = true;
    while (_uninitiated.length && addedClasses) {
      addedClasses = _tryToAddClasses();
    }
  };

  var _tryToAddClasses = function() {
    var ct = 0,
        added = 0;
    while (ct <= _uninitiated.length) {
      if (_canAddClass(_uninitiated[ct])) {
        var o = _uninitiated.splice(ct, 1)[0];
        var injections = [];
        for (var i=0; i< o.dependencies.length; i++) injections.push(_classes[o.dependencies[i]]);
        var tmp = global.__className;
        global.__className = o.name;
        var c = o.fn.apply(global, injections);
        if (!c) {
          console.log(o);
        }
        (c.prototype || c)['__className'] = o.name;
        _classes[o.name] = c;
        global.__className = tmp;
        //console.log('added:', o.name);
        added++;
      } else {
        ct++;
      }
    }
    return !!added;
  };

  var _canAddClass = function(o) {
    if (!o) return;
    for (var i=0; i< o.dependencies.length; i++) {
      if (!_classes.hasOwnProperty(o.dependencies[i])) return false;
    }
    return true;
  };

  var $class = function(className) {
    return _classes[className];
  };

  global.$require = $require;
  global.$class = $class;
})(typeof global !== 'undefined' && global && typeof module !== 'undefined' && module ? global : this || window);