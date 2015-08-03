var subClass = 'directive';
(function(subClass){
  var directiveName = 'dc-if';

  var directive = function(){};

  directive.prototype.init = function(attrs) {
    this.watchKey = attrs[directiveName];
    this.elTemplate = this.$compile(this.el, this.$scope, true);
    this.setWatcher();
  };

  directive.prototype.setWatcher = function() {
    this.$parseAndWatch(this.watchKey, function() {
      var o = this._parseFunc(this.$scope);
      o ? this.addEl() : this.addComment();
    });
  };

  directive.prototype.addComment = function() {
    if (this.el.nodeType === 8) return; // If it's a comment.
    // Create the comment.
    if (!this.commentTemplate) {
      this.commentTemplate = this.$compile('<!-- ' + directiveName + '="' + this.watchKey + '" -->', this.$scope, true);
    }
    this.switchTemplate(this.commentTemplate);
  };

  directive.prototype.addEl = function() {
    if (this.el.nodeType !== 8) return; // If it's not a comment.
    this.switchTemplate(this.elTemplate);
  };

  directive.prototype.switchTemplate = function(template) {
    // compile the template
    var newEl = this.$compile(template, this.$scope);
    // Add it before the el.
    this.$insertElementBefore(newEl);
    // Remove the current el.
    this.$removeElement(this.el);
    // Set the el in the scope tree to the new el
    this.el = newEl;
    // Add the parseWatch
    this.setWatcher();
  };

  $app.addDirective(subClass, {
    'name': directiveName,
    'interrupts': true, //TODO: do we actually need this? (used in viewParser.prototype.compileDirective)
    'presidence': true,
    'directive': directive
  });
})(subClass);