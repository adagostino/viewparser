$require('queue', ['utils'], function(utils) {

  var Queue = function(){
    this._items = [];
  };

  Queue.prototype.push = function(callback, context) {
    this._items.push({
      'callback': callback,
      'context': context
    });
  };

  Queue.prototype.next = function() {
    if (!this._items.length) return;
    var item = this._items.shift();
    if (!utils.isFunction(item.callback)) return;
    setTimeout(function(){
      item.context ? item.callback.apply(item.context) : item.callback();
    }, 0);
  };

  Queue.prototype.empty = function() {
    if (!this._items.length) return;
    while (this._items.length) {
      this.next();
    }
  };

  return Queue;
});