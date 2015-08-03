var name = 'testApp';
(function(global, name){
  global = global || window;

  var testApp = function(){};

  testApp.prototype.init = function(framework) {
    console.log('initializing app');

  };

  global.$app.addApp({
    'name': name,
    'app': testApp,
    'template': '#test-template'
  });

})(undefined, name);