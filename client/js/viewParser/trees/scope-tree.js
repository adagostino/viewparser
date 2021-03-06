var __className = 'scopeTree';
$require(__className, ['extend', 'tree'], function(extend, Tree) {

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
    this._map[scopeTreeObj.__$scopeId] = scopeTreeObj;
    scopeTreeObj.setPointers();

    return scopeTreeObj;
  };

  ScopeTree.prototype.hasChild = function($scope) {
    return !!this._childMap[$scope.__$scopeId];
  };

  ScopeTree.prototype.lazyRemoveSelf = function() {
    this._onRemove();
    this.lazyRemoveChildren();
  };

  ScopeTree.prototype.lazyRemoveChildren = function() {
    for (var i = 0; i < this.children.length; i++) {
      var childTree = this.children[i];
      childTree.lazyRemoveChildren();
      childTree._onRemove();
    }
  };

  ScopeTree.prototype.removeChildren = function() {
    while (this.children.length) {
      var childTree = this.children.splice(0, 1)[0];
      this._childMap[childTree.__$scopeId] = null;
      childTree._onRemove();
      childTree.removeChildren();
    }
  };

  ScopeTree.prototype.removeChild = function($scope) {
    var scopeTreeObj = this._map[$scope.__id];
    if (!scopeTreeObj) return;
    scopeTreeObj.removeChildren();
    this._childMap[scopeTreeObj.__$scopeId] = null;
    this._map[scopeTreeObj.__$scopeId] = null;
    // Set the pointers.
    this.setPointers();
    // Add'l stuff here.
    this._super(scopeTreeObj);
  };

  ScopeTree.prototype.removeSelf = function() {
    if (!this._map[this.__id]) return;
    // Next call super which will call removeChild.
    this._super();
    // Now trigger the remove on itself.
    this._onRemove();
  };

  ScopeTree.prototype._onRemove = function() {
    this._map[this.__$scopeId] = null;
    this.$scope.$onRemove && this.$scope.$onRemove();
    this.$scope.removeObservers && this.$scope.removeObservers();
    this.triggerEventOnSelf('$remove', this.$scope);
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
    return $scope ? this._map[$scope.__$scopeId] : null;
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

  ScopeTree.prototype.triggerBroadcast = function(event, params) {
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

  return ScopeTree;
});