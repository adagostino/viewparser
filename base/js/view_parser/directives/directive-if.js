var subClass = 'directive';
(function(subClass){
  var directiveName = 'dc-if';

  var directive = function(){};

  directive.prototype.init = function(attrs) {


    this.$parseAndWatch(attrs[directiveName], function() {
      var o = this._parseFunc(this.$scope);
      this.removeElement = !!!o;
    });

  };

  directive.prototype.addComment = function() {
    this.comment = document.createComment(directiveName + '=' + attrs[directiveName]);
    this.el.parentNode.insertBefore(this.comment, this.el);

  };

  $app.addDirective(subClass, {
    'name': directiveName,
    'presidence': true,
    'directive': directive
  });
})(subClass);