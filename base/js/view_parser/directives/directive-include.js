var subClass = 'directive';
(function(subClass){
  var directiveName = 'dc-include';

  var directive = function(){};

  directive.prototype.init = function(attrs) {
    // TODO: variable level includes

  };

  $app.addDirective(subClass, {
    'name': directiveName,
    'directive': directive,
    'template': '@' + directiveName
  });
})(subClass);