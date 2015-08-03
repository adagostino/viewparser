var subClass = 'base';
(function(subClass) {
  var view = function(){};

  view.prototype.__templateType = 'view';

  view.prototype.__beforeInit = function (attrs, el, $scope) {
    this._super();
    this.$scope = $scope;
    this.$parentScope = this.$scope ? this.$scope.$parentScope : null;
    this.el = el;
  };

  view.prototype.$compile = function(el, $scope, returnTemplate) {
    returnTemplate = returnTemplate === undefined ? false : !!returnTemplate;
    if (!el) return;
    var elType = typeof el;
    var template;
    switch(elType) {
      case 'string':
        template = this.viewParser.getTemplate(this.viewParser.parseTemplate(el).children[0]);
        break;
      case 'object':
        if (el.isTemplate) {
          template = el;
        } else {
          template = this.viewParser.getTemplateFromEl(el)
        }
        break;
      default:
        break;
    }
    return returnTemplate
            ? template
            : this.viewParser.compileTemplate(template, $scope, this.viewParser.getElId(this.el.parentElement));
  };

  view.prototype.$removeElement = function(el) {
    if (!el) return;
    this.viewParser.removeEl(el);
  };

  view.prototype.$insertElementBefore = function(elToInsert, beforeThisEl) {
    beforeThisEl = beforeThisEl || this.el;
    //this.el.parentNode.insertBefore(newEl, this.el);
    beforeThisEl.parentNode.insertBefore(elToInsert, beforeThisEl);
  };

  view.prototype.$insertElementAfter = function(elToInsert, afterThisEl) {
    afterThisEl = afterThisEl || this.el;
    //prevEl.parentNode.insertBefore(item.el, prevEl.nextSibling);
    afterThisEl.parentNode.insertBefore(elToInsert, afterThisEl.nextSibling);
  };

  view.prototype.$getElementByGUID = function(guid) {
    return this.viewParser.getElById(guid);
  };

  $app.add(subClass, view, 'view');
})(subClass);