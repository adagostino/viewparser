(function(global) {
  global = global || window;
  var _superPattern = /xyz/.test(function () { xyz;}) ? /\b_super\b/ : /.*/,
      _initializing = false;


  var _superize = function (_super, iChild, properties) {
    // ichild is the instantiated child
    // _super is the reference parent object
    // properties is the list of properties to superize
    var proto = {};
    for (var name in properties) {
      if (typeof iChild[name] === "function" &&
        typeof _super[name] === "function" &&
        _superPattern.test(iChild[name])) {
        proto[name] = (function (name, fn) {
          return function () {
            var tmp = this._super;
            this._super = _super[name];
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
          }
        })(name, iChild[name]);
      } else {
        // not exactly sure about this one -- it seems to work
        // basically want to fall back to super if the prop isn't in child, but using
        // hasOwnProperty on the iChild doesn't seem to work
        proto[name] = iChild[name] || _super[name];
      }
    }
    return proto;
  };

  var _extend =  function (parent, child) {
    var parent = parent || function () {};
    var _super = parent.prototype;
    _initializing = true;
    var proto = new parent(),
      iChild = typeof child === "function" ? new child() : child;
    _initializing = false;
    var instanceProperties = {},
      protoProperties = {};
    // split out instance and static variables
    for (var name in iChild) {
      if (child.prototype.hasOwnProperty(name)) {
        protoProperties[name] = 1;
      } else {
        instanceProperties[name] = 1;
      }
    }
    for (var name in proto) {
      if (!_super.hasOwnProperty(name)) {
        instanceProperties[name] = 1;
        delete proto[name];
      }
    }
    var childProto = _superize(_super, iChild, protoProperties);
    for (var name in childProto) {
      proto[name] = childProto[name];
    }
    function Class() {
      // All construction is actually done in this method
      // this is where it kinda sucks -- instantiating new parent/child to make use
      // of their closures
      var instance = _superize(new parent(), new child(), instanceProperties);
      for (var name in instance) {
        this[name] = instance[name];
      }

      if (!_initializing && this.init) {
        this.__beforeInit && this.__beforeInit.apply(this, arguments);
        this.init.apply(this, arguments);
      }
    };

    Class.prototype = proto;
    Class.constructor = Class;
    Class.subClass = arguments.callee;
    return Class;
  };

  global.__subClass = _extend;

})();