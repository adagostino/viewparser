$app.require('test-controller', function() {
  var TestController = function(){};

  TestController.prototype.init = function() {
    this.testItems = [];
    this.repeatLimit = 20;
    this.numItems = 10000;
    this._buildItems();
    // $onWindow makes sure window exists, also takes care of removing itself when view is destroyed.
    this.$onWindow('scroll', this._onScroll);
    this.$onWindow('resize', this._onScroll);

    //window.ctrl = this;
  };

  TestController.prototype._buildItems = function() {
    for (var i=0; i<this.numItems; i++) {
      this.testItems.push({
        'text': 'party'
      });
    }
  };

  TestController.prototype.splice = function(idx, replace) {
    var del = !!replace ? 1 : 0;
    this.testItems.splice(idx, del, {
      'text': 'jam zone',
      'color': 'blue'
    });
  };

  TestController.prototype._onScroll = function(e) {
    if (document.body.scrollHeight - window.innerHeight - document.body.scrollTop < 100) {
      this.repeatLimit+=100;
    }
  };

  return $app.addController({
    'controller': TestController
  });
});