var __className = 'node';
$require(__className, ['idGenerator'], function(idGenerator) {
  /* Node */
  var Node = function(){};

  Node.prototype.init = function() {
    this.__id = idGenerator();
    this.childNodes = [];
    this.parentNode = null;
    this.nodeType = null;
    this.startTag = '';
    this.endTag = '';
    this.tabIndex = -1;
    this.firstChild = null;
    this.firstElementChild = null;
    this.lastChild = null;
    this.lastElementChild = null;

    // Still need to implement
    this.nodeName = '';
    this.parentElement = null; // not in jquery
    this.classList = []; // not in jquery
    this.children = []; // not in jquery

    this.offsetParent = null; //https://drafts.csswg.org/cssom-view/#dom-htmlelement-offsetparent
  };
  
  Node.prototype.appendChild = function(childNode) {
    var prevSibling = this.childNodes[this.childNodes.length - 1];
    if (prevSibling) {
      prevSibling.nextSibling = childNode;
      childNode.previousSibling = prevSibling;
    }
    childNode.__setParent(this);
    this.childNodes.push(childNode);
    this.__updateChildren();
  };
  
  Node.prototype.insertBefore = function(nodeToInsert, beforeThisNode) {
    if (!beforeThisNode) {
      return this.appendChild(nodeToInsert);
    }
    if (!beforeThisNode.parentNode || beforeThisNode.parentNode.__id !== this.__id) {
      console.warn('trying to insert a node', nodeToInsert, 'before a node', beforeThisNode, 'that does not belong to this parent', this);
      return;
    }
    var idx = this._getIndexOfChildNode(beforeThisNode);
    if (idx === -1) {
      console.warn('Coulding find the before childNode', beforeThisNode, 'on', this);
      return;
    }

    var prev = this.childNodes[idx - 1];
    if (prev) {
      prev.nextSibling = nodeToInsert;
      nodeToInsert.previousSibling = prev;
    }
    nodeToInsert.nextSibling = beforeThisNode;
    beforeThisNode.previousSibling = nodeToInsert;
    nodeToInsert.__setParent(this);

    this.childNodes.splice(idx, 0, nodeToInsert);
    this.__updateChildren();
  };
  
  Node.prototype.removeChild = function(childNode) {
    var idx = this._getIndexOfChildNode(childNode);
    if (idx === -1) {
      console.warn('trying to remove a node', childNode, 'that is not a child of', this);
      return;
    }
    var prev = this.childNodes[idx - 1],
        next = this.childNodes[idx + 1];
    if (prev) {
      prev.nextSibling = next;
    }
    if (next) {
      next.previousSibling = prev;
    }
    this.childNodes.splice(idx, 1);
    this.__updateChildren();
  };

  Node.prototype.replaceChild = function(newChild, oldChild) {
    console.log('need to implement replaceChild');
  };
  
  Node.prototype.__updateChildren = function() {
    this.firstChild = this.childNodes[0];
    this.lastChild = this.childNodes[this.childNodes.length - 1];
    this.firstElementChild = null;
    this.lastElementChild = null;
    var firstFound = false,
        lastFound = false,
        ct = 0,
        len = this.childNodes.length;
    while (!firstFound && ct < len) {
      if (this.childNodes[ct].nodeType === 1) {
        firstFound = true;
        this.firstElementChild = this.childNodes[ct];
      }
      ct++;
    }
    ct = len -1;
    while (!lastFound && ct > -1) {
      if (this.childNodes[ct].nodeType === 1) {
        lastFound = true;
        this.lastElementChild = this.childNodes[ct];
      }
      ct--;
    }
  };
  
  Node.prototype.__setParent = function(parent){
    this.parentNode = parent;
    this.parentElement = parent.nodeType === 1 ? parent : null;
  };

  Node.prototype._getIndexOfChildNode = function(childNode) {
    var idx = -1;
    for (var i=0; i<this.childNodes.length; i++) {
      if (this.childNodes[i].__id === childNode.__id) {
        return i;
      }
    }
    return idx;
  };

  return Node;
});