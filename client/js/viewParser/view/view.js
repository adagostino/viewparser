var __className = 'view';
$require(__className,
[
  'listener',
  'extend',
  'viewParser'
],
function(
  Listener,
  extend,
  viewParser)
{
  var View = function(){};

  View.prototype.__templateType = 'view';

  View.prototype.__isView = true;

  View.prototype.__beforeInit = function (attrs, el, domTree, scopeTree) {
    scopeTree = scopeTree || (domTree ? domTree.scopeTree : null);
    this._super(scopeTree);
    this.domTree = domTree;
    this.el = el;
  };

  View.prototype.$compile = function(el, $scope, callback, returnTemplate, detached) {
    returnTemplate = returnTemplate === undefined ? false : !!returnTemplate;
    if (!el) return;
    var elType = typeof el;
    var gotTemplate = function(template) {
      var thisScopeTree = this.__$isolateScope_ ? this.scopeTree : this.scopeTree.parent;

      var scopeTree = $scope ? this.scopeTree.getTreeFromScope($scope) : thisScopeTree;
      if (!scopeTree) {
        // Maybe not good.
        scopeTree = thisScopeTree.append($scope);
      }

      var parentDomTree = this.domTree.getTreeFromElement(this.__$isolateScope_ ? this.el : this.el.parentElement) || this.domTree;

      var r = returnTemplate ? template : viewParser.compileTemplate(template, scopeTree, parentDomTree, detached);
      callback && callback.call(this, r, template);
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
    return this.domTree ? this.domTree.addEventListener(event, callback) : null;
  };

  View.prototype.$removeElement = function(el, elOnly) {
    this.domTree.getTreeFromElement(el);
    if (elOnly) {
      el.parentNode.removeChild(el);
    } else {
      var domTreeObj = this.domTree.getTreeFromElement(el);
      if (domTreeObj) domTreeObj.removeSelf();
    }
  };

  View.prototype.$insertElementBefore = function(elToInsert, beforeThisEl) {
    beforeThisEl = beforeThisEl || this.el;
    // Move it around in the dom tree.

    var beforeDomTree = this.domTree.getTreeFromElement(beforeThisEl);

    this.domTree.getTreeFromElement(elToInsert).moveBefore(beforeDomTree);
  };

  View.prototype.$insertElementAfter = function(elToInsert, afterThisEl) {
    // Move it around in the dom tree.
    afterThisEl = afterThisEl || this.el;

    var afterDomTree = this.domTree.getTreeFromElement(afterThisEl);
    var insertDomTree = this.domTree.getTreeFromElement(elToInsert);

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