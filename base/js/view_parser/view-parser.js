(function(global){
  global = global || window;

  var _viewParsers = {};

  var viewParser = function(directives){
    this._id = "__vp" + new Date().getTime();
    this._parsedTemplates = {};
    this.directives = {};
    this.addDirectives(directives);
    _viewParsers[this._id] = this;
  };

  // Unique Id generator
  var _chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split(''),
      _charsLength = _chars.length;
  viewParser.prototype.generateId_complicated = function (guidLength, includeDate) {
    includeDate = !!includeDate;
    guidLength = guidLength || 16;
    var guid = includeDate ? new Date().getTime() + '_' : '';

    for (var i = 0; i < guidLength; i++) {
      guid += _chars[Math.floor(Math.random() * _charsLength)];
    }

    return guid;
  };

  var _idCt = 0;
  viewParser.prototype.generateId = function() {
    return _idCt++;
  };


  viewParser.prototype.addDirectives = function(directives) {
    for (var key in directives) {
      this.addDirective(directives[key]);
    }
  };

  viewParser.prototype.addDirective = function(directive) {
    // name, directive, template, $scope
    if (!directive.name) {
      console.warn('Could not add directive b/c it did not have key: name.', directive);
      return;
    }
    this.directives[directive.name] = directive;
  };

  viewParser.prototype.getViewParserFromEl = function(el) {
    return el ? _viewParsers[el.__viewParser] : null;
  };

  viewParser.prototype.getViewParserFromScope = function($scope) {
    return $scope ? _viewParsers[$scope.__viewParser] : null;
  };

  viewParser.prototype.init = function() {

  };

  global.viewParser = viewParser;

})();