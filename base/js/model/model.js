var __className = 'model';
$require(__className, ['ajax', 'extend', 'utils'], function(Ajax, extend, utils) {

  var Model = function(){};

  Model.prototype.__templateType = 'model';

  Model.prototype.__beforeInit = function(attrs, opt_options) {
    this._super(opt_options);

    this.idAttribute = this.options.idAttribute || 'id';
    this.set(attrs);
    this._setPreviousAttributes();

    this.isDirty = false;
    this.$watchObject('attributes', function() {
      this.isDirty = utils.equals(this.attributes, this.__previousAttributes_);
    });
  };

  var _getKeys = function(it) {
    var type = utils.typeof(it);
    var keys = [];
    switch(type) {
      case 'object':
        for (var key in it) keys.push(key);
        break;
      case 'array':
        for (var i=0; i<it.length; i++) keys.push(it[i]);
        break;
      default:
        keys.push(it);
        break;
    }
    return keys;
  };

  Model.prototype.get = function(key) {
    if (!key) return;
    var keys = _getKeys(key),
        vals = {};
    for (var i=0; i<keys.length; i++) {
      vals[keys[i]] = this.attributes[keys[i]];
    }
    return keys.length === 1 ? vals[keys[0]] : vals;
  };

  Model.prototype.set = function(key, value) {
    if (!key) return;
    var o = key;
    if (!utils.isObject(o)) {
      var o = {};
      o[key] = value;
    }
    if (o.hasOwnProperty[this.idAttribute]) this.id = o[this.idAttribute];
    $.extend(true, this.attributes, o);
  };

  Model.prototype.reset = function() {
    this.set(this.__previousAttributes_);
  };

  Model.prototype.clear = function() {
    this.attributes = {};
    this.id = null;
  };

  Model.prototype.fetch = function(opt_options) {
    // Perform a get to the server.
    var opts = this._setCallbacks(opt_options);
    var id = this.get(this.idAttribute);
    if (this.options.url) {
      opts['url'] = this.options.url.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
    }
    this.$get(opts);
  };

  Model.prototype.save = function(opt_options) {
    if (!this.isDirty) {
      return;
    }
    var opts = this._setCallbacks(opt_options);
    this[this.id ? '$put' : '$post'](opts);
  };

  Model.prototype.update = function(key, value, opt_options) {
    // Overload so it works like: update({key}, opt_options).
    if (utils.isObject(key) && ((!value && !opt_options) || utils.isObject(value))) {
      opt_options = value;
      value = null;
    }
    this.set(key, value);
    this.save(opt_options);
  };

  Model.prototype.destroy = function(opt_options) {
    // Perform a delete to the server.
    var opts = this._setCallbacks(opt_options);
    var id = this.get(this.idAttribute);
    if (this.options.url) {
      opts['url'] = this.options.url.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
    }
    var opts = opt_options || {},
        fail = opts.fail || this.options.fail,
        context = opts.context || this.options.context || this;
    opts.context = this;
    opts['fail'] = function() {
      this.reset();
      this.$apply(context, fail, arguments);
    };
    this.clear();
    this.$delete(opts);
  };

  Model.prototype._setCallbacks = function(opt_options) {
    var opts = opt_options || {},
        done = opts.done || this.options.done,
        context = opts.context || this.options.context || this;
    opts.context = this;
    opts['done'] = function(resp) {
      var attrs = this.parse(resp, opts);
      this.set(attrs);
      this._setPreviousAttributes();
      this.$call(context, done, resp, opts);
    };
    return opts;
  };

  Model.prototype.parse = function(resp, options) {
    // If user wants to override the parse method to parse the proper model attributes from the response.
    return resp;
  };

  Model.prototype._setPreviousAttributes = function() {
    this.__previousAttributes_ = this.toJSON();
    this.isDirty = false;
  };

  Model.prototype.toJSON = function() {
    return $.extend(true, {}, this.attributes);
  };

  return extend(Ajax, Model);
});