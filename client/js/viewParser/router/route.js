$require('route', ['extend', 'viewParser', 'view'], function(extend, viewParser, View) {

  // Given a route, and a URL fragment that it matches, return the array of
  // extracted decoded parameters. Empty or unmatched parameters will be
  // treated as `null` to normalize cross-browser behavior.
  var _extractParameters = function (route, fragment) {
    var params = route.exec(fragment).slice(1);
    for (var i=0; i<params.length; i++) {
      if (i === params.length - 1) {
        params[params.length - 1] = params[i] || null;
      } else {
        params[i] = params[i] ? decodeURIComponent(params[i]) : null;
      }
    }
    return params;
  };

  var Route = function(){};

  Route.prototype.__templateType = 'route';

  Route.prototype.__beforeInit = function(options) {
    this.options = options || {};
    $.extend(this, options);

    if (!this.router) {
      console.warn('No router found for this route:', options.path);
      return;
    }
    this.scope = this.router.app;
    this.history = this.router.history;

    this.parentDomTree = this.scope.domTree;
    this._super({}, this.parentDomTree.el, this.parentDomTree, this.scope.scopeTree);
  };

  Route.prototype.init = function(){};

  Route.prototype.execute = function(fragment) {
    // The route has been asked to change to {{fragment}}. Parse out the fragment and run through the callbacks.
    // If the last callback doesn't return 'false', call render.
    var paramArray = _extractParameters(this.path, fragment);
    this._currentPath = {
      'fragment': fragment,
      'params': paramArray
    };
    this._callbackIndex = 0;
    this._executeCallback(paramArray);
  };

  Route.prototype._executeCallback = function() {
    var ind = this._callbackIndex || 0;
    var callbacks = this.callbacks || [];
    var callback = callbacks[ind];
    if (!callback) {
      this.render();
      return
    }
    // Get the arguments in array form.
    var args = Array.prototype.slice.call(arguments, 0);
    // Call the callback with the arguments.
    var ret = callback.apply(this, args);
    // If we are not returned 'false', then call the next callback, passing whatever is returned to the next one.
    if (ret !== false) {
      args.push(ret);
      this.next.apply(this, args);
    }
  };

  Route.prototype.next = function() {
    this._callbackIndex++;
    this._executeCallback.apply(this, arguments);
  };

  Route.prototype.render = function(template, scope) {
    this._callbackIndex = 0;
    var html = template || this.template;
    var scope = scope || this.scope;
    this._setChildrenToRemove();
    viewParser.compile(html, scope.scopeTree, this.parentDomTree, this._onRender.bind(this), true);
  };

  Route.prototype._setChildrenToRemove = function() {
    var el = this.scope.el;
    this._childrenToRemove = [];
    for (var i=0; i<el.children.length; i++) {
      this._childrenToRemove.push(el.children[i]);
    }
  };

  Route.prototype._onRender = function(child) {
    // TODO(TJ): Think about animations here (maybe). Also check routes here.
    this.clear();
    this.parentDomTree.el.appendChild(child);
    this.$trigger('App:Route:Rendered', {
      'path': this.path,
      'fragment': this._currentPath.fragment,
      'params': this._currentPath.params
    });
  };

  Route.prototype.clear = function() {
    while (this._childrenToRemove.length) {
      var child = this._childrenToRemove.splice(0, 1)[0];
      this.$removeElement(child);
    }
  };

  Route.prototype.$remove = function() {
    this._setChildrenToRemove();
    this.clear();
    this.history.removeRoute(this);
  };

  return extend(View, Route);
});