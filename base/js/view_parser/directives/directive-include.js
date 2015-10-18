var __className = 'dc-include';
$require(__className, ['viewParser', 'extend', 'directive'], function(viewParser, extend, Directive) {
  var IncludeDirective = function(){};

  IncludeDirective.prototype.init = function(attrs) {
    // TODO: variable level includes

  };

  return viewParser.addDirective({
    'directive': extend(Directive, IncludeDirective),
    'template': '@'
  });
});
