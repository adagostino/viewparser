(function(subClass){
  subClass = subClass || "";

  var base = function(){};

  base.prototype.__beforeInit = function() {
    this.viewParser = $app.viewParser;
  };

  base.prototype.$watch = function(path, fn) {
    if ($.isArray(path)) return this.$compoundWatch(path, fn);
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

  base.prototype.$watchArray = function(path, fn) {
    var arr = Path.get(path).getValueFrom(this),
        callback = function(splices) {
          fn.call(this, {'splices': splices});
          Platform.performMicrotaskCheckpoint();
        }.bind(this),
        cancelPathObserver = this.$watch(path, fn),
        observer = new ArrayObserver(arr);

    observer.open(callback);
    this.addObserver(observer);
    return function () {
      observer.close();
      cancelPathObserver();
    }
  };

  base.prototype.$watchObject = function(path, fn) {

  };

  base.prototype.$compoundWatch = function(paths, fn) {
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

  base.prototype.$timeout = function(fn, time){
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

  base.prototype.$call = function(context, fn) {
    var result;
    try {
      result = fn.apply(context || window, Array.prototype.slice.call(arguments, 2));
    } catch (err) {

    }
    Platform.performMicrotaskCheckpoint();
    return result;
  };

  base.prototype.$parse = function(o) {
    var parseFunc = ngParser(o);
    var paths = this.viewParser.getPaths(parseFunc.lexer.lex(o));
    return {
      'parseFunc': parseFunc,
      'paths': paths
    }
  };

  var $scopeReg = /^\$scope\./;
  base.prototype.$parseAndWatch = function(o, callback) {
    var opts = this.$parse(o);
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

  base.prototype.$listenTo = function(event, callback) {
    if (!this.viewParser) {
      console.warn('Trying to listen to event:', event, 'on an object that does not have a view parser.');
      return;
    }
    return this.viewParser.addListenerToEl(this.el, event, callback);
  };

  base.prototype._isAdmin = false;

  base.prototype.addObserver = function(observers) {
    this.viewParser.addObserverToEl(this.el, observers);
  };

  $app.add(subClass, base, 'base');
})();