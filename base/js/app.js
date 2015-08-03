(function (global) {
  global = global || window;

  var _dashesRegex = /-(.)/g,
      _firstLetterRegex = /^./,
      _hasNonDigitsRegex = /\D+/;

  var utils = {
    toCamelCase: function(str) {
      return (str || "").replace(_dashesRegex, function($0, $1){return $1.toUpperCase();})
                        .replace(_firstLetterRegex,function($0) {return $0.toLowerCase()});
    },
    isNumber: function(str) {
      return !_hasNonDigitsRegex.test(str);
    }
  };

  var app = function(){};

  app.prototype.__beforeInit = function() {
    this._framework = {
      'mvc': {},
      'paths': [],
      'directives': {},
      'controllers': {},
      'pathStr': ''
    };
    this._mvc = {};
    this._classes = {};
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

  app.prototype._buildMVC = function(type) {
    var types = type + 's',
        _types = '_' + types;
    this[_types] = {};
    for (var key in this._framework[types]) {
      var temp = Path.get(key).getValueFrom(this._framework.mvc);
      var name = this._framework[types][key].name || key;
      var o = $.extend({}, this._framework[types][key]);
      o[type] = temp;
      this[_types][name] = o;
    }
  };

  app.prototype.buildDirectives = function() {
    this._buildMVC('directive');
  };

  app.prototype.buildControllers = function() {
    this._buildMVC('controller');
  };

  app.prototype._addToMVC = function(subClass, obj, type) {
    var types = type + 's';
    if (!obj.name) {
      console.warn('Directive must have a name', obj);
      return;
    }
    // Return camelCase version.
    var name = utils.toCamelCase(obj.name);
    var path = this.add(subClass, obj[type], name);
    this._framework[types][path] = obj;
  };

  app.prototype.addDirective = function(subClass, obj) {
    this._addToMVC(subClass, obj, 'directive');
  };

  app.prototype.addController = function(subClass, obj) {
    // Every controller is an isolate scope.
    if (!obj.$scope) obj.$scope = {};
    this._addToMVC(subClass, obj, 'controller');
  };

  app.prototype.setAdmin = function(isAdmin) {
    this._mvc['base'].prototype._isAdmin = !!isAdmin;
  };

  app.prototype.init = function(framework, viewParser){
    this._framework = framework;
    this.extendAll();
    this.buildDirectives();
    this.buildControllers();
    this.viewParser = viewParser;
    this.viewParser.addDirectives(this._directives);
    this.viewParser.addControllers(this._controllers);

    return this;
  };


  var baseApp = function(){};

  baseApp.prototype.addApp = function(obj) {
    // Remember to parse out the template and compile it here.
    var base = this,
        name = obj.name,
        template = obj.template,
        inputApp = obj.app;
    var oldInit = inputApp.prototype.init;
    if (oldInit) {
      inputApp.prototype.init = function() {
        this._super(base._framework, base.viewParser);
        return oldInit.apply(this, arguments);
      }
    }
    var nApp = __subClass(app, inputApp);
    this._appClasses[name] = {
      'name': name,
      'template': template,
      'app': nApp
    };
  };

  baseApp.prototype.setAdmin = function(isAdmin){
    for (var i=0; i<this._apps.length; i++) {
      this._apps[i].setAdmin(isAdmin);
    }
  };

  baseApp.prototype.init = function() {
    this.viewParser = new viewParser();
    this._appClasses = {};
    this._apps = {};
    this.utils = utils;
  };

  baseApp.prototype.initApps = function() {
    for (var key in this._appClasses) {
      this._apps[key] = this.initApp(this._appClasses[key]);
    }
  };

  baseApp.prototype.initApp = function(appObj) {
    var inputApp = appObj.app,
        name = appObj.name,
        el = document.querySelector('[dc-app="'+ name +'"]');
    if (!el) {
      console.warn('Could not find element for dc-app="'+ name + '". Do you think you added it? Make sure your app file has the correct name.');
      return;
    }
    var startTime = new Date().getTime();
    var textOnly = 0;

    viewParser.prototype.textOnly = !!textOnly;
    var startTime = new Date().getTime();
    var template = appObj.template || el.innerHTML,
        $scope = new inputApp(),
        child = this.viewParser.compile(template, $scope);
    // For now let's replace the contents of the app.
    if (textOnly) {
      setTimeout(function () {
        var buildTime = new Date().getTime();
        console.log(buildTime - startTime);
        el.innerHTML = child.buildHTML();
        console.log(new Date().getTime() - buildTime);
      }, 0);
    } else {
      el.appendChild(child);
    }
    console.log(new Date().getTime() - startTime);
  };

  baseApp = __subClass(app, baseApp);

  global.$app = new baseApp();
  $(document).ready(function(){ global.$app.initApps(); });


})();