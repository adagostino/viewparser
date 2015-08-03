var subClass = 'view';
(function(subClass) {
  var controller = function(){};

  controller.prototype.__templateType = 'controller';

  $app.add(subClass, controller, 'controller');
})(subClass);