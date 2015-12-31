var __className = 'viewParserCompile';
$require(__className, ['viewParserParse'], function(ViewParser) {

  ViewParser.prototype.compile = function(html, $scope, parentDomTree, callback, detached) {
    this.parseTemplate(html, function(template) {
      callback(this.compileTemplate(template, $scope, parentDomTree, detached));
    }.bind(this));
  };

  ViewParser.prototype.compileTemplate = function(template, scopeTree, parentDomTree, detached) {
    var domTree = this.createDomObject(template, scopeTree, parentDomTree, detached);
    var el = domTree.el,
        scopeTree = domTree.scopeTree,
        $scope = scopeTree.$scope,
        observers = [];

    // Run through the attributes and add them to the element and set up watchers.
    for (var i=0; i<template.attributes.length; i++) {
      var attr = template.attributes[i];
      el.setAttribute(attr.name, attr.value);
      if (!attr.directive && !attr.controller && !attr.app) {
        var attrObserver = this.compileAttrWatch(el, attr, $scope);
        attrObserver && observers.push(attrObserver);
      }
    }

    observers.length && domTree.addObservers(observers);
    // Next run through the views.
    var views = [];
    for (var i=0; i<template.views.length; i++) {
      var dir = this._compileMVC(template.views[i], domTree, template.attributes);
      if (dir.scopeTree) {
        scopeTree = dir.scopeTree;
        $scope = scopeTree.$scope;
      }

      if (dir.domTree) {
        // If the element switches due to a directive (like an 'if' directive), then reset the element,
        // its scope, and its template (also reset the index so it starts to loop again).
        domTree = dir.domTree;
        el = domTree.el;
        template = this.getTemplateFromEl(el);
        i = 0;
        // Maybe should break? but probably not.
      }

      if (dir.view) {
        views.push(dir.view);
      }
    }
    // Now go through the children.
    var child;
    for (var i=0; i<template.children.length; i++) {
      child = this.compileTemplate(this.getTemplate(template.children[i]), scopeTree, domTree);
    }
    // Now after all of the children have been added, trigger render on the view.
    for (var i=0; i<views.length; i++) {
      views[i].$onRender && views[i].$onRender();
    }

    return el;

  };

  ViewParser.prototype._getCompiledText = function(watchObj, $scope) {
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

  ViewParser.prototype.compileTextWatch = function(el, watchObj, $scope) {
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

  ViewParser.prototype._getCompiledAttr = function(attr, $scope) {
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

  ViewParser.prototype.compileAttrWatch = function(el, attr, $scope) {
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

  ViewParser.prototype._compileMVC = function(attr, domTree, attrs) {
    var type = 'directive';
    if (attr.controller) {
      type = 'controller';
    } else if (attr.app) {
      type = 'app';
    }

    var mvcObj = attr[type].value,
        attrObj = {},
        obj = {};
    // Set up the attributes map.
    for (var i=0; i<attrs.length; i++) {
      attrObj[attrs[i].name] = attrs[i].value;
    }
    var view;
    switch(type) {
      case 'directive':
        // Next, instantiate the new directive and pass in $scope, el, attrs, and if it's an isolate scope.
        view = new mvcObj[type](attrObj, domTree.el, domTree, mvcObj.$scope);
        break;
      case 'controller':
        view = new mvcObj[type](attrObj, domTree.el, domTree);
        break;
      case 'app':
        view = new mvcObj[type](attrObj, domTree.el, domTree, mvcObj.router);
        break;
      default:
        break;
    }
    var viewDomTree = domTree.getTreeFromElement(view.el);
    viewDomTree.appendView(view.scopeTree);
    // If it interrupts
    if (mvcObj.interrupts) {
      obj.domTree = viewDomTree;
    }
    if (mvcObj.$scope) {
      obj.scopeTree = view.scopeTree;
    }
    if (view) {
      obj.view = view
    }
    return obj;
  };

  return ViewParser;
});