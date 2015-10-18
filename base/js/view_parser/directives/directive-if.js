var __className = 'dc-if';
$require(__className, ['viewParser', 'extend', 'directive'], function(viewParser, extend, Directive) {
  var IfDirective = function(){};

  IfDirective.prototype.init = function(attrs) {
    this.watchKey = attrs[this.__className];
    // I know these will wind of being synchronous b/c I know that I'm not fetching any templates. If I were
    // performing a compile that would fetch a template, I'd have to make all of these callbacks.
    this.setTemplate();
    this.addComment();
    this.$parseAndWatch(this.watchKey, function() {
      var o = this._parseFunc(this.$scope);
      o ? this.addEl() : this.removeEl();
    });
  };

  IfDirective.prototype.setTemplate = function() {
    // Get the template.
    this.$compile(this.el, this.$scope, function(template) {
      this.elTemplate = $.extend(true, {}, template);
      // Now get rid of the directive from it so it doesn't execute each time.
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

  IfDirective.prototype.addComment = function() {
    // Create the comment.
    this.$compile('<!-- ' + this.__className + '-placeholder="' + this.watchKey + '" -->', null, function(newEl) {
      // Add it before the el.
      this.$insertElementBefore(newEl);
      // Remove the current el.
      this.$removeElement(this.el);
      // Set the el in the scope tree to the new el
      this.el = newEl;
    });
  };

  IfDirective.prototype.addEl = function() {
    if (this.ifEl) return;
    this.$compile(this.elTemplate, null, function(el) {
      this.ifEl = el;
      this.$insertElementAfter(this.ifEl);
    });
  };

  IfDirective.prototype.removeEl = function() {
    this.$removeElement(this.ifEl);
    this.ifEl = null;
  };

  return viewParser.addDirective({
    'interrupts': true,
    'presidence': true,
    'directive': extend(Directive, IfDirective)
  });

});