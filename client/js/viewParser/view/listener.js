var __className = 'listener';
$require(__className,
[
  'extend',
  'utils',
  'idGenerator',
  'scopeTree',
  'observer'
], function(
  extend,
  utils,
  idGenerator,
  ScopeTree,
  Observer)
{
  // listener-object
  var Listener = function(){};

  Listener.prototype.__beforeInit = function(scopeTreeObj) {
    this._super();
    this.scopeTree = scopeTreeObj ? scopeTreeObj.append(this) : new ScopeTree(this);
    this.$scope = scopeTreeObj ? scopeTreeObj.$scope : null;
    this.$parentScope = this.$scope ? this.$scope.$parentScope : null;

    this._globalListeners = {
      'listeners': {},
      'length': 0
    };
  };

  Listener.prototype.$on = function(event, callback, capture) {
    this.scopeTree.addListener(event, callback, capture);
  };

  Listener.prototype.$off = function(event, callback) {
    this.scopeTree.removeListener(event, callback);
  };

  Listener.prototype.$trigger = function(event, params) {
    this.scopeTree.triggerListener(event, params);
  };

  Listener.prototype.$broadcast = function(event, params) {
    this.scopeTree.$root.scopeTree.triggerBroadcast(event, params);
  };

  Listener.prototype._$onGlobal = function(global, event, delegate, callback) {
    if (!global) return;
    callback = utils.isFunction(delegate) ? delegate : callback;
    delegate = utils.isFunction(delegate) ? null : delegate;

    if (!callback) return;
    var fn = function(e) {
      this.$call(this, callback, e);
    }.bind(this);
    delegate ? $(global).on(event, delegate, fn) : $(global).on(event, fn);
    var eventName = event + '-' + idGenerator();
    var removeFn = function() {
      delegate ? $(global).off(event, delegate, fn) : $(global).off(event, fn);
      delete this._globalListeners.listeners[eventName];
      this._setRemoveListener();
      this._globalListeners.length--;
    }.bind(this);
    this._globalListeners.listeners[eventName] = removeFn;
    this._globalListeners.length++;
    this._setRemoveListener();
    return removeFn;
  };

  Listener.prototype.$onWindow = function(event, delegate, callback) {
    if (!utils.isClient()) return;
    this._$onGlobal(window, event, delegate, callback);
  };

  Listener.prototype.$onDocument = function(event, delegate, callback) {
    if (!utils.isClient()) return;
    this._$onGlobal(document, event, delegate, callback);
  };

  Listener.prototype._setRemoveListener = function() {
    if (this._globalListeners.length && this._hasRemoveListener) return;
    if (!this._globalListeners.length) {
      this.$off('$remove', this._removeGlobalListeners);
      this._hasRemoveListener = false;
    } else {
      this.$on('$remove', this._removeGlobalListeners);
      this._hasRemoveListener = true;
    }
  };

  Listener.prototype._removeGlobalListeners = function() {
    if (!this._globalListeners.length) return;
    for (var key in this._globalListeners.listeners) {
      this._globalListeners.listeners[key]();
    }
  };

  return extend(Observer, Listener);
});