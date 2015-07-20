var subClass = 'base';
(function(subClass) {
  var directive = function(){};

  directive.prototype.__templateType = 'directive';

  directive.prototype.__beforeInit = function (attrs, el, $scope) {
    this.$scope = $scope;
    this.el = el;
    this.viewParser = $app.viewParser.getViewParserFromEl(this.el);
  };

  $app.add(subClass, directive, 'directive');
})(subClass);