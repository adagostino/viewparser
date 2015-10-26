var __className = 'domTree';
$require(__className,
[
  'extend',
  'idGenerator',
  'tree'
],
function(
  extend,
  idGenerator,
  Tree
) {

  var DomTree = function() {};

  DomTree.prototype.__className = __className;

  DomTree.prototype.init = function(el) {
    this._super();
    this.el = el;
    this.scopeTree = null;
    this.parentScopeTree = null;
    this.listeners = {};
    this.observers = [];
    this.views = [];
  };

  DomTree.prototype.append = function(elOrDomTreeObj, $scope) {
    var domTreeObj = elOrDomTreeObj.__className !== 'domTree' ? new DomTree(elOrDomTreeObj) : elOrDomTreeObj;
    this._super(domTreeObj);
    domTreeObj.el.__id = domTreeObj.__id;
    this._map[domTreeObj.__id] = domTreeObj;
    domTreeObj.setScope($scope);

    return domTreeObj;
  };

  DomTree.prototype.setScope = function(scopeTreeObj) {
    this.parentScopeTree = this.parent.scopeTree;
    this.scopeTree = scopeTreeObj;
  };

  var _isSameScope = function(domTree1, domTree2) {
    if (!domTree1 || !domTree2 || !domTree1.scopeTree || !domTree2.scopeTree) {
      return false;
    }
    return domTree1.scopeTree.__$scopeId === domTree2.scopeTree.__$scopeId;
  };

  DomTree.prototype.lazyRemoveSelf = function() {
    this._onRemove(false, true);
    this.lazyRemoveChildren();
  };

  DomTree.prototype.lazyRemoveChildren = function() {
    for (var i = 0; i < this.children.length; i++) {
      var childTree = this.children[i];
      childTree.lazyRemoveChildren();
      childTree._onRemove(false, true);
      childTree.el = null;
    }
  };

  DomTree.prototype.removeChildren = function() {
    while (this.children.length) {
      var childTree = this.children.splice(0, 1)[0];
      childTree.removeChildren();
      childTree._onRemove(false);
    }
  };

  DomTree.prototype._onRemove = function(removeFromDom, lazy) {
    this._map[this.__id] = null;

    for (var i=0; i<this.observers.length; i++) {
      this.observers[i].close();
    }

    for (var key in this.listeners) {
      var removeListener = this.listeners[key];
      removeListener && removeListener();
    }

    // If you're doing a lazy remove, don't worry about scope stuff.
    if (lazy) return;

    for (var i=0; i<this.views.length; i++) {
      this.views[i].removeSelf();
    }

    var sameScopeAsParent = _isSameScope(this, this.parent),
      sameScopeAsPrevious = _isSameScope(this, this.previous),
      sameScopeAsNext = _isSameScope(this, this.next);

    var removeScope = !sameScopeAsParent && !sameScopeAsPrevious && !sameScopeAsNext;
    if (removeScope) {
      // Perhaps fire some kind of event listener on the actual scope sometime.
      this.scopeTree.removeSelf();
    }
    removeFromDom && this.el && this.el.parentNode && this.el.parentNode.removeChild(this.el);
  };

  DomTree.prototype.removeChild = function(el) {
    // Add'l stuff here.
    var domTreeObj = this._map[el.__id];
    if (!domTreeObj) return;
    this._super(el);
    // Run through this element's children.
    domTreeObj.removeChildren();
    domTreeObj._onRemove(true);
  };


  DomTree.prototype.moveBefore = function(beforeThisEl) {
    this._super(beforeThisEl);
    // Move it in the DOM.
    //try {
      beforeThisEl.parent.el.insertBefore(this.el, beforeThisEl ? beforeThisEl.el : null);
    //} catch(err) {
      //console.log(err);
    //}
    // Add'l scope stuff here.
    var id = this.scopeTree.__id,
        prevId = this.previous ? this.previous.scopeTree.__id : null,
        nextId = this.next ? this.next.scopeTree.__id : null;
    var nextScopeTree = this.next ? this.next.scopeTree : null;
    if (id !== prevId && id !== nextId) {
      this.scopeTree.moveBefore(nextScopeTree);
    }
  };

  DomTree.prototype.addObservers = function(observers) {
    observers.splice(0, 0, this.observers.length, 0);
    Array.prototype.splice.apply(this.observers, observers);
  };

  DomTree.prototype.appendView = function(view) {
    this.views.push(view);
  };

  DomTree.prototype.addEventListener = function(event, callback) {
    var eventName = event + '-' + idGenerator();
    var removeFunc = function() {
      this.el.removeEventListener(event, callback, false);
      this.listeners[eventName] = null;
    }.bind(this);
    this.listeners[eventName] = removeFunc;
    this.el.addEventListener(event, callback, false);
    return removeFunc;
  };

  DomTree.prototype.getTreeFromElement = function(el) {
    return el ? this._map[el.__id] : null;
  };

  DomTree = extend(Tree, DomTree);

  return DomTree;
});