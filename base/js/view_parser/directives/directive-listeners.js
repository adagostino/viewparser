(function() {
  var events = [
    'input',
    'change',
    'keyup',
    'keydown',
    'click',
    'mouseup',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'focus',
    'blur',
    'load',
    'paste',
    'dragstart',
    'drag',
    'dragenter',
    'dragleave',
    'dragover',
    'drop',
    'dragend'
  ];
  var _paramReg = /(?:\()([^\(\)]*)(?:\))/;
  var _getScopeOfFunction = function ($scope, value) {
    var va = value.split(".");
    va.pop();
    var done = false;
    while (va.length > 0 && !done) {
      var ts = Path.get(va.join(".")).getValueFrom($scope);
      if (ts.__templateType) {
        $scope = ts;
        done = true;
      } else {
        va.pop();
      }
    }
    return $scope;
  };

  for (var i=0; i<events.length; i++) {
    (function(_event) {
      var __className = 'dc-' + _event;
      $require(__className, ['viewParser', 'extend', 'directive'], function (viewParser, extend, Directive) {
        var ListenerDirective = function () {};

        ListenerDirective.prototype.init = function (attrs) {
          this.hasChanged();
        };

        ListenerDirective.prototype.hasChanged = function () {
          var attrValue = this.el.getAttribute(this.__className);
          if (this.value === attrValue) return false;

          this.value = attrValue;
          this.removeListener();
          this.closeObservers && this.closeObservers();

          if (this.value) {
            var o = this.parseListener(this.value);
            var callback;
            this.closeObservers = this.$parseAndWatch(o.funcStr, function () {
              var func = this._parseFunc(this.$scope);
              callback = this.listenerChanged(o.funcStr, func, o.params);
            });
            callback && callback.apply(this);
          }
          return true;
        };

        ListenerDirective.prototype.parseListener = function (funcStr) {
          var params;
          funcStr = funcStr.replace(_paramReg, function (match, $1) {
            if ($1) params = $1.split(/\s*,\s*/);
            return '';
          });
          return {
            'funcStr': funcStr,
            'params': params
          }
        };

        ListenerDirective.prototype.listenerChanged = function (funcStr, func, params) {
          this.removeListener();
          this.setListener(funcStr, func, params);
        };

        ListenerDirective.prototype.setListener = function (funcStr, func, params) {
          if (!func) return;
          var callback = function () {
            if (this.hasChanged()) return;
            func.apply(_getScopeOfFunction(this.$scope, funcStr), this.getParamsFromScope(params));
            Platform.performMicrotaskCheckpoint();
          }.bind(this);
          this.removeEventListener = this.$listenTo(_event, callback);
          return callback;
        };

        ListenerDirective.prototype.removeListener = function () {
          this.removeEventListener && this.removeEventListener();
        };

        ListenerDirective.prototype.getParamsFromScope = function (params) {
          params = params || [];
          var a = [];
          for (var i = 0; i < params.length; i++) {
            a.push(this.$parse(params[i], this.$scope));
          }
          return a;
        };

        return viewParser.addDirective({
          'directive': extend(Directive, ListenerDirective)
        });

      });
    })(events[i]);
  }
})();