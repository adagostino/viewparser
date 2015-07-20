var subClass = 'directive';
(function(subClass) {
  var directiveName = 'dc-class';

  var directive = function(){};

  directive.prototype.init = function(attrs){
    this.regexs = null;

    this.$parseAndWatch(directiveName, function() {
      var o = this._parseFunc(this.$scope);
      if (!this.regexs) {
        this.regexs = {};
        for (var key in o) {
          this.regexs[key] = new RegExp("(\\s*)(" + key + ")(\\s*)", 'g'); // full, space1, match, space2
        }
      }
      this.classChanged(o);
    });

  };

  directive.prototype.classChanged = function(o) {
    var elClassStr = this.el.className;
    for (var key in o) {
      elClassStr = o[key] ? this.addClass(key, elClassStr) : this.removeClass(key, elClassStr);
    }
    elClassStr = $.trim(elClassStr);
    if (elClassStr) {
      this.el.className = elClassStr;
    } else {
      this.el.removeAttribute('class');
    }
  };

  directive.prototype.addClass = function(className, elClassStr) {
    if (!elClassStr.match(this.regexs[className])) elClassStr+= elClassStr ? " " + className : className;
    return elClassStr;
  };

  directive.prototype.removeClass = function(className, elClassStr) {
    return elClassStr.replace(this.regexs[className], function(fullMatch, space1, match, space2) {
      return space1 && space2 ? " " : "";
    });
  };

  $app.addDirective(subClass, {
    'name': directiveName,
    'directive': directive
  });
})(subClass);