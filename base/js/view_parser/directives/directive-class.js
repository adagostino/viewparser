var __className = 'dc-class';
$require(__className, ['viewParser', 'extend', 'utils', 'directive'], function(viewParser, extend, utils, Directive) {
  var ClassDirective = function(){};

  ClassDirective.prototype.init = function(attrs){
    this.regexs = null;

    this.$parseAndWatch(attrs[this.__className], function() {
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

  ClassDirective.prototype.classChanged = function(o) {
    var elClassStr = this.el.className;
    for (var key in o) {
      elClassStr = o[key] ? this.addClass(key, elClassStr) : this.removeClass(key, elClassStr);
    }
    elClassStr = utils.trim(elClassStr);
    if (elClassStr) {
      this.el.className = elClassStr;
    } else {
      this.el.removeAttribute('class');
    }
  };

  ClassDirective.prototype.addClass = function(className, elClassStr) {
    if (!elClassStr.match(this.regexs[className])) elClassStr+= elClassStr ? " " + className : className;
    return elClassStr;
  };

  ClassDirective.prototype.removeClass = function(className, elClassStr) {
    return elClassStr.replace(this.regexs[className], function(fullMatch, space1, match, space2) {
      return space1 && space2 ? " " : "";
    });
  };

  return viewParser.addDirective({
    'directive': extend(Directive, ClassDirective)
  });
});