var __className = 'baseApp';
$require(__className,
[
  'app',
  'history',
  'scopeTree',
  'domTree',
  'extend',
], function(
    App,
    History,
    ScopeTree,
    DomTree,
    extend
) {
  var global = this;

  var BaseApp = function(){};

  BaseApp.prototype.init = function() {
    this._super();
    this.__$isolateScope_ = true;
    this._started = false;
    // Set the dom tree.
    this.domTree = new DomTree();
    // Set the $root of the scopeTree.
    this.scopeTree.setRoot(this);
    // Instantiate a history class.
    this.history = new History(this.scopeTree);
  };

  BaseApp.prototype.extend = function (parent, child) {
    return extend(parent, child);
  };

  BaseApp.prototype.require = function () {
    return $require.apply(global, arguments);
  };

  BaseApp.prototype.$remove = function() {
    this._super();
    this.history.$remove();
    this.el = null;
    this.domTree = null;
    this.scopeTree = null;
  };

  return extend(App, BaseApp);
});