(function (global) {
  global = global || window;

  var _dashesRegex = /-(.)/g,
      _firstLetterRegex = /^./,
      _hasNonDigitsRegex = /\D+/g;

  var utils = {
    toCamelCase: function(str) {
      return (str || "").replace(_dashesRegex, function($0, $1){return $1.toUpperCase();})
                        .replace(_firstLetterRegex,function($0) {return $0.toLowerCase()});
    },
    isNumber: function(str) {
      return !_hasNonDigitsRegex.test(str);
    }
  };

  var app = function(){
    this._framework = {
      'mvc': {},
      'paths': [],
      'directives': {},
      'pathStr': ''
    };
    this._mvc = {};
    this._classes = {};
    // name: class
  };

  // Add the class to the app.
  app.prototype.add = function(subClass, fn, name){
    if (!name) {
      console.warn('Need to have a name for your class you are trying to subClass from:', subClass);
      return;
    }
    var path = Path.get(subClass).getValueFrom(this._classes);
    path = typeof path === 'string' ? path + "." + name : name;
    Path.get(name).setValueFrom(this._classes, path);

    this._framework.paths.push({
      'subClass': path,
      'name': name,
      'fn': fn
    });
    return path;
  };

  // Extend a class.
  var _namePattern = /(.*)\.([^.]*)$/; //0: full, 1: parent, 2: child
  app.prototype.extend = function (name, fn) {
    if (!name || typeof name !== "string") return;

    var match = name.match(_namePattern),
    // store these in _mvc so we can initialize under the real name later
        parent = match ? Path.get(match[1]).getValueFrom(this._framework.mvc) : undefined;

    // make a sanity check so that we don't try to extend from something that isn't there
    if (!!match && !parent) {
      console.warn('Could not find parent', match[1], 'when trying to extend', name, '. Are you sure you included that file or class?');
      return;
    };
    // adding the name for the hell of it
    var setName = match ? match[2] : name;
    fn.prototype.__className = setName;
    fn.prototype.__isAppClass = true;
    var child = __subClass(parent, fn);
    // set the path
    Path.get(name).setValueFrom(this._framework.mvc, child);
    Path.get(setName).setValueFrom(this._mvc, child);

    this._framework.pathStr += this._framework.pathStr ? "," + name : name;
  };

  // Sorts the inheritance chain.
  app.prototype.extendAll = function () {
    // first sort all of the paths so we can extend them all correctly

    this._framework.paths.sort(function (o1, o2) {
      if (o1.subClass > o2.subClass) {
        return 1;
      }
      if (o1.subClass < o2.subClass) {
        return -1;
      }
      return 0;
    });
    // next loop through the paths and extend everything using _mvc
    for (var i = 0; i < this._framework.paths.length; i++) {
      this.extend(this._framework.paths[i].subClass, this._framework.paths[i].fn);
    };
  };

  app.prototype.buildDirectives = function() {
    this._directives = {};
    for (var key in this._framework.directives) {
      var directive = Path.get(key).getValueFrom(this._framework.mvc);
      var name = this._framework.directives[key].name || key;
      var o = $.extend({}, this._framework.directives[key]);
      o.directive = directive;
      this._directives[name] = o;
    }
  };

  app.prototype.addDirective = function(subClass, obj) {
    if (!obj.name) {
      console.warn('Directive must have a name', obj);
      return;
    }
    // Return camelCase version.
    var name = utils.toCamelCase(obj.name);
    var path = this.add(subClass, obj.directive, name);
    this._framework.directives[path] = obj;
  };

  app.prototype.setAdmin = function(isAdmin) {
    this._mvc['base'].prototype._isAdmin = !!isAdmin;
  };

  app.prototype.init = function(framework){
    this._framework = framework;
    this.extendAll();
    this.buildDirectives();
    this.viewParser = new viewParser(this._directives);
    return this;
  };


  var baseApp = function(){
    this.viewParser = new viewParser();
  };

  baseApp.prototype.addApp = function(name, inputApp) {
    var base = this;
    var oldInit = inputApp.prototype.init;
    if (oldInit) {
      inputApp.prototype.init = function() {
        this._super(base._framework);
        return oldInit.apply(this, arguments);
      }
    }
    var nApp = __subClass(app, inputApp);
    this._appClasses[name] = nApp;
  };

  baseApp.prototype.setAdmin = function(isAdmin){
    for (var i=0; i<this._apps.length; i++) {
      this._apps[i].setAdmin(isAdmin);
    }
  };

  baseApp.prototype.init = function() {
    this._appClasses = {};
    this._apps = {};
    this.utils = utils;
  };

  baseApp.prototype.initApps = function() {
    for (var key in this._appClasses) {
      this._apps[key] = new this._appClasses[key]();
    }
  };

  baseApp = __subClass(app, baseApp);

  global.$app = new baseApp();
  $(document).ready(function(){ global.$app.initApps(); });


})();