$app.require('test-app', ['test-router'], function(TestRouter){
  var TestApp = function(){};

  TestApp.prototype.init = function() {
    this.testGlobal = 'party';
  };

  return $app.addApp({
    'app': TestApp,
    'router': TestRouter
  });
});