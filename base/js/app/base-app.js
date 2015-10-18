var __className = '$app';
$require(__className,
[
  'app',
  'extend',
  'singleton',
  'viewParser',
  'scopeTree',
  'domTree',
  'history'
], function(
    App,
    extend,
    singleton,
    viewParser,
    scopeTree,
    domTree,
    history
) {
  var BaseApp = function(){};

  BaseApp.prototype.init = function() {
    this.__$isolateScope_ = true;
    this._super();
  };

  BaseApp.prototype.extend = function (parent, child) {
    return extend(parent, child);
  };

  var global = this;
  BaseApp.prototype.require = function () {
    return $require.apply(global, arguments);
  };

  BaseApp.prototype.start = function() {
    scopeTree.append(this.scopeTree);
    // Do the parsing here.
    this.$compile(this.el.outerHTML, null, function(child){
      this.el.parentNode.replaceChild(child, this.el);
    }, false, true);
  };

  BaseApp = extend(App, BaseApp);

  var $app = new BaseApp({}, document.getElementsByTagName('html')[0]);

  this[__className] = $app;

  document.addEventListener("DOMContentLoaded", function() {
    $app.start();
    history.loadUrl();
    Platform.performMicrotaskCheckpoint();
  });

  return $app;
});