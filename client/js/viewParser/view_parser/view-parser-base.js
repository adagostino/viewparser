var __className = 'viewParserBase';
$require(__className,
[
  'extend',
  'virtualDocument',
  'scopeTree',
  'domTree',
  'listener',
  'ajax'
],
function(
  extend,
  virtualDocument,
  ScopeTree,
  DomTree,
  Listener,
  Ajax
) {
  var global = this;

  //var document = this.document || virtualDocument;

  var ajax = new Ajax();

  var ViewParser = function(){};

  ViewParser.prototype.init = function() {
    this._id = "__vp" + new Date().getTime();
    this._parsedTemplates = {};
    this.apps = {};
    this.directives = {};
    this.controllers = {};
  };

  ViewParser.prototype._addToMVC = function(obj, type) {
    // name, directive, template, $scope
    obj.name = obj.name || this.__get__className();
    this[type][obj.name] = obj;
  };

  ViewParser.prototype.addDirective = function(directive) {
    this._addToMVC(directive, 'directives');
    return directive['directive'];
  };

  ViewParser.prototype.addController = function(controller) {
    // Every controller is an isolate scope.
    if (!controller.$scope) controller.$scope = {};
    this._addToMVC(controller, 'controllers');
    return controller['controller'];
  };

  ViewParser.prototype.addApp = function(app) {
    this._addToMVC(app, 'apps');
    return app['app'];
  };

  // Template operations.
  var _fetchedTemplates = {};
  var _templateMap = {};

	ViewParser.prototype.getTemplate = function(id) {
		return _templateMap[id];
	};

  ViewParser.prototype.getTemplateFromEl = function(el) {
		return this.getTemplate(el.__templateId);
	};

	ViewParser.prototype.addTemplateToMap = function(template) {
		_templateMap[template.id] = template;
	};

  ViewParser.prototype._fetchTemplate = function(path, callback) {
    // get html
    if (_fetchedTemplates.hasOwnProperty(path)) {
      callback.call(this, _fetchedTemplates[path], path);
    } else {
      var html = '';
      ajax.$get({
        'url': path,
        'context': this,
        'done': function(data) {
          html = data;
        },
        'fail': function() {
          console.warn('failed to fetch', path,'. Please check the path.');
        },
        'always': function() {
          _fetchedTemplates[path] = html;
          this.$call(this, callback, html, path);
        }
      });
    }
  };

  // Dom tree and scope operations.

  ViewParser.prototype.createDomObject = function(template, scopeTreeObj, parentDomTree, detached) {
    // Create the element.
    var el,
        observers = [],
        addToDomTree = true;

    scopeTreeObj = scopeTreeObj.__className !== 'scopeTree' ? new ScopeTree(scopeTreeObj) : scopeTreeObj;
    var $scope = scopeTreeObj.$scope || scopeTreeObj;

    switch(template.tag) {
      case 'documentfragment':
        el = document.createDocumentFragment();
        addToDomTree = false;
        break;
      case 'textnode':
        el = document.createTextNode('');
        var textObserver = this.compileTextWatch(el, template.text, $scope);
        textObserver && observers.push(textObserver);
        addToDomTree = !!textObserver;
        break;
      case 'comment':
        el = document.createComment(template.text);
        break;
      default:
        el = document.createElement(template.tag);
        break;
    }

    // Add the element to the Dom.
    !detached && parentDomTree && parentDomTree.el && parentDomTree.el.appendChild(el);

    // Now add the element to the dom tree.
    if (parentDomTree && parentDomTree.detachedParentDomTree) {
      parentDomTree = parentDomTree.detachedParentDomTree;
    } else {
      parentDomTree = parentDomTree && parentDomTree.append ? parentDomTree : new DomTree();
    }
    var childDomTree;
    if (addToDomTree) {
      childDomTree = parentDomTree.append(el, scopeTreeObj);
      childDomTree.addObservers(observers);
      childDomTree.el.__templateId = template.id;
    } else {
      childDomTree = {
        'el': el,
        'scopeTree': scopeTreeObj
      };
      if (detached) childDomTree.detachedParentDomTree = parentDomTree;
    }
    return childDomTree;
  };

  ViewParser.prototype.textOnly = false;

  return extend(Listener, ViewParser);
});