$app.require('test-router', function() {
  var TestRouter = function(){};

  TestRouter.prototype.routes = [
    {
      'path': '',
      'template': 'testApp/templates/test-route-home.html',
      'callbacks': [
        function(params) {
          console.log('loading home', params);
        }
      ]
    },
    {
      'path': 'controller/:whatever',
      'template': 'testApp/templates/test-route-controller.html',
      'callbacks': [
        function(params) {
          console.log('loading controller route', params);
        }
      ]
    },
    {
      'path': 'simple/:whatever/:anotherWhatever',
      'template': 'testApp/templates/test-route-simple.html',
      'callbacks': [
        function(params) {
          console.log('loading simple route', params);
        }
      ]
    }

  ];

  return $app.addRouter(TestRouter);
});