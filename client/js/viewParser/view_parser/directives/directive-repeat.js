var __className = 'dc-repeat';
$require(__className,
[
  'viewParser',
  'extend',
  'utils',
  'directive'
],
function(
  viewParser,
  extend,
  utils,
  Directive
) {
  var _repeatReg = /^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/,
      _keyReg = /^(?:(\s*[\$\w]+)|\(\s*([\$\w]+)\s*,\s*([\$\w]+)\s*\))$/;

  var RepeatDirective = function(){};

  RepeatDirective.prototype.init = function(attrs) {
    // First get the template.
    this.watchKey = attrs[this.__className];
    this.setTemplate();

    // Next parse out the repeat.
    this._parseRepeatString();

    // Next replace element with a comment (like dc-if).
    this.addComment();

    this.$parseAndWatchCollection(this.rhs, this._onCollectionChanged, this.$scope);
  };

  RepeatDirective.prototype.setTemplate = function() {
    // Get the template.
    this.$compile(this.el, this.$scope, function(template) {
      this.elTemplate = $.extend(true, {}, template);
      // Now get rid of the directive from it so it doesn't repeat every time.
      var i = 0;
      while (i < this.elTemplate.views.length) {
        if (this.elTemplate.views[i].name === this.__className) {
          this.elTemplate.views.splice(i,1);
        } else {
          i++;
        }
      }
    }, true);
  };

  RepeatDirective.prototype._parseRepeatString = function() {
    var match = this.watchKey.match(_repeatReg);
    // TODO(TJ): throw error or warning if match is not found.
    this.lhs = match[1];
    this.rhs = match[2];
    this.aliasAs = match[3];
    this.trackByExp = match[4];

    match = this.lhs.match(_keyReg);
    var valueIdentifier = match[3] || match[4];
    var keyIdentifier = match[2];
    this.itemKey = keyIdentifier;
    this.valueKey = valueIdentifier || this.lhs;
    // TODO(TJ): test aliasAs against reserved keys.

    var hashFnLocals = {$id: utils.getId};
    if (this.trackByExp) {
      this.trackByExpGetter = utils.$parse(this.trackByExp);
    } else {
      this.trackByIdArrayFn = function (key, value) {
        return utils.getId(value);
      };
      this.trackByIdObjFn = function (key) {
        return key;
      };
    }

    if (this.trackByExpGetter) {
      this.trackByIdExpFn = function (key, value, index) {
        // assign key, value, and $index to the locals so that they can be used in hash functions
        if (keyIdentifier) hashFnLocals[keyIdentifier] = key;
        hashFnLocals[valueIdentifier] = value;
        hashFnLocals.$index = index;
        return this.trackByExpGetter(this.$scope, hashFnLocals);
      }.bind(this);
    }

    this.lastBlockMap = {};
  };

  RepeatDirective.prototype.addComment = function() {
    // Create the comment.
    this.$compile('<!-- ' + this.__className + '-start="' + this.watchKey + '" -->', null, function(newEl) {
      // Add it before the el.
      this.$insertElementBefore(newEl);
      // Remove the current el.
      this.$removeElement(this.el);
      // Set the el in the scope tree to the new el
      this.el = newEl;
    });
    // Have to add an end comment and add a fake scope for it as a placeholder for the repeat items' scopes.
    var scopeTree = this.scopeTree.parent.append({});
    this.$compile('<!-- ' + this.__className + '-end="' + this.watchKey + '" -->', scopeTree, function(newEl) {
      this.endComment = newEl;
    });
  };

  RepeatDirective.prototype._onCollectionChanged = function(collection) {
    var lastBlockMap = this.lastBlockMap;

    if (this.aliasAs) {
      this.$scope[this.aliasAs] = collection;
    }
    var collectionKeys,
        trackByIdFn;
    if (utils.isArrayLike(collection)) {
      collectionKeys = collection;
      trackByIdFn = this.trackByIdExpFn || this.trackByIdArrayFn;
    } else {
      trackByIdFn = this.trackByIdExpFn || this.trackByIdObjFn;
      collectionKeys = [];
      for (var itemKey in collection) {
        if (hasOwnProperty.call(collection, itemKey) && itemKey.charAt(0) !== '$') {
          collectionKeys.push(itemKey);
        }
      }
    }

    var collectionLength = collectionKeys.length,
        index,
        key,
        value,
        trackById,
        block,
        nextBlockMap = {},
        nextBlockOrder = new Array(collectionLength);

    for (index = 0; index < collectionLength; index++) {
      key = (collection === collectionKeys) ? index : collectionKeys[index];
      value = collection[key];
      trackById = trackByIdFn(key, value, index);
      if (lastBlockMap[trackById]) {
        block = lastBlockMap[trackById];
        delete lastBlockMap[trackById];
        nextBlockMap[trackById] = block;
        nextBlockOrder[index] = block;
      } else if (nextBlockMap[trackById]) {
        console.warn('dupes');
      } else {
        nextBlockOrder[index] = {id: trackById, scope: undefined, el: undefined};
        nextBlockMap[trackById] = true;
      }
    }

    // Remove leftover items.
    for (var blockKey in lastBlockMap) {
      block = lastBlockMap[blockKey];
      // TODO(TJ): think about animation here -- maybe just scale(0,0) then remove after?
      this.$removeElement(block.el);
    }

    var previousEl = this.el;

    for (index = 0; index < collectionLength; index++) {
      key = (collection === collectionKeys) ? index : collectionKeys[index];
      value = collection[key];
      block = nextBlockOrder[index];

      if (block.scope) {
        // If there's already a scope, let's reuse it.
        // TODO(TJ): Again, think about animation here. Maybe get current element's position, diff from new position,
        // set translate to that, then on next animation frame, set translate to 0,0.
        this.$insertElementAfter(block.el, previousEl);
        previousEl = block.el;
        updateScope(block.scope, index, collectionLength);
      } else {
        block.scope = {};
        updateScope(block.scope, index, collectionLength, this.itemKey, key, this.valueKey, value);
        //var scopeTree = this.scopeTree.append(block.scope);
        //console.log(this.scopeTree.parent);
        this.$compile(this.elTemplate, block.scope, function(el) {
          block.el = el;
          this.$insertElementAfter(block.el, previousEl);
          previousEl = el;
          nextBlockMap[block.id] = block;
          block.scope.scopeTree = this.scopeTree.getTreeFromScope(block.scope);
        });
      }
    }
    this.lastBlockMap = nextBlockMap;
  };

  var updateScope = function(scope, index, arrayLength, keyIdentifier, key, valueIdentifier, value) {
    scope.$index = index;
    scope.$first = index === 0;
    scope.$last = index === (arrayLength - 1);
    scope.$middle = !(scope.$first || scope.$last);
    scope.$even = (index&1) === 0;
    scope.$odd = !scope.$even;
    // add other stuff
    if (arguments.length > 3) {
      if (keyIdentifier) scope[keyIdentifier] = key;
      scope[valueIdentifier] = value;
      scope.__proto__ = Directive.prototype;
    }
    return scope;
  };

  return viewParser.addDirective({
    'directive': extend(Directive, RepeatDirective),
    'interrupts': true
  });
});
