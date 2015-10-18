var __className = 'listener';
$require(__className, ['extend', 'scopeTree', 'observer'], function(extend, scopeTree, Observer) {
  // listener-object
  var Listener = function(){};

  Listener.prototype.__beforeInit = function(scopeTreeObj) {
    this._super();
    this.scopeTree = scopeTreeObj ? scopeTreeObj.append(this) : scopeTree.create(this);
    this.$scope = scopeTreeObj ? scopeTreeObj.$scope : null;
    this.$parentScope = this.$scope ? this.$scope.$parentScope : null;
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
    //console.log('broadcasted:"', event, '" with params:', params);
    scopeTree.broadcastListener(event, params);
  };

  return extend(Observer, Listener);
});