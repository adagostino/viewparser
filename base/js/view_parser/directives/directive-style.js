var subClass = 'directive';
(function(subClass) {
  var directiveName = 'dc-style';

  var directive = function(){};

  directive.prototype.init = function(attrs) {
    this.styleMap = null;
    this.$parseAndWatch(attrs[directiveName], function() {
      var o = this._parseFunc(this.$scope);
      if (!this.styleMap) {
        this.styleMap = {};
        for (var key in o) {
          var ccKey = $app.utils.toCamelCase(key);
          if (this.el.style.hasOwnProperty(ccKey)) {
            this.styleMap[key] = ccKey;
          } else {
            console.warn('You are trying to listen to a style: ', key, 'that does not exist on el:', this.el);
          }
        }
      }
      this.styleChanged(o);
    });
  };

  directive.prototype.styleChanged = function(o) {
    for (var key in o) {
      var cc = this.styleMap[key],
          value = o[key];
      if (cc) {
        value ? this.addStyle(cc, value) : this.removeStyle(cc);
      }
    }
  };

  directive.prototype.addStyle = function(key, value) {
    this.el.style[key] = $app.utils.isNumber(value) ? value + 'px' : value;
  };

  directive.prototype.removeStyle = function(key) {
    this.el.style[key] = "";
  };

  $app.addDirective(subClass, {
    'name': directiveName,
    'directive': directive
  });


})(subClass);