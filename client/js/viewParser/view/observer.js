var __className = 'observer';
$require(__className, ['extend', 'utils', 'base'], function(extend, utils, Base) {
  var Observer = function(){};

  var _fakeObserver = function(){
    return {
      'open': function () {},
      'close': function () {}
    };
  };

  Observer.prototype.$watch = function(path, fn) {
    if (utils.isArray(path)) return this.$compoundWatch(path, fn);
    var observer = new PathObserver(this, path),
        callback = function(newValue, oldValue) {
          //console.log(arguments);
          fn.apply(this, arguments);
          Platform.performMicrotaskCheckpoint();
        }.bind(this);

    observer.open(callback);
    this.addObserver(observer);
    return function () {
      observer.close();
    }
  };

  Observer.prototype.$watchArray = function(path, fn) {
    var arr = Path.get(path).getValueFrom(this);

    var callback = function(splices) {
          fn.call(this, {'splices': splices});
          Platform.performMicrotaskCheckpoint();
        }.bind(this);

    var observer = utils.isArray(arr) ? new ArrayObserver(arr) : _fakeObserver();

    var pathWatchFn = function() {
      var nArr = Path.get(path).getValueFrom(this);
      observer.close();
      observer = utils.isArray(arr) ? new ArrayObserver(nArr) : _fakeObserver();
      observer.open(callback);
      this.addObserver(observer);
      fn.apply(this, arguments);
      Platform.performMicrotaskCheckpoint();
    }.bind(this);

    var cancelPathObserver = this.$watch(path, pathWatchFn);
    observer.open(callback);
    this.addObserver(observer);
    return function () {
      observer.close();
      cancelPathObserver();
    }
  };

  Observer.prototype.$watchObject = function(path, fn) {
    var obj = Path.get(path).getValueFrom(this),
        callback = function(added, removed, changed, getOldValueFn) {
          fn.apply(this, arguments);
          Platform.performMicrotaskCheckpoint();
        }.bind(this),
        observer = utils.isObject(obj) ? new ObjectObserver(obj) : _fakeObserver();

    var pathWatchFn = function() {
      var nObj = Path.get(path).getValueFrom(this);
      observer.close();
      observer = utils.lisObject(nObj) ? new ObjectObserver(nObj) : _fakeObserver();
      observer.open(callback);
      this.addObserver(observer);
      fn.apply(this, arguments);
      Platform.performMicrotaskCheckpoint();
    }.bind(this);
    var cancelPathObserver = this.$watch(path, pathWatchFn);
    observer.open(callback);
    this.addObserver(observer);
    return function () {
      observer.close();
      cancelPathObserver();
    }
  };

  Observer.prototype.$compoundWatch = function(paths, fn) {
    if (!paths.length) return;
    var observer = new CompoundObserver(),
        callback = function() {
          fn.apply(this, arguments);
          Platform.performMicrotaskCheckpoint();
        }.bind(this);

    for (var i=0; i<paths.length; i++) {
      observer.addObserver(new PathObserver(this, paths[i]));
    }
    observer.open(callback);
    this.addObserver(observer);
    return function () {
      observer.close();
    }
  };

  Observer.prototype.$timeout = function(fn, time){
    if (!fn) return;
    time = time || 0;
    var callback = function() {
      fn.apply(this, arguments);
      Platform.performMicrotaskCheckpoint();
    }.bind(this);
    var id = setTimeout(callback, time);
    // Return the cleartimeout function.
    return function() {
      clearTimeout(id);
    }
  };

  var global = this;
  Observer.prototype._apply = function(context, fn, args) {
    if (!utils.isFunction(fn)) return;
    var result = fn.apply(context || global, Array.prototype.slice.call(args, 0));
    Platform.performMicrotaskCheckpoint();
    return result;
  };

  Observer.prototype.$apply = function(context, fn, args) {
    return this._apply(context, fn, args);
  };

  Observer.prototype.$call = function(context, fn) {
    return this._apply(context, fn, Array.prototype.slice.call(arguments, 2));
  };

  // Used to format callbacks so that they use this.$apply (and thus Platform.performMicrotaskCheckpoint).
  Observer.prototype.$callback = function(callback, context) {
    return function() {
      this.$apply(context || this, callback, arguments);
    }.bind(this);
  };

  Observer.prototype.$getParseOptions = function(o) {
    var parseFunc = utils.$parse(o);
    var paths = utils.getPaths(parseFunc.lexer.lex(o));
    return {
      'parseFunc': parseFunc,
      'paths': paths
    }
  };

  var $scopeReg = /^\$scope\./;
  Observer.prototype.$parseAndWatch = function(o, callback) {
    var opts = this.$getParseOptions(o);
    // make sure to add $scope to the paths.
    for (var i=0; i<opts.paths.length; i++) {
      if (!$scopeReg.test(opts.paths[i])) {
        opts.paths.push('$scope.' + opts.paths[i]);
      }
    }

    var cb = function() {
      var tmp = this._parseFunc;
      this._parseFunc = opts.parseFunc;
      var ret = callback.apply(this, arguments);
      this._parseFunc = tmp;
      return ret;
    };

    var cw = this.$compoundWatch(opts.paths, cb);
    // Call the watch so that it fires.
    cb.apply(this);
    return cw;
  };

  Observer.prototype.$parseAndWatchCollection = function(str, callback, $scope) {
    var opts = this.$getParseOptions(str);
    // make sure to add $scope to the paths.
    var observers = {};
    var last;
    var cb = function() {
      var curr = opts.parseFunc($scope || this);
      var type = utils.typeof(curr);
      if (!utils.equals(curr, last)) {
        var base = curr ? [] : null;
        base = type === 'object' ? {} : base;
        callback.call(this, curr, last);
        last = $.extend(true, base, curr);
      }
    };

    for (var i=0; i<opts.paths.length; i++) {
      var path = opts.paths[i];
      var obj = Path.get(path).getValueFrom(this);
      var type = utils.typeof(obj);
      (function(path){
        switch(type) {
          case 'array':
            observers[path] = this.$watchArray(path, cb);
            break;
          case 'object':
            observers[path] = this.$watchObject(path, cb);
            break;
          default:
            observers[path] = this.$watch(path, function(){
              var obj = Path.get(path).getValueFrom(this);
              var type = utils.typeof(obj);
              if (type === 'array') {
                observers[path]();
                observers[path] = this.$watchArray(path, cb);
              }else if (type === 'object') {
                observers[path]();
                observers[path] = this.$watchObject(path, cb);
              }
              cb.apply(this);
            });
            break;
        };
      }.bind(this))(path);
      if (!$scopeReg.test(opts.paths[i])) {
        opts.paths.push('$scope.' + opts.paths[i]);
      }
    }
    cb.apply(this);
    return function () {
      for (var key in observers) {
        observers[key]();
      }
    }
  };

  Observer.prototype.$parse = function(str, $scope) {
    var opts = this.$getParseOptions(str);
    return opts.parseFunc($scope || this);
  };

  Observer.prototype.addObserver = function(observers) {
    if (!observers) return;
    observers = utils.isArray(observers) ? observers : [observers];
    var a = utils.isArray(this.__watches_) ? this.__watches_ : [];
    if (observers.length) {
      observers.splice(0, 0, a.length, 0);
      Array.prototype.splice.apply(a, observers);
    }
    this.__watches_ = a;
  };

  Observer.prototype.removeObservers = function() {
    var observers = utils.isArray(this.__watches_) ? this.__watches_ : [];
    for (var i=0; i< observers.length; i++) {
      observers[i].close();
    }
    this.__watches_ = null;
  };

  return extend(Base, Observer);
});