var subClass = 'directive';
(function(subClass) {
  var directiveName = 'dc-attr';

  var directive = function(){};

  directive.prototype.init = function(attrs) {
    this.$parseAndWatch(attrs[directiveName], function() {
      var o = this._parseFunc(this.$scope);
      this.attrChanged(o, attrs);
    });
  };

  directive.prototype.attrChanged = function(o, attrs) {
    for (var key in o) {
      o[key] ? this.setAttr(key, o[key], attrs) : this.removeAttr(key);
    }
  };

  directive.prototype.setAttr = function(attr, value, attrs) {
    this.el.setAttribute(attr, value);
    var dir = this.viewParser.directives[attr];
    // TODO: figure out if I should allow direcives to be added via dc-attr (if so, how do I work the isolate scope)
    // dir && this.viewParser.compileDirective(dir, this.$scope, this.el, this.viewParser.getTemplateFromEl(this.el).attributes);
  };

  directive.prototype.removeAttr = function(attr) {
    this.el.removeAttribute(attr);
  };

  $app.addDirective(subClass, {
    'name': directiveName,
    'directive': directive
  });

})(subClass);