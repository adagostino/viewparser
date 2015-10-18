$require('location', ['extend', 'listener'], function(extend, Listener) {
  var routeStripper = /^[#\/]|\s+$/g, // leading hash/slash and trailing space.
      rootStripper = /^\/+|\/+$/g; //leading and trailing slashes.

  var Location = function(){};

  Location.prototype.init = function() {
    if (window) {
      this.location = window.location;
    }
  };

  Location.prototype.start = function(options) {
    // Normalize root to always include a leading and trailing slash.
    this.root = ('/' + options.root + '/').replace(rootStripper, '/');
  };

  // Unicode characters in `location.pathname` are percent encoded so they're decoded for comparison.
  // `%25` should not be decoded since it may be part of an encoded parameter.
  Location.prototype.decodeFragment = function(fragment) {
    return decodeURI(fragment.replace(/%25/g, '%2525'));
  };

  Location.prototype.matchRoot = function() {
    var path = this.decodeFragment(this.location.pathname);
    var root = path.slice(0, this.root.length - 1) + '/';
    return root === this.root;
  };

  Location.prototype.atRoot = function() {
    var path = this.location.pathname.replace(/[^\/]$/, '$&/');
    return path === this.root && !this.getSearch();
  };

  // In IE6, the hash fragment and search params are incorrect if the
  // fragment contains `?`.
  Location.prototype.getSearch = function() {
    var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
    return match ? match[0] : '';
  };

  // Gets the true hash value. Cannot use location.hash directly due to bug in Firefox where
  // location.hash will always be decoded.
  Location.prototype.getHash = function(window) {
    var match = (window || this).location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  };

  Location.prototype.getPath = function() {
    var path = this.decodeFragment(this.location.pathname + this.getSearch()).slice(this.root.length - 1);
    return path.charAt(0) === '/' ? path.slice(1) : path;
  };

  Location.prototype.getFragment = function(fragment) {
    return fragment.replace(routeStripper, '');
  };

  return extend(Listener, Location);
});
