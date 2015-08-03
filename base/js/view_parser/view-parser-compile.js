(function(global){
  global = global || window;
  var viewParser = global.viewParser;

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
      this.setScopeMap($scope[this._id], $scope);
    }

    var doc = this.textOnly ? virtualDocument : document;

    // Create the element.
    switch(template.tag) {
      case 'documentfragment':
        el = doc.createDocumentFragment();
        addToScopeTree = false;
        break;
      case 'textnode':
        var el = doc.createTextNode('');
        var textObserver = this.compileTextWatch(el, template.text, $scope);
        textObserver && observers.push(textObserver);
        addToScopeTree = false;
        break;
      case 'comment':
        var el = doc.createComment(template.text);
        break;
      default:
        el = doc.createElement(template.tag);
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

    // Run through the attributes and add them to the element and set up watchers.
    for (var i=0; i<template.attributes.length; i++) {
      var attr = template.attributes[i];
      el.setAttribute(attr.name, attr.value);
      if (!attr.directive && !attr.controller) {
        var attrObserver = this.compileAttrWatch(el, attr, $scope);
        attrObserver && observers.push(attrObserver);
      }
    }

    // Next create a controller if it's there
    var $isolateScope;
    // Next run through the views.
    for (var i=0; i<template.views.length; i++) {
      var attr = template.views[i],
          type = attr.directive ? 'directive' : 'controller';
      var dir = this._compileMVC(attr, $scope, el, template.attributes, type);
      if (dir.$scope) {
        $isolateScope = dir.$scope;
      }
      if (dir.observers.length) {
        dir.observers.splice(0, 0, observers.length, 0);
        Array.prototype.splice.apply(observers, dir.observers);
      }
      if (dir.el) {
        // If the element switches due to a directive (like an 'if' directive), then reset the element,
        // its scope, and its template (also reset the index so it starts to loop again).
        el = dir.el;
        scopeTreeObj = this.getScopeTreeObjFromEl(el);
        template = this.getTemplateFromEl(el);
        i = 0;
        // Maybe should break? but probably not.
      }
    }
    // Add to the scopeTree.
    if (scopeTreeObj && observers.length) {
      observers.splice(0, 0, scopeTreeObj.observers.length, 0);
      Array.prototype.splice.apply(scopeTreeObj.observers, observers);
    }

    // Now go through the children.
    var child;
    for (var i=0; i<template.children.length; i++) {
      child = this.compileTemplate(this.getTemplate(template.children[i]), $isolateScope || $scope, id || parentId, el);
      // If it hasn't been added to the el yet, then add it (children are typically added to the parent above)
      child && !child.parentNode && el.appendChild(child);
    }
    return el;
  };

  viewParser.prototype._getCompiledText = function(watchObj, $scope) {
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
    return {
      'func': compileFunc,
      'value': compiled.value,
      'watches': compiled.watches
    }
  };

  viewParser.prototype.compileTextWatch = function(el, watchObj, $scope) {
    var compiled = this._getCompiledText(watchObj, $scope);

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
      el.nodeValue = compiled.func().value;
    });

    return observer;
  };

  viewParser.prototype._getCompiledAttr = function(attr, $scope) {
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
    return {
      'func': compileFunc,
      'value': compiled.value,
      'watches': compiled.watches
    }
  };

  viewParser.prototype.compileAttrWatch = function(el, attr, $scope) {
    var compiled = this._getCompiledAttr(attr, $scope);
    var attrName = attr.name;

    el.setAttribute(attrName, compiled.value);
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
      el.setAttribute(attrName, compiled.func().value);
    });

    return observer;
  };

  viewParser.prototype._compileMVC = function(attr, $scope, el, attrs, type) {
    var mvcObj = attr[type].value;

    var obj = {
      '$scope': null,
      'observers': []
    };
    var attrObj = {};
    for (var i=0; i<attrs.length; i++) {
      attrObj[attrs[i].name] = attrs[i].value;
    }

    if (mvcObj.$scope) {
      // Then it's an isolate scope.
      $scope = {
        '$parentScope': $scope
      };
      obj.observers = this.parseIsolateScope(mvcObj.$scope, $scope, el);
    }
    // Instantiate the new directive and pass in $scope, el, attrs.
    var d = new mvcObj[type](attrObj, el, $scope);
    if (mvcObj.interrupts && (this.getElId(d.el) !== this.getElId(el))) {
      obj.el = d.el;
    }
    if (mvcObj.$scope) {
      obj.$scope = d;
    }
    this.addViewToEl(d.el, d);
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