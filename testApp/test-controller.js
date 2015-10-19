$app.require('test-controller', function() {
  var TestController = function(){};

  TestController.prototype.init = function() {
    this.testItems = [];
    this.repeatLimit = 100;
    this.numItems = 10000;
    this.buildItems();
    var fn = this._onScroll.bind(this);

    $(window).on('scroll', fn);

    this.$on('$remove', function(e) {
      $(window).off('scroll', fn);
    });
  };

  TestController.prototype.buildItems = function() {
    for (var i=0; i<this.numItems; i++) {
      this.testItems.push({
        'text': 'party'
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