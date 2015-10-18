var __className = 'dc-attr';
$require(__className, ['viewParser', 'extend', 'directive'], function(viewParser, extend, Directive) {
  var AttrDirective = function(){};

  AttrDirective.prototype.init = function(attrs) {
    this.$parseAndWatch(attrs[this.__className], function() {
      var o = this._parseFunc(this.$scope);
      this.attrChanged(o, attrs);
    });
  };

  AttrDirective.prototype.attrChanged = function(o, attrs) {
    for (var key in o) {
      o[key] ? this.setAttr(key, o[key], attrs) : this.removeAttr(key);
    }
  };

  AttrDirective.prototype.setAttr = function(attr, value, attrs) {
    this.el.setAttribute(attr, value);
    var dir = viewParser.directives[attr];
    // TODO: figure out if I should allow direcives to be added via dc-attr (if so, how do I work the isolate scope)
    // dir && this.viewParser.compileDirective(dir, this.$scope, this.el, this.viewParser.getTemplateFromEl(this.el).attributes);
  };

  AttrDirective.prototype.removeAttr = function(attr) {
    this.el.removeAttribute(attr);
  };

  return viewParser.addDirective({
    'directive': extend(Directive, AttrDirective)
  });
});