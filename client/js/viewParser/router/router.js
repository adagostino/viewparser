$require('router',
[ 'extend',
  'utils',
  'listener',
  'route'
],
function(
  extend,
  utils,
  Listener,
  Route) {

  var optionalParam = /\((.*?)\)/g,
      namedParam = /(\(\?)?:\w+/g,
      splatParam = /\*\w+/g,
      escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Convert a route string into a regular expression, suitable for matching against the current location hash.
  var _routeToRegExp = function(route) {
    route = route
      .replace(escapeRegExp, '\\$&')
      .replace(optionalParam, '(?:$1)?')
      .replace(namedParam, function (match, optional) {
        return optional ? match : '([^/?]+)';
      })
      .replace(splatParam, '([^?]*?)');
    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
  };

  var Router = function(){};

  Router.prototype.__templateType = 'router';

  Router.prototype.__beforeInit = function(app) {
    this._super(app.scopeTree);
    this.app = app;
    this.history = this.app.history;
    var routes = this.routes || [];
    this._routes = {};
    for (var i=0; i<routes.length; i++) {
      var cb = [].concat(routes[i].callbacks);
      cb.unshift(routes[i].template);
      cb.unshift(routes[i].path);
      this.addRoute.apply(this,cb);
    }
    this.$on('$remove', this.$remove);
  };

  Router.prototype.init = function(){};

  Router.prototype.addRoute = function(path, template) {
    if (!utils.isRegExp(path)) path = _routeToRegExp(path);

    var callbacks = Array.prototype.slice.call(arguments, 2);
    var route = new Route({
      'path' : path,
      'template': template,
      'callbacks': callbacks,
      'router': this
    });
    this._routes[path] = route;
    this.history.addRoute(route);
  };

  Router.prototype.navigate = function(fragment, options) {
    this.history.navigate(fragment, options);
    return this;
  };

  Router.prototype.removeRoutes = function() {
    for (var key in this._routes) {
      this.removeRoute(key);
    }
  };

  Router.prototype.removeRoute = function(pathOrRoute) {
    var path = utils.typeof(pathOrRoute) === 'string' ? pathOrRoute : pathOrRoute.path;
    if (!path) return;
    path = path.toString();
    var route = this._routes[path];
    if (route) {
      delete this._routes[path];
      route.$remove();
    }
  };

  Router.prototype.$remove = function() {
    this.removeRoutes();
  };

  return extend(Listener, Router);
});