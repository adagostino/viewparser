// Basically taken from Backbone.
$require('history', ['extend', 'singleton', 'utils', 'location'], function(extend, singleton, utils, Location) {
  var pathStripper = /#.*$/; // urls of hash

  var History = function(){};

  // Put a listener on the window that listens for anchor clicks. Determine if we have a route. If we do,
  // (and the target isn't blank) prevent default and call navigate. Otherwise, just let it ride.

  History.prototype.init = function() {
    this._super();
    this.started = false;
    this.handlers = [];
    if (utils.isClient()) {
      this.history = window.history;
    }
    this._hasHashChange = utils.isClient() ? 'onhashchange' in window : false;
    this._hasPushState = !!(this.history && this.history.pushState);
  };
  // Default interval to poll for hash changes in 50ms.
  History.prototype.interval = 50;

  // Default options for History -- want to default to try to be HTML5 full routes, but fall back to hash changes.
  History.prototype._defaultOptions = {
    'root': '/',
    'hashChange': true,
    'pushState': true,
    'silent': false
  };

  History.prototype._isStarted = function() {
    if (!utils.isClient()) return false;
    if (!this.started) this.start();
    return true;
  };

  History.prototype.addRoute = function(route) {
    var path = route.path;
    var handler;
    for (var i=0; i<this.handlers.length; i++) {
      if (utils.equals(this.handlers[i].path, path)) {
        handler = this.handlers[i];
        break;
      }
    }
    if (!handler) {
      handler = {
        'path': path,
        'routes': []
      };
      this.handlers.push(handler);
    }
    handler.routes.push(route);
  };

  History.prototype.removeRoute = function(route) {
    var path = route.path,
        id = route.__id;
    var handler;
    for (var i=0; i<this.handlers.length; i++) {
      if (utils.equals(this.handlers[i].path, path)) {
        handler = this.handlers[i];
        break;
      }
    }
    if (!handler) return;
    var routes = handler.routes || [];
    for (var i=0; i<routes.length; i++) {
      if (routes[i].__id === id) {
        routes.splice(i, 1);
        break;
      }
    }
  };

  History.prototype.getFragment = function(fragment) {
    if (fragment == null) {
      if (this._usePushState || !this._wantsHashChange) {
        fragment = this.getPath();
      } else {
        fragment = this.getHash();
      }
    }
    return this._super(fragment);
  };

  // Start the hash change handling, returning `true` if the current URL matches an existing route,
  // and `false` otherwise.
  History.prototype.start = function(options) {
    if (this.started) return;
    this.started = true;
    // Figure out the initial configuration. Do we need an iframe?
    // Is pushState desired ... is it available?
    this.options = $.extend({}, this._defaultOptions, options);
    this._wantsHashChange = this.options.hashChange !== false;
    this._useHashChange = this._wantsHashChange && this._hasHashChange;
    this._wantsPushState = !!this.options.pushState;
    this._usePushState = this._wantsPushState && this._hasPushState;

    // Initialize the root and location.
    this._super(this.options);
    this.fragment = this.getFragment();

    if (!utils.isClient()) return;

    // Transition from hashChange to pushState or vice versa if both are requested.
    if (this._wantsHashChange && this._wantsPushState) {
      // If we've started off with a route from a `pushState`-enabled
      // browser, but we're currently in a browser that doesn't support it...
      if (!this._hasPushState && !this.atRoot()) {
        var root = this.root.slice(0, -1) || '/';
        this.location.replace(root + '#' + this.getPath());
        // Return immediately b/c browser will do a redirect to the new url.
        return true;
      } else if (this._hasPushState && this.atRoot()) {
        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        this.navigate(this.getHash(), {replace: true});
      }
    }
    // Proxy an iframe to handle location events if the browser doesn't
    // support the `hashchange` event, HTML5 history, or the user wants
    // `hashChange` but not `pushState`.
    if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
      this._proxyIframe();
    }
    // Add history change listeners.
    this._addListeners();
  };

  History.prototype._setLinkListener = function() {
    this._linkListener = this._onLinkClick.bind(this);
    $("body").on('click', 'a', this._linkListener);
  };

  History.prototype._removeLinkListener = function() {
    $("body").off('click', 'a', this._linkListener);
  };

  History.prototype._onLinkClick = function(e) {
    var el = e.currentTarget,
        href = el.getAttribute('href'),
        target = el.getAttribute('target');
    try {
      if (target.toLowerCase() === '_blank') return;
    }catch(err){};
    var fragment = this.getFragment(href);
    var routes = this.getRoutes(fragment);
    if (!routes) return;
    // Navigate to the link.
    this.navigate(fragment);
    // Load the routes.
    this.executeRoutes(routes, this.getFragment(fragment));
    e.preventDefault();
    Platform.performMicrotaskCheckpoint();
  };

  History.prototype._proxyIframe = function() {
    this.iframe = document.createElement('iframe');
    this.iframe.src = 'javascript:0';
    this.iframe.style.display = 'none';
    this.iframe.tabIndex = -1;
    var body = document.body;
    // Using `appendChild` will throw on IE < 9 if the document is not ready.
    var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
    iWindow.document.open();
    iWindow.document.close();
    iWindow.location.hash = '#' + this.fragment;
  };

  History.prototype._addListeners = function() {
    if (!utils.isClient()) return;
    // Add a cross-platform `addEventListener` shim for older browsers.
    var addEventListener = window.addEventListener || function (eventName, listener) {
      return attachEvent('on' + eventName, listener);
    };

    // Depending on whether we're using pushState or hashes, and whether onhashchange' is supported,
    // determine how we check the URL state.
    if (this._usePushState) {
      addEventListener('popstate', this.checkUrl.bind(this), false);
    } else if (this._useHashChange && !this.iframe) {
      addEventListener('hashchange', this.checkUrl.bind(this), false);
    } else if (this._wantsHashChange) {
      this._setInterval();
    }
    this._setLinkListener();
  };

  History.prototype._setInterval = function() {
    clearTimeout(this._checkUrlInterval);
    this.checkUrl();
    this._checkUrlInterval = setTimeout(this._setInterval.bind(this), this.interval);
  };

  History.prototype.stop = function() {
    if (!this.started || !utils.isClient()) return;
    // Add a cross-platform `removeEventListener` shim for older browsers.
    var removeEventListener = window.removeEventListener || function (eventName, listener) {
      return detachEvent('on' + eventName, listener);
    };

    // Remove window listeners.
    if (this._usePushState) {
      removeEventListener('popstate', this.checkUrl, false);
    } else if (this._useHashChange && !this.iframe) {
      removeEventListener('hashchange', this.checkUrl, false);
    }

    // Clean up the iframe if necessary.
    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
    }

    // Some environments will throw when clearing an undefined interval.
    if (this._checkUrlInterval) clearTimeout(this._checkUrlInterval);

    this._removeLinkListener();
    this.started = false;
  };

  History.prototype.checkUrl = function(e) {
    if (!this._isStarted()) return;
    var current = this.getFragment();
    // If the user pressed the back button, the iframe's hash will have changed and we should use that for comparison.
    if (current === this.fragment && this.iframe) {
      current = this.getHash(this.iframe.contentWindow);
    }

    if (current === this.fragment) return false;
    if (this.iframe) this.navigate(current);
    this.loadUrl(current);
  };

  // Attempt to load the current URL fragment. If a route succeeds with a match, returns `true`. If no defined routes
  // matches the fragment, returns `false`.
  History.prototype.loadUrl = function(fragment) {
    if (!this._isStarted()) return false;
    var routes = this.getRoutes(fragment);
    if (!routes) return false;
    this.$broadcast('unload', this.fragment);
    this.fragment = this.getFragment(fragment);
    return this.executeRoutes(routes, this.getFragment(fragment));
  };

  History.prototype.getRoutes = function(fragment) {
    // If the root doesn't match, no routes can match either.
    if (!this.matchRoot()) return false;
    fragment = this.getFragment(fragment);
    // Test the fragments, get the routes, execute them.
    for (var i=0; i<this.handlers.length; i++) {
      var pathReg = this.handlers[i].path;
      if (pathReg.test(fragment)) {
        var routes = this.handlers[i].routes;
        return routes && routes.length ? routes : false;
      }
    }
    return false;
  };

  History.prototype.executeRoutes = function(routes, fragment) {
    for (var i = 0; i < routes.length; routes++) {
      routes[i].execute(fragment);
    }
    return true;
  };

  // Save a fragment into the hash history, or replace the URL state if the
  // 'replace' option is passed. You are responsible for properly URL-encoding
  // the fragment in advance.
  //
  // The options object can contain `trigger: true` if you wish to have the
  // route callback be fired (not usually desirable), or `replace: true`, if
  // you wish to modify the current URL without adding an entry to the history.
  History.prototype.navigate = function(fragment, options) {
    if (!this._isStarted()) return false;
    if (!options || options === true) options = {trigger: !!options};

    // Normalize the fragment.
    fragment = this.getFragment(fragment || '');

    // Don't include a trailing slash on the root.
    var root = this.root;
    if (fragment === '' || fragment.charAt(0) === '?') {
      root = root.slice(0, -1) || '/';
    }
    var url = root + fragment;

    // Strip the hash and decode for matching.
    fragment = this.decodeFragment(fragment.replace(pathStripper, ''));

    if (this.fragment === fragment) return;
    // Broadcast the unload event.
    this.$broadcast('unload', this.fragment);
    this.fragment = fragment;
    // If pushState is available, we use it to set the fragment as a real URL.
    if (this._usePushState) {
      this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
    } else if (this._wantsHashChange) {
      this._updateHash(this.location, fragment, options.replace);
      if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
        var iWindow = this.iframe.contentWindow;

        // Opening and closing the iframe tricks IE7 and earlier to push a
        // history entry on hash-tag change.  When replace is true, we don't
        // want this.
        if (!options.replace) {
          iWindow.document.open();
          iWindow.document.close();
        }

        this._updateHash(iWindow.location, fragment, options.replace);
      }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
    } else {
      return this.location.assign(url);
    }
    if (options.trigger) return this.loadUrl(fragment);
  };

  // Update the hash location, either replacing the current entry, or adding
  // a new one to the browser history.
  History.prototype._updateHash = function(location, fragment, replace) {
    if (replace) {
      var href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment;
    }
  };

  History.prototype.$remove = function() {
    this.stop();
    this.scopeTree.removeSelf();
  };

  return extend(Location, History);
  //return singleton.create(extend(Location, History));
});