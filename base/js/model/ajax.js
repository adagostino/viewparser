var __className = 'ajax';
$require(__className, ['listener', 'extend', 'utils'], function(Listener, extend, utils) {
  /*
    settings: obj defined by http://api.jquery.com/jquery.ajax/
    options: {
      url: string,
      ...: any settings $.ajax can take
      done: fn,
      fail: fn,
      always: fn
    }
   */

  var _HTTP_METHODS = {
    'POST': 1,
    'GET': 1,
    'PUT': 1,
    'DELETE': 1
  };

  var _getCrudType = function(method) {
    var ucMethod = method.toUpperCase();
    if (!_HTTP_METHODS[ucMethod]) {
      console.warn('Trying to call ajax with an unrecognized method:', method, '. Defaulting it to GET.');
      ucMethod = 'GET';
    }
    return ucMethod;
  };

  var Ajax = function(){};

  Ajax.prototype.__beforeInit = function(options) {
    this._super();
    this.options = options || {};
  };

  Ajax.prototype.$post = function(options) {
    this._crud('post', options);
  };

  Ajax.prototype.$get = function(options) {
    this._crud('get', options);
  };

  Ajax.prototype.$put = function(options) {
    this._crud('put', options);
  };

  Ajax.prototype.$delete = function(options) {
    this._crud('delete', options);
  };

  Ajax.prototype._crud = function(method, options) {
    var opts = $.extend(true, {}, this.options, options || {});
    opts.type = _getCrudType(method);
    this[opts.file ? '_upload' : '_ajax'](opts);
  };

  Ajax.prototype._ajax = function(opts) {
    if (!opts.url) {
      console.warn('Trying to call ajax without a url', opts);
      return;
    }
    var context = opts.context || this;
    opts.context = this;
    $.ajax(opts).done(function(){
      this.$apply(context, opts.done, arguments);
    }).fail(function(){
      this.$apply(context, opts.fail, arguments);
    }).always(function(){
      this.$apply(context, opts.always, arguments);
    });
  };

  Ajax.prototype._createXhr = function(opts) {
    var context = opts.context || this;
    var xhr = new XMLHttpRequest();
    // Create Callbacks.
    var always = function() {
      this.$call(context, opts.always, xhr.response, xhr);
    }.bind(this);
    var progress = function(e) {
      var percent = utils.round(100 * e.loaded / e.total, 3);
      this.$call(context, opts.progress, e, percent);
    }.bind(this);
    var done = function() {
      xhr.status === 200 && this.$call(context, opts.done, xhr.response, xhr);
      always();
    }.bind(this);
    var fail = function() {
      this.$call(context, opts.fail, xhr.response, xhr);
      always();
    }.bind(this);
    // Add the event listeners.
    xhr.upload.addEventListener('progress', progress, false);
    xhr.addEventListener('load', done);
    xhr.addEventListener('error', fail);
    // Set the request headers.
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.setRequestHeader("X-FILENAME", opts.file.name);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    return xhr;
  };

  Ajax.prototype._upload = function(opts) {
    if (!opts.url) {
      console.warn('Trying to call ajax without a url', opts);
      return;
    }
    var xhr = this._createXhr(opts);
    xhr.open(opts.type, opts.url, true);
    xhr.send(opts.file);
  };

  return extend(Listener, Ajax);
});