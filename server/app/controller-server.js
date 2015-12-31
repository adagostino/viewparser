$require('controllerServer', ['extend', 'observer'], function(extend, Observer) {

  var Controller = function() {};

  Controller.prototype.__templateType = 'controller';

  Controller.prototype.__beforeInit = function() {
    //this._super.apply(this, arguments);
    this._listeners = {};
  };

  Controller.prototype.$on = function(event, callback) {
    var a = this._listeners[event];
    if (!a) this._listeners[event] = a = [];
    a.push({
      'callback': callback
    });
  };

  Controller.prototype.$off = function(event, callback) {
    if (!event) this._listeners = {};
    if (!this._listeners[event]) return;
    if (callback) {
      for (var i=0; i<this._listeners[event].length; i++) {
        if (this._listeners[event][i].callback === callback) {
          this._listeners[event][i].splice(i, 1);
          return;
        }
      }
    } else {
      this._listeners[event] = [];
    }
  };

  Controller.prototype.$trigger = function(event, params) {
    var a = this._listeners[event] || [];
    for (var i=0; i< a.length; i++) {
      a[i].callback(params);
    }
  };

  return extend(Observer, Controller);
});