$app.require('test-controller', function() {
  var TestController = function(){};

  TestController.prototype.init = function() {
    this.testItems = [];
    this.repeatLimit = 100;
    this.numItems = 1000;
    this.buildItems();
    var fn = this._onScroll.bind(this);

    $(window).on('scroll', fn);

    this.$on('$remove', function(e) {
      console.log('remove?', this.__id);
      $(window).off('scroll', fn);
    });
  };

  TestController.prototype.buildItems = function() {
    for (var i=0; i<this.numItems; i++) {
      this.testItems.push({
        'text': 'This is a test item'
      });
    }
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