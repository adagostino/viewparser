(function(global){
  global = global || window;

  var _scopeTree = {};
  var _scopeMap = {};

  viewParser.prototype.addToScopeTree = function(id) {
    var scopeTreeObj = _scopeTree[id];
    if (scopeTreeObj) return scopeTreeObj;
    scopeTreeObj = {
      'el': null,
      '$scope': null,
      'children': [],
      'observers': [],
      'listeners': {}
    };
    _scopeTree[id] = scopeTreeObj;
    return scopeTreeObj;
  };

  viewParser.prototype.getScopeFromTree = function(id) {
    return _scopeTree[id];
  };

  var _getScopeId = function(el) {
    if (!el || !el.__viewParser || !el[el.__viewParser]) {
      console.warn('Trying to access an element that is not in the scopeTree. Adding observers and listeners will not work.', el);
      return;
    }
    return el[el.__viewParser];
  };

  viewParser.prototype.getScopeTreeObjFromEl = function(el) {
    var id = _getScopeId(el);
    if (!id) return;
    return this.getScopeFromTree(id);
  };

  viewParser.prototype.getScopeFromEl = function(el) {
    return _scopeMap[this.getScopeTreeObjFromEl(el).$scope];
  };

  viewParser.prototype.addObserverToEl = function(el, observers) {
    if (!observers) return;
    observers = $.isArray(observers) ? observers : [observers];
    var scopeTreeObj = this.getScopeTreeObjFromEl(el);
    if (!scopeTreeObj) return;
    if (observers.length) {
      observers.splice(0, 0, scopeTreeObj.observers.length, 0);
      Array.prototype.splice.apply(scopeTreeObj.observers, observers);
    }
  };

  viewParser.prototype.addListenerToEl = function(el, event, callback) {
    var scopeTreeObj = this.getScopeTreeObjFromEl(el);
    if (!scopeTreeObj) return;
    var eventName = event + '-' + this.generateId();
    var removeFunc = function() {
      el.removeEventListener(event, callback, false);
      scopeTreeObj.listeners[eventName] = null;
    };
    scopeTreeObj.listeners[eventName] = removeFunc;
    el.addEventListener(event, callback, false);
    return removeFunc;
  };

  viewParser.prototype._removeScope = function(id, parentScopeObj) {
    var scopeTreeObj = this.getScopeFromTree(id);
    if (!scopeTreeObj) return;

    parentScopeObj = parentScopeObj || this.getScopeFromEl(scopeTreeObj.el.parentElement);
    for (var i=0; i<scopeTreeObj.children.length; i++) {
      this._removeScope(scopeTreeObj.children[i], scopeTreeObj);
    }

    for (var i=0; i<scopeTreeObj.observers.length; i++) {
      scopeTreeObj.observers[i].close();
    }

    for (var key in scopeTreeObj.listeners) {
      var removeListener = scopeTreeObj.listeners[key];
      removeListener && removeListener();
    }

    var removeScope = !parentScopeObj || (parentScopeObj.$scope !== scopeMapObj.scope);
    if (removeScope) {
      var $scope = _scopeMap[scopeTreeObj.$scope];
      if ($scope) {
        try {
          $scope.$remove.apply($scope);
        } catch (err) {

        }
        _scopeMap[scopeTreeObj.$scope] = null;
      }
    }
    if (scopeTreeObj.el.parentElement) {
      scopeTreeObj.el.parentElement.removeChild(scopeTreeObj.el);
    }
    _scopeTree[id] = null;
  };

  viewParser.prototype.removeEl = function(el) {
    this._removeScope(_getScopeId(el));
  };

  var _isOrphaned = function(el) {
    return el ? el.tagName === 'BODY' ? false : _isOrphaned(el.parentNode) : true;
  };

  viewParser.prototype.cleanScopeTree = function() {
    for (var key in _scopeTree) {
      var scopeTreeObj = this.getScopeFromTree(key);
      if (scopeTreeObj) {
        _isOrphaned(scopeTreeObj.el) && this._removeScope(key);
      }
    }
  };

  viewParser.prototype.compile = function(html, $scope) {
    return this.compileTemplate(this.parseTemplate(html), $scope);
  };

  viewParser.prototype.compileTemplate = function(template, $scope, parentId, parentEl) {
    var addToScopeTree = true,
        el,
        observers = [];

    if (!$scope) {
      console.log('$scope not passed into compile template. Setting to empty.');
      $scope = {};
    }

    if (!$scope[this._id]) {
      $scope.__viewParser = this._id;
      $scope[this._id] = this.generateId();
      _scopeMap[$scope[this._id]] = $scope;
    }

    // Create the element.
    switch(template.tag) {
      case 'documentfragment':
        el = document.createDocumentFragment();
        addToScopeTree = false;
        break;
      case 'textnode':
        var el = document.createTextNode('');
        var textObserver = this.compileTextWatch(el, template.text, $scope);
        textObserver && observers.push(textObserver);
        break;
      default:
        el = document.createElement(template.tag);
        break;
    }

    var scopeTreeObj,
        id;
    if (addToScopeTree) {
      id = this.generateId();
      el[this._id] = id;
      el.__viewParser = this._id;
      el.__templateId = template.id;
      scopeTreeObj = this.addToScopeTree(id);
      scopeTreeObj.el = el;
      scopeTreeObj.$scope = $scope[this._id];
      if (!$scope.el) $scope.el = el;

      if (parentId) {
        var parentScopeTreeObj = this.getScopeFromTree(parentId);
        parentScopeTreeObj && parentScopeTreeObj.children.push(id);
      }
    }

    if (parentEl) parentEl.appendChild(el);

    // Parse and watch the attributes.
    var $isolateScope;
    for (var i=0; i<template.attributes.length; i++) {
      var attr = template.attributes[i];
      if (attr.directive) {
        el.setAttribute(attr.name, attr.value);
        var dir = this.compileDirective(attr.directive.value, $scope, el, template.attributes);
        if (dir.$scope) {
          $.extend($isolateScope, dir.$scope);
        }
        if (dir.observers.length) {
          dir.observers.splice(0, 0, observers.length, 0);
          Array.prototype.splice.apply(observers, dir.observers);
        }
      } else {
        var attrObserver = this.compileAttrWatch(el, attr, $scope);
        attrObserver && observers.push(attrObserver);
      }
    }

    // Add to the scopeTree.
    if (scopeTreeObj && observers.length) {
      observers.splice(0, 0, scopeTreeObj.observers.length, 0);
      Array.prototype.splice.apply(scopeTreeObj.observers, observers);
    }

    var child;
    for (var i=0; i<template.children.length; i++) {
      child = this.compileTemplate(this.getTemplate(template.children[i]), $isolateScope || $scope, id || parentId, el);
      child && !child.parentElement && el.appendChild(child);
    }

    return el;
  };

  viewParser.prototype.compileTextWatch = function(el, watchObj, $scope) {
    var compileFunc = function() {
      var textStr ='',
          watches = [];
      if (watchObj.name === 'watch') {
        textStr += watchObj.parseFunc($scope);
        watches.push(watchObj.paths);
      } else {
        textStr += watchObj.value;
      }
      return {
        value: textStr,
        watches: watches
      }
    };

    var compiled = compileFunc();
    el.nodeValue = compiled.value;

    if (!compiled.watches.length) return;

    var observer = new CompoundObserver();
    for (var i=0; i<compiled.watches.length; i++) {
      var paths = compiled.watches[i];
      for (var j=0; j<paths.length; j++) {
        var path = paths[j];
        observer.addObserver(new PathObserver($scope, path));
      }
    }
    observer.open(function(newValues, oldValues) {
      el.nodeValue = compileFunc().value;
    });

    return observer;
  };

  viewParser.prototype.compileAttrWatch = function(el, attr, $scope) {
    var delim = '';
    var compileFunc = function() {
      var attrStr = '',
          watches = [];
      for (var i=0; i<attr.parsedValue.length; i++) {
        var item = attr.parsedValue[i];
        var value = '';
        if (item.name === 'watch') {
          value = item.parseFunc($scope);
          watches.push(item.paths);
        } else {
          value = item.value;
        }
        attrStr+= attrStr ? delim + value : value;
      }
      return {
        value: attrStr,
        watches: watches
      }
    };

    var compiled = compileFunc();
    var attrName = attr.name;
    el.setAttribute(attrName ,compiled.value);
    if (!compiled.watches.length) return;

    var observer = new CompoundObserver();
    for (var i=0; i<compiled.watches.length; i++) {
      var paths = compiled.watches[i];
      for (var j=0; j<paths.length; j++) {
        var path = paths[j];
        observer.addObserver(new PathObserver($scope, path));
      }
    }
    observer.open(function(newValues, oldValues){
      el.setAttribute(attrName, compileFunc().value);
    });

    return observer;
  };

  viewParser.prototype.compileDirective = function(directive, $scope, el, attrs) {
    var obj = {
      '$scope': null,
      'observers': [],
      'shouldContinue': true
    };

    var attrObj = {};
    for (var i=0; i<attrs.length; i++) {
      attrObj[attrs[i].name] = attrs[i].value;
    }

    if (directive.$scope) {
      // Then it's an isolate scope.
      $scope = {
        '$parentScope': $scope
      };
      obj.observers = this.parseIsolateScope(directive.$scope, $scope, el);
    }
    // Instantiate the new directive and pass in $scope, el, attrs.
    var d = new directive.directive(attrObj, el, $scope);

    return obj;
  };

  var isolateReg = /^[@=&]/;
  viewParser.prototype.parseIsolateScope = function ($isolateScope, $scope, el) {
    // $isolateScope is the $scope keyword of the directive, $scope is the instantiated directive.
    // get paths of the parentScope from the element attributes and set up binding
    // default - one-way binding from parent to child
    // "=" - 2-way binding from child to parent and vise versa
    // "@" - no binding, just the initial value
    // "&" - means it's a function to call
    var reg = isolateReg,
        observers = [];
    for (var key in $isolateScope) {
      (function (key) {
        var match = $isolateScope[key].match(reg),
            symbol = match ? match[0] : "",
            attr = symbol ? $isolateScope[key].slice(1) : $isolateScope[key],
            str = el.getAttribute(attr),
            value = Path.get(str).getValueFrom($scope.$parentScope);
        switch (symbol) {
          case "@":
            value = str;
            break;
          case "&":
            if (typeof value === "function") {
              var lastIndex = str.lastIndexOf('parentScope'),
                parentStr = lastIndex > -1 ? str.substr(0, lastIndex + 'parentScope'.length) : '',
                $parentScope = parentStr ? Path.get(parentStr).getValueFrom($scope.$parentScope) : $scope.$parentScope;

              var fn = value;
              value = function () {
                var tmp = this.$scope;
                this.$scope = $parentScope;
                var ret = fn.apply(self, arguments);
                this.$scope = tmp;
                return ret;
              };
            }
            break;
          case "=":
            // set a watch on the child and change the parent when the child changes
            var observer = new PathObserver(this, key);
            var callback = function (n, o) {
              Path.get(str).setValueFrom($scope.$parentScope, n);
            };
            observer.open(callback);
            observers.push(observer);
          default:
            // set a watch on the parent and change the child when the parent changes
            var observer = new PathObserver($scope.$parentScope, str);
            var callback = function (n, o) {
              Path.get(key).setValueFrom($scope, n);
            };
            observer.open(callback);
            observers.push(observer);
            break;
        };
        Path.get(key).setValueFrom($scope, value);
      }.bind(this))(key);
    }

    return observers;

  };


})();