var subClass = 'view';
(function(subClass) {
  var directive = function(){};

  directive.prototype.__templateType = 'directive';

  $app.add(subClass, directive, 'directive');
})(subClass);