(function(global){
  global = global || window;
  var viewParser = global.viewParser;

  var _scopeTree = {},
      _scopeMap = {},
      _templateMap = {};

	viewParser.prototype.getTemplate = function(id) {
		return _templateMap[id];
	};

	viewParser.prototype.getTemplateFromEl = function(el) {
		return this.getTemplate(el.__templateId);
	};

	viewParser.prototype.addTemplateToMap = function(template) {
		_templateMap[template.id] = template;
	};

  viewParser.prototype.addToScopeTree = function(id) {
    var scopeTreeObj = _scopeTree[id];
    if (scopeTreeObj) return scopeTreeObj;
    scopeTreeObj = {
      'el': null,
      '$scope': null,
      'children': [],
      'observers': [],
      'listeners': {},
      'views': []
    };
    _scopeTree[id] = scopeTreeObj;
    return scopeTreeObj;
  };

  viewParser.prototype.getScopeFromTree = function(id) {
    return _scopeTree[id];
  };

  var _getScopeId = function(el, suppress) {
    if (!el || !el.__viewParser || !el[el.__viewParser]) {
      !suppress && console.warn('Trying to access an element that is not in the scopeTree. Adding observers and listeners will not work.', el);
      return;
    }
    return el[el.__viewParser];
  };

  viewParser.prototype.getElId = function(el) {
    return _getScopeId(el, true);
  };

  viewParser.prototype.getElById = function(id) {
    var scopeTreeObj = this.getScopeFromTree(id);
    return scopeTreeObj ? scopeTreeObj.el : null;
  };

  viewParser.prototype.getScopeTreeObjFromEl = function(el, suppress) {
    var id = _getScopeId(el, suppress);
    if (!id) return;
    return this.getScopeFromTree(id);
  };

  viewParser.prototype.getScopeFromEl = function(el, suppress) {
    var scopeTreeObj = this.getScopeTreeObjFromEl(el, suppress);
    if (!scopeTreeObj) return;
    return _scopeMap[scopeTreeObj.$scope];
  };

  viewParser.prototype.setScopeMap = function(id, $scope) {
    _scopeMap[id] = $scope;
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

  viewParser.prototype.addViewToEl = function(el, view) {
    if (!el || !view) return;
    var scopeTreeObj = this.getScopeTreeObjFromEl(el);
    if (!scopeTreeObj) return;
    scopeTreeObj.views.push(view);
  };

  viewParser.prototype._removeScope = function(id, parentScopeTreeObj) {
    var removeFromParent = !!! parentScopeTreeObj;
    var scopeTreeObj = this.getScopeFromTree(id);
    if (!scopeTreeObj) return;

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

    parentScopeTreeObj = parentScopeTreeObj || this.getScopeTreeObjFromEl(scopeTreeObj.el.parentElement, true);
    var removeScope = !parentScopeTreeObj || (parentScopeTreeObj.$scope !== scopeTreeObj.scope);
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

    for (var i=0; i<scopeTreeObj.views.length; i++) {
      var view = scopeTreeObj.views[i];
      try {
        view.$remove.apply(view);
      } catch (err) {

      }
    }

    if (scopeTreeObj.el.parentNode) {
      scopeTreeObj.el.parentNode.removeChild(scopeTreeObj.el);
    }
    // If it's the initial element removed, remove it from its parent.
    if (removeFromParent && parentScopeTreeObj) {
      for (var i=0; i<parentScopeTreeObj.children.length; i++) {
        if (parentScopeTreeObj.children[i] === id) {
          // Remove the child el from the parent
          parentScopeTreeObj.children.splice(i, 1);
          break;
        }
      }
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


})()