$app.require('test-directive', function() {
  var TestDirective = function(){};

  TestDirective.prototype.init = function(){};

  TestDirective.prototype.onClick = function(item, index) {
    console.log('clicked', item, index);
  };

  return $app.addDirective({
    'directive': TestDirective,
    'template': 'testApp/templates/test-directive.html',
    '$scope': {
      'item': '=item',
      'index': '=index'
    }
  })

});