var __className = 'app';
$require(__className,
[
  'utils',
  'viewParser',
  'extend',
  'filters',
  'base',
  'model',
  'view',
  'directive',
  'controller',
  'router'
],
function(
  utils,
  viewParser,
  extend,
  filters,
  Base,
  Model,
  View,
  Directive,
  Controller,
  Router) {

  var App = function(){};

  App.prototype.__templateType = 'app';

  App.prototype.__beforeInit = function(attrs, el, domTree, router) {
    this.__$isolateScope_ = true;
    this._super(attrs, el, domTree);
    this._setHistory();
    // initialize the router here.
    this._initializeRouter(router);
  };

  App.prototype.init = function(){};

  App.prototype.addApp = function(obj) {
    if (!obj || !obj.app) return;
    if (obj.app.prototype.__templateType !== 'app') {
      obj.app = extend(App, obj.app);
    }
    return viewParser.addApp(obj);
  };

  App.prototype.addDirective = function(obj) {
    if (!obj || !obj.directive) return;
    if (obj.directive.prototype.__templateType !== 'directive') {
      obj.directive = extend(Directive, obj.directive);
    }
    return viewParser.addDirective(obj);
  };

  App.prototype.addController = function(obj) {
    if (!obj || !obj.controller) return;
    if (obj.controller.prototype.__templateType !== 'controller') {
      obj.controller = extend(Controller, obj.controller);
    }
    return viewParser.addController(obj);
  };

  App.prototype.addModel = function(obj) {
    if (!obj) return;
    if (obj.prototype.__templateType !== 'model') {
      obj = extend(Model, obj);
    }
    return obj;
  };

  App.prototype.addFilter = function(name, fn) {
    if (!name) return;
    return filters.addFilter(name, fn);
  };

  App.prototype.addRouter = function(obj) {
    if (!obj) return;
    if (obj.prototype.__templateType !== 'router') {
      obj = extend(Router, obj);
    }
    return obj;
  };

  App.prototype._initializeRouter = function(InputRouter) {
    if (!InputRouter) return;
    this.router = new InputRouter(this);
  };

  App.prototype.removeRoutes = function() {
    if (!this.router) return;
    this.router.removeRoutes();
  };

  App.prototype.setAdmin = function(isAdmin) {
    Base.prototype._isAdmin = !!isAdmin;
  };

  App.prototype.setBaseUrl = function(url) {
    if (!url) return;
    Base.prototype.__BASEURL = url;
  };

  App.prototype.setStaticUrl = function(url) {
    if (!url) return;
    Base.prototype.__STATICURL = url;
  };

  App.prototype._setHistory = function() {
    if (this.scopeTree && this.scopeTree.$root) {
      this.history = this.scopeTree.$root.history;
    }
  };

  App = extend(View, App);

  return App;
});
