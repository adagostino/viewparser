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
    if (!this.options.scope) {
      console.warn('No scope found for this route:', options.path);
      return;
    }
    this.path = options.path;
    this.template = options.template;
    this.parentDomTree = viewParser.getDomTreeFromElement(this.options.scope.el);
  };

  Route.prototype.init = function(){};

  Route.prototype.execute = function(fragment) {
    // The route has been asked to change to {{fragment}}. Parse out the fragment and run through the callbacks.
    // If the last callback doesn't return 'false', call render.
    var paramArray = _extractParameters(this.options.path, fragment);
    this._callbackIndex = 0;
    this._executeCallback(paramArray);
  };

  Route.prototype._executeCallback = function() {
    var ind = this._callbackIndex || 0;
    var callbacks = this.options.callbacks || [];
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
    var html = template || this.options.template;
    var scope = scope || this.options.scope;
    this._setChildrenToRemove();
    if (!this.parentDomTree) this.parentDomTree = viewParser.getDomTreeFromElement(this.options.scope.el);

    viewParser.compile(html, scope, this.parentDomTree, this._onRender.bind(this), true);
  };

  Route.prototype._setChildrenToRemove = function() {
    var el = this.options.scope.el;
    this._childrenToRemove = [];
    for (var i=0; i<el.children.length; i++) {
      this._childrenToRemove.push(el.children[i]);
    }
  };

  Route.prototype._onRender = function(child) {
    // TODO(TJ): Think about animations here (maybe). Also check routes here.
    this.clear();
    this.parentDomTree.el.appendChild(child);
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
  };

  return extend(View, Route);
});