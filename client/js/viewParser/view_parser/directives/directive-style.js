var __className = 'dc-style';
$require(__className, ['utils', 'viewParser', 'extend', 'directive'], function(utils, viewParser, extend, Directive) {
  var StyleDirective = function(){};

  StyleDirective.prototype.init = function(attrs) {
    this.styleMap = null;
    this.$parseAndWatch(attrs[this.__className], function() {
      var o = this._parseFunc(this.$scope);
      if (!this.styleMap) {
        this.styleMap = {};
        for (var key in o) {
          var ccKey = utils.toCamelCase(key);
          this.styleMap[key] = ccKey;
        }
      }
      this.styleChanged(o);
    });
  };

  StyleDirective.prototype.styleChanged = function(o) {
    for (var key in o) {
      var cc = this.styleMap[key],
          value = o[key];
      if (cc) {
        value ? this.addStyle(cc, value) : this.removeStyle(cc);
      }
    }
  };

  StyleDirective.prototype.addStyle = function(key, value) {
    value += utils.isNumber(value) ? 'px' : '';
    this.el.style[key] = value;
  };

  StyleDirective.prototype.removeStyle = function(key) {
    this.el.style[key] = "";
  };

  return viewParser.addDirective({
    'directive': extend(Directive, StyleDirective)
  });
});
