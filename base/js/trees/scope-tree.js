var __className = 'scopeTree';
$require(__className, ['extend', 'singleton', 'tree'], function(extend, singleton, Tree) {
  var _scopeTreeMap = {};

  this._scopeTreeMap = _scopeTreeMap;

  var ScopeTree = function() {};

  ScopeTree.prototype.__className = __className;

  ScopeTree.prototype.init = function($scope) {
    this._super();
    this.$scope = $scope;
    this._childMap = {};
    this.__$scopeId = this.__id;
    // scope listeners
    this._listeners = {};
  };

  ScopeTree.prototype.create = function($scope) {
    return new ScopeTree($scope);
  };

  ScopeTree.prototype.append = function($scope) {
    if (this.hasChild($scope)) return this._childMap[$scope.__$scopeId];
    var scopeTreeObj = $scope.__className !== 'scopeTree' ? this.create($scope) : $scope;
    this._super(scopeTreeObj);
    this._childMap[scopeTreeObj.__$scopeId] = scopeTreeObj;
    _scopeTreeMap[scopeTreeObj.__$scopeId] = scopeTreeObj;
    scopeTreeObj.setPointers();

    return scopeTreeObj;
  };

  ScopeTree.prototype.hasChild = function($scope) {
    return !!this._childMap[$scope.__$scopeId];
  };

  ScopeTree.prototype.removeChild = function($scope) {
    var scopeTreeObj = _scopeTreeMap[$scope.__id];
    if (!scopeTreeObj) return;
    while (scopeTreeObj.children.length) {
      scopeTreeObj.children[0].removeSelf();
    }
    this._super(scopeTreeObj);
    this._childMap[scopeTreeObj.__$scopeId] = null;
    _scopeTreeMap[scopeTreeObj.__$scopeId] = null;
    this.setPointers();
    // Add'l stuff here.

  };

  ScopeTree.prototype.removeSelf = function() {
    console.log(this.__id);
    for (var i=0; i<this.children.length; i++) {
      this.children[i].removeSelf();
    }
    try {
      this.triggerEventOnSelf('$remove', this.$scope);
      this.$scope.$call(this.$scope, this.$scope.$onRemove);
      this.$scope.removeObservers();
      this.$scope.removeRoutes();
    } catch(err) {}
    this._super();
  };

  ScopeTree.prototype.setPointers = function() {
    this._setScopePointers();
  };

  ScopeTree.prototype._setScopePointers = function() {
    if (!this.$scope) return;
    // Set the id of the $scope.
    this.$scope.__$scopeId = this.__$scopeId;
    this.$scope.$parentScope = this.parent ? this.parent.$scope : null;
  };

  ScopeTree.prototype.insertBefore = function() {
    this._super.apply(this, arguments);
    this.setPointers();
  };

  ScopeTree.prototype.getTreeFromScope = function($scope) {
    return $scope ? _scopeTreeMap[$scope.__$scopeId] : null;
  };

  // Listener functions
  ScopeTree.prototype.addListener = function(event, callback, capture) {
    var a = this._listeners[event];
    if (!a) this._listeners[event] = a = [];
    a.push({
      'callback': callback,
      'eventPhase': !!capture ? EVENTS.CAPTURING_PHASE : EVENTS.AT_TARGET
    });
  };

  ScopeTree.prototype.removeListener = function(event, callback) {
    if (!event) this._listeners = {};
    if (!this._listeners[event]) return;
    if (callback) {
      for (var i=0; i<this._listeners[event].length; i++) {
        if (this._listeners[event][i].callback === callback) {
          this._listeners[event][i].splice(i, 1);
          return;
        }
      }
    } else {
      this._listeners[event] = [];
    }
  };

  var EVENTS = {
    'CAPTURING_PHASE': 1,
    'AT_TARGET': 2,
    'BUBBLING_PHASE': 3
  };

  ScopeTree.prototype._createEvent = function(event, phase) {
    return {
      'type': event,
      'target': this.$scope,
      'eventPhase': typeof phase === 'number' ? phase : EVENTS.CAPTURING_PHASE,
      'defaultPrevented': false,
      'cancelBubble': false,
      'preventDefault': function() {
        this.defaultPrevented = true;
      },
      'stopPropagation': function() {
        this._propagationStopped = true;
        this.cancelBubble = true;
      },
      'stopImmediatePropagation': function() {
        this._propagationStopped = true;
        this.cancelBubble = true;
        this._immediatePropagationStopped = true;
      }
    }
  };

  ScopeTree.prototype.triggerEventOnSelf = function(event, params) {
    var e = this._createEvent(event);
    e.eventPhase = EVENTS.BUBBLING_PHASE;
    this._fireEvent(e, params);
  };

  ScopeTree.prototype.triggerListener = function(event, params) {
    var e = this._createEvent(event);
    this._captureEvent(e, params);
    e.eventPhase = EVENTS.BUBBLING_PHASE;
    this._bubbleEvent(e, params);
  };

  ScopeTree.prototype.broadcastListener = function(event, params) {
    var e = this._createEvent(event);
    e.eventPhase = EVENTS.BUBBLING_PHASE;
    this._captureEvent(e, params);
  };

  ScopeTree.prototype._fireEvent = function(e, params) {
    if (!this._listeners[e.type] || e.defaultPrevented) return;
    for (var i=0; i<this._listeners[e.type].length; i++) {
      var o = this._listeners[e.type][i];
      if (e._immediatePropagationStopped) {
        break;
      }
      if (e.eventPhase >= o.eventPhase) {
        o.callback.call(this.$scope, e, params);
      }
    }
  };

  ScopeTree.prototype._captureEvent = function(e, params) {
    this._fireEvent(e, params);
    for (var i=0; i<this.children.length; i++) {
      if (e._propagationStopped || e.cancelBubble) break;
      this.children[i]._captureEvent(e, params);
    }
  };

  ScopeTree.prototype._bubbleEvent = function(e, params) {
    this._fireEvent(e, params);
    this.parent && !e._propagationStopped && !e.cancelBubble && this.parent._bubbleEvent(e, params);
  };

  ScopeTree = extend(Tree, ScopeTree);

  return singleton.create(ScopeTree);
});