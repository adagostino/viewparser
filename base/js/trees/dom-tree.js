var __className = 'domTree';
$require(__className,
[
  'extend',
  'singleton',
  'scopeTree',
  'idGenerator',
  'tree'
],
function(
  extend,
  singleton,
  scopeTree,
  idGenerator,
  Tree
) {

  var _domTreeMap = {};

  this._domTreeMap = _domTreeMap;

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
    _domTreeMap[domTreeObj.__id] = domTreeObj;

    domTreeObj.setScope($scope);
    return domTreeObj;
  };

  DomTree.prototype.setScope = function(scopeTreeObj) {
    this.parentScopeTree = (this.parent.scopeTree || scopeTree);
    this.scopeTree = scopeTreeObj || this.scopeTree;
  };

  var _isSameScope = function(domTree1, domTree2) {
    if (!domTree1 || !domTree2 || !domTree1.scopeTree || !domTree2.scopeTree) {
      return false;
    }
    return domTree1.scopeTree.__$scopeId === domTree2.scopeTree.__$scopeId;
  };

  DomTree.prototype.removeChild = function(el) {
    // Add'l stuff here.
    var domTreeObj = _domTreeMap[el.__id];
    // Run through this element's children.
    while (domTreeObj.children.length) {
      domTreeObj.children[0].removeSelf();
    }

    for (var i=0; i<domTreeObj.views.length; i++) {
      domTreeObj.views[i].removeSelf();
    }

    for (var i=0; i<domTreeObj.observers.length; i++) {
      domTreeObj.observers[i].close();
    }

    for (var key in domTreeObj.listeners) {
      var removeListener = domTreeObj.listeners[key];
      removeListener && removeListener();
    }

    var sameScopeAsParent = _isSameScope(domTreeObj, this),
        sameScopeAsPrevious = _isSameScope(domTreeObj, domTreeObj.previous),
        sameScopeAsNext = _isSameScope(domTreeObj, domTreeObj.next);

    var removeScope = !sameScopeAsParent && !sameScopeAsPrevious && !sameScopeAsNext;
    if (removeScope) {
      // Perhaps fire some kind of event listener on the actual scope sometime.
      domTreeObj.scopeTree.removeSelf();
    }
    domTreeObj.el && domTreeObj.el.parentNode && domTreeObj.el.parentNode.removeChild(domTreeObj.el);
    //this.el && this.el.removeChild(domTreeObj.el);
    _domTreeMap[el.__id] = null;
    this._super(el);
  };

  DomTree.prototype.empty = function() {
    while (this.children.length) {
      this.removeChild(this.children[0]);
    }
  };

  DomTree.prototype.moveBefore = function(beforeThisEl) {
    this._super(beforeThisEl);
    // Move it in the DOM.
    try {
      beforeThisEl.parent.el.insertBefore(this.el, beforeThisEl ? beforeThisEl.el : null);
    } catch(err) {
      console.log(err);
    }
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
    return el ? _domTreeMap[el.__id] : null;
  };

  DomTree = extend(Tree, DomTree);

  return singleton.create(DomTree);
});