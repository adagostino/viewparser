var __className = 'controller';
$require(__className, ['view', 'extend'], function(View, extend) {
  var Controller = function(){};

  Controller.prototype.__templateType = 'controller';

  return extend(View, Controller);
});