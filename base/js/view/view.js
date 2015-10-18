var __className = 'view';
$require(__className, ['listener', 'extend', 'viewParser'], function(Listener, extend, viewParser){
  var View = function(){};

  View.prototype.__templateType = 'view';

  View.prototype.__isView = true;

  View.prototype.__beforeInit = function (attrs, el, scopeTree) {
    this._super(scopeTree);
    this.el = el;
  };

  View.prototype.$compile = function(el, $scope, callback, returnTemplate, detached) {
    returnTemplate = returnTemplate === undefined ? false : !!returnTemplate;
    if (!el) return;
    var elType = typeof el;
    var gotTemplate = function(template) {
      var thisScopeTree = this.__$isolateScope_ ? this.scopeTree : viewParser.getScopeTreeFromScope(this.$scope);
      var scopeTree = $scope ? viewParser.getScopeTreeFromScope($scope) : thisScopeTree;
      if (!scopeTree) {
        scopeTree = thisScopeTree.append($scope);
      }

      var parentDomTree = viewParser.getDomTreeFromElement(this.__$isolateScope_ ? this.el : this.el.parentElement);
      var r = returnTemplate ? template : viewParser.compileTemplate(template, scopeTree, parentDomTree, detached);
      callback && callback.call(this, r);
    }.bind(this);

    switch(elType) {
      case 'string':
        viewParser.parseTemplate(el, function(template) {
          //TODO: May not be right -- think about <div></div><div></div>
          gotTemplate(viewParser.getTemplate(template.children[0]));
        });
        break;
      case 'object':
        gotTemplate(el.isTemplate ? el : viewParser.getTemplateFromEl(el));
        break;
      default:
        break;
    }
  };

  View.prototype.$listenTo = function(event, callback) {
    var domTree = viewParser.getDomTreeFromElement(this.el);
    return domTree ? domTree.addEventListener(event, callback) : null;
  };

  View.prototype.$removeElement = function(el, elOnly) {
    if (!el) return;
    if (elOnly) {
      try {
        el.parentNode.removeChild(el);
      } catch (err) {}
    } else {
      viewParser.removeElement(el);
    }
  };

  View.prototype.$insertElementBefore = function(elToInsert, beforeThisEl) {
    beforeThisEl = beforeThisEl || this.el;
    // Move it around in the dom tree.
    var beforeDomTree = viewParser.getDomTreeFromElement(beforeThisEl);
    viewParser.getDomTreeFromElement(elToInsert).moveBefore(beforeDomTree);
  };

  View.prototype.$insertElementAfter = function(elToInsert, afterThisEl) {
    // Move it around in the dom tree.
    afterThisEl = afterThisEl || this.el;
    var afterDomTree = viewParser.getDomTreeFromElement(afterThisEl);
    var insertDomTree = viewParser.getDomTreeFromElement(elToInsert);

    if (!afterDomTree.next) {
      insertDomTree.moveBefore();
      return;
    }
    if (afterDomTree.next.__id === insertDomTree.__id) return;

    this.$insertElementBefore(insertDomTree, afterDomTree.next);
  };

  View.prototype.$remove = function() {
    this.$removeElement(this.el);
  };

  return extend(Listener, View);
});