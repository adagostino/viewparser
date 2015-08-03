var subClass = 'directive';
(function(subClass) {
  var directiveName = 'dc-repeat';

  var directive = function(){};

  var _listReg = /(?:\s+in\s+)([-A-Za-z0-9_\.]+)\s*/i,
      _keyReg = /(?:\s*)\(*([-A-Za-z0-9_]+)(?:\s*\,*\s*)([-A-Za-z0-9_]+)*\)*(?:\s+in)/i;

  var _getLength = function (o) {
    try {
      if ($.isArray(o)) return o.length;
      var ct = 0;
      for (var key in o) ct++;
      return ct;
    } catch (e) {
      console.error("Could not get length of " + o + ". Please use a proper array or object or string for ng-repeat");
      return 0;
    }
  };

  var _isObject = function(o) {
    return typeof o === 'object' && !$.isArray(o);
  };

  directive.prototype.init = function(attrs) {
    // First get the template.
    this.watchKey = attrs[directiveName];
    this.setTemplate();
    // Next parse out the repeat.
    var list = this.watchKey.match(_listReg)[1],
        keyMatch = this.watchKey.match(_keyReg);
    this.itemKey = keyMatch[1];
    this.itemVal = keyMatch[2];
    // Next replace element with a comment (like dc-if).
    this.addComment();
    // Next watch the list
    this.watchedList = '$scope["' + list + '"]';
    this.$watchArray(this.watchedList, this.onListChanged);
    // Now initialize
    this.list = [];
    this.onListChanged(this.getWatchedList());
  };

  directive.prototype.getWatchedList = function() {
    return Path.get(this.watchedList).getValueFrom(this);
  };

  directive.prototype.setTemplate = function() {
    // Get the template.
    this.elTemplate = $.extend(true, {}, this.$compile(this.el, this.$scope, true));
    // Now get rid of the directive from it so it doesn't repeat each time.
    var i = 0;
    while (i < this.elTemplate.views.length) {
      if (this.elTemplate.views[i].name === directiveName) {
        this.elTemplate.views.splice(i,1);
      } else {
        i++;
      }
    }
  };

  directive.prototype.onListChanged = function(o) {
    // On change, add/remove/replace elements keeping track of the last element (which could be the comment).
    var splices = o ? o.splices : null;
    if (!splices) {
      if (_isObject(o)) {
        console.log("repeat doesn't work on objects...yet");
        return;
      }
      splices = [{
        addedCount: _getLength(o),
        index: 0,
        removed: this.list
      }];
    }
    var baseList = this.getWatchedList();
    for (var i=0; i<splices.length; i++) {
      var changed = [], removed = [], added = [];
      var idx = splices[i].index,
        numAdded = splices[i].addedCount,
        numRemoved = splices[i].removed.length;

      // start with removed
      for (var j = 0; j < numRemoved; j++) {
        if (j < numAdded) {
          changed.push(idx + j);
        } else {
          removed.push(idx + j);
        }
      }
      var lastChangedIdx = changed[changed.length - 1] || idx;
      for (var j = 0; j < (numAdded - numRemoved); j++) {
        //console.log(lastChangedIdx, j, numRemoved);
        added.push(lastChangedIdx + j + (numRemoved ? 1 : 0));
      }
      this._addItems(added, baseList);
      this._changeItems(changed, baseList);
      this._removeItems(removed);
    }
    this.updateItems();
  };

  directive.prototype._addItems = function(added, baseList) {
    // Add items from the added array in onListChanged
    for (var i = 0; i < added.length; i++) {
      var ct = added[i];
      var item = this.createItem(baseList, ct);
      item.el = this.$compile(this.elTemplate, item.io);
      if (ct <= 0) {
        ct = 0;
      } else if (ct > this.list.length) {
        ct = this.list.length;
      }
      // now add it into the dom after the prev el
      var prevEl = ct - 1 > -1 ? this.list[ct - 1].el : this.el;

      this.$insertElementAfter(item.el, prevEl);
      this.list.splice(ct, 0, item);
    }
  };

  directive.prototype._changeItems = function(changed, baseList) {
    // Change items from the changed array in onListChanged
    for (var i = 0; i < changed.length; i++) {
      var ct = changed[i],
          item = this.createItem(baseList, ct);
      this.list[ct].io = item.io;
    }
  };

  directive.prototype._removeItems = function(removed) {
    for (var i = 0; i < removed.length; i++) {
      var ct = removed[i] - i;
      this.$removeElement(this.list[ct] ? this.list[ct].el : null);
      this.list.splice(ct, 1);
    }
  };

  directive.prototype.addComment = function() {
    // Create the comment.
    var newEl = this.$compile('<!-- ' + directiveName + '="' + this.watchKey + '" -->', this.$scope);
    // Add it before the el.
    this.$insertElementBefore(newEl);
    // Remove the current el.
    this.$removeElement(this.el);
    // Set the el in the scope tree to the new el
    this.el = newEl;
  };

  directive.prototype.createItem = function(baseList, ct, isObject) {
    var o = baseList[ct];
    var item = {
      '$parentScope': this.$scope,
      '$index': -1,
      '$first': false,
      '$last': false,
      '$middle': false,
      '$even': false,
      '$odd': false
    };
    item[this.itemKey] = o;

    return {
      'io': item,
      'el': null
    }
  };

  directive.prototype.updateItems = function() {
    var len = _getLength(this.list);
    for (var i=0; i<len; i++) {
      var io = this.list[i].io;
      io.$index = i;
      io.$first = i === 0;
      io.$last = i === len - 1;
      io.$middle = !io.$first && !io.$last;
      io.$even = !!(i % 2);
      io.$odd = !io.$even;
    }
  };

  $app.addDirective(subClass, {
    'name': directiveName,
    'directive': directive,
    'interrupts': true
  });

})(subClass);