$app.require('test-router', ['ajax'], function(Ajax) {
  var TestRouter = function(){};

  var ajax = new Ajax();

  TestRouter.prototype.routes = [
    {
      'path': '',
      'template': 'client/templates/test-route-home.html',
    },
    {
      'path': 'video',
      'template': 'client/templates/routes/route-video.html'
    },
    {
      'path': 'controller/:whatever',
      'template': 'client/templates/test-route-controller.html',
      'callbacks': [
        function(params) {
          ajax.$get({
            'url': 'api/test',
            'context': this,
            'done': function(){
              this.next();
            },
            'fail': function() {
              console.log('error', arguments);
            }
          });
          return false;
        }
      ]
    },
    {
      'path': 'simple/:whatever/:anotherWhatever',
      'template': 'client/templates/test-route-simple.html',
      'callbacks': [
        function(params) {
          //console.log('loading simple route', params);
          ajax.$get({
            'url': 'api/test',
            'context': this,
            'done': function() {
              this.next();
            },
            'fail': function() {
              console.log('error', arguments);
            }
          });
          return false;
        }
      ]
    }

  ];

  return $app.addRouter(TestRouter);
});