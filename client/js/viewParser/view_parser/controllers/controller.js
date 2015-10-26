var __className = 'controller';
$require(__className, ['view', 'extend'], function(View, extend) {
  var Controller = function(){};

  Controller.prototype.__templateType = 'controller';

  Controller.prototype.__beforeInit = function(attr, el, domTree) {
    // Create an isolate scope for it.
    this.__$isolateScope_ = true;
    this._super(attr, el, domTree);
  };

  return extend(View, Controller);
});