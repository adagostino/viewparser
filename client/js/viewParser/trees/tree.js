$require('tree', ['idGenerator'], function(IdGenerator) {
  var Tree = function() {};

  Tree.prototype.init = function() {
    this.id = IdGenerator();
    this.__id = this.id;
    this.parent = null;
    this.children = [];
    this.first = null;
    this.last = null;
    this.previous = null;
    this.next = null;
    this._map = {};
  };

  Tree.prototype.setRoot = function(root) {
    this.$root = root;
  };

  Tree.prototype.append = function(item) {
    var prev = this.children[this.children.length - 1];
    if (prev) {
      prev.next = item;
      item.previous = prev;
    }
    item.__setParent(this);
    this.children.push(item);
    this.__updateChildren();
    item._map = this._map;
    item.setRoot(this.$root);
    return item;
  };

  Tree.prototype.insertBefore = function(itemToInsert, beforeThisItem) {
    if (!beforeThisItem) {
      return this.append(itemToInsert);
    }
    if (!beforeThisItem.parent || beforeThisItem.parent.id !== this.id) {
      console.warn('trying to insert a node', itemToInsert, 'before a node', beforeThisItem, 'that does not belong to this parent', this);
      return;
    }
    var idx = this._getIndexOfChild(beforeThisItem);
    if (idx === -1) {
      console.trace('Could not find the before child', beforeThisItem, 'on', this);
    }
    var prev = this.children[idx - 1];
    if (prev) {
      prev.next = itemToInsert;
      itemToInsert.previous = prev;
    }
    itemToInsert.next = beforeThisItem;
    beforeThisItem.previous = itemToInsert;
    itemToInsert.__setParent(this);
    this.children.splice(idx, 0, itemToInsert);
    this.__updateChildren();
    itemToInsert._map = this._map;
    itemToInsert.setRoot(this.$root);
    return itemToInsert;
  };

  Tree.prototype.moveBefore = function(beforeThisItem) {
    // TODO(TJ): findIndex is a big bottleneck. Should try to figure out how to do it another way.
    if (!this.parent) return;

    if (this.previous) {
      this.previous.next = this.next;
    }
    if (this.next) {
      this.next.previous = this.previous;
    }

    var idx = this.parent._getIndexOfChild(this);
    this.parent.children.splice(idx, 1);
    this.parent.insertBefore(this, beforeThisItem);
  };
  
  Tree.prototype.removeChild = function(item) {
    var idx = this._getIndexOfChild(item);
    if (idx === -1) {
      console.warn('trying to remove a node', item, 'that is not a child of', this);
      return;
    }
    var prev = this.children[idx - 1],
        next = this.children[idx + 1];
    if (prev) prev.next = next;
    if (next) next.previous = prev;
    this.children.splice(idx, 1);
    this.__updateChildren();
  };

  Tree.prototype.removeSelf = function() {
    if (!this.parent) return;
    this.parent.removeChild(this);
  };

  Tree.prototype.__updateChildren = function() {
    this.first = this.children[0];
    this.last = this.children[this.children.length - 1];
  };

  Tree.prototype.__setParent = function(item) {
    this.parent = item;
  };

  Tree.prototype._getIndexOfChild = function(item) {
    for (var i=0; i<this.children.length; i++) {
      if (this.children[i].id === item.id) {
        return i;
      }
    }
    return -1;
  };

  return Tree;
});