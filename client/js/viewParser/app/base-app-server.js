var __className = 'baseAppServer';
$require(__className,
[
  'baseApp',
  'ajax',
  'queue',
  'extend',
  'utils'
], function(
    BaseApp,
    Ajax,
    Queue,
    extend,
    utils
) {
  var ajax = new Ajax();

  var queue = new Queue();
  //TODO(TJ): set up queue class.

  var BaseAppServer = function(){};

  BaseAppServer.prototype.init = function(serverOptions) {
    this._super();
    serverOptions = serverOptions || {};
    this._indexTemplate = serverOptions.template;
    this._docType = serverOptions.docType;
    // Listen for the routes to be rendered.
    this.$on('App:Route:Rendered', function(e, o) {
      this._numRoutes--;
      if (this._numRoutes === 0)  {
        //TODO(TJ): Change this to VirtualElement .html()
        this._routeLoadedCallback();
      }
    });
  };

  BaseAppServer.prototype.start = function(config) {
    // Read the config json. ({"basePath": "", "js": [], "css": [], "meta": []}).
    this.readConfig(config);

    // Get the index template
    this._getIndexTemplate(this._startServer);
  };

  BaseAppServer.prototype.readConfig = function(config) {
    if (!config) return;
    this.config = config;
    if (!this._indexTemplate) this._indexTemplate = config.index;
    this.setBaseUrl(config.base);
    this.setStaticUrl(config.static);
  };

  BaseAppServer.prototype._startServer = function() {
    if (this._started || !this.fetchedIndex) return;
    this.$compile(this.fetchedIndex.template, null, function(child, template) {
      this.el = child;
      this._started = true;
      this.fetchedIndex.template = template;
      this.history.start();
    });
  };

  BaseAppServer.prototype.loadRoute = function(fragment, callback) {
    // Used on the server to get the html of a current route.
    fragment = this.history.getFragment(fragment);
    var routes = this.history.getRoutes(fragment);

    if (routes === false) callback();
    this._spinUpAndLoad(fragment, callback);
  };

  BaseAppServer.prototype._spinUpAndLoad = function(fragment, callback, config) {
    var bas = new BaseAppServer(this.fetchedIndex || {'template': this._indexTemplate});
    bas.start(config || this.config);
    var cb = function() {
      // TODO(TJ): Change this to .html() for virtualDocument.
      var html = bas.el.outerHTML;
      // Add in the doctype if it exists.
      if (bas.fetchedIndex.docType) html = bas.fetchedIndex.docType + '\n' + html;
      callback(html);
      bas.reset();
      bas = null;
    };
    var routes = bas.history.getRoutes(fragment);
    bas._numRoutes = routes.length;
    bas._routeLoadedCallback = cb;
    bas.history.executeRoutes(routes, bas.history.getFragment(fragment));
  };

  BaseAppServer.prototype._getIndexTemplate = function(callback) {
    if (this.fetchedIndex) return this.$call(this, callback);
    if (utils.isObject(this._indexTemplate) && this._indexTemplate.isTemplate) {
      this.fetchedIndex = {
        'template': this._indexTemplate,
        'docType': this._docType
      }
    }
    this._fetchTemplate(callback);
  };

  var _docTypeRegEx = /<!doctype [^>]+>/i;
  BaseAppServer.prototype._fetchTemplate = function(callback) {
    if (this.fetchedIndex) return this.$call(this, callback);

    var path = this._indexTemplate;

    ajax.$fetchTemplate(path, function(html) {
      var returnObj = {
        'docType': '',
        'template': html
      };
      if (html) {
        returnObj.template = utils.trim(html.replace(_docTypeRegEx, function(match) {
          returnObj.docType = match;
          return '';
        }));
        this.fetchedIndex = returnObj;
      }
      this.$call(this, callback);
    }, this);

  };

  BaseAppServer.prototype.reset = function() {
    //TODO(TJ): Unload the html to clear out all of the watchers etc.
    this.$remove();
  };

  BaseAppServer = extend(BaseApp, BaseAppServer);

  return BaseAppServer;
});