var subClass = 'directive';
(function(subClass) {
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

  for (var i=0; i<events.length; i++) {
    (function(_event) {
      var directiveName = 'dc-' + _event;
      var directive = function(){};

      directive.prototype.init = function(attrs) {
        this.hasChanged();
      };

      directive.prototype.hasChanged = function() {
        var attrValue = this.el.getAttribute(directiveName);
        if (this.value === attrValue) return false;

        this.value = attrValue;
        this.removeListener();
        this.closeObservers && this.closeObservers();

        if (this.value) {
          var o = this.parseListener(this.value);
          var callback;
          this.closeObservers = this.$parseAndWatch(o.funcStr, function() {
            var func = this._parseFunc(this.$scope);
            callback = this.listenerChanged(o.funcStr, func, o.params);
          });
          callback && callback.apply(this);
        }
        return true;
      };

      directive.prototype.parseListener = function(funcStr) {
        var params;
        funcStr = funcStr.replace(_paramReg, function(match, $1){
          if ($1) params = $1.split(/\s*,\s*/);
          return '';
        });
        return {
          'funcStr': funcStr,
          'params': params
        }
      };

      var _getScopeOfFunction = function($scope, value){
        var va = value.split(".");
        va.pop();
        var done = false;
        while (va.length > 0 && !done){
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

      directive.prototype.listenerChanged = function(funcStr, func, params) {
        this.removeListener();
        this.setListener(funcStr, func, params);
      };

      directive.prototype.setListener = function(funcStr, func, params) {
        if (!func) return;
        var callback = function(){
          if (this.hasChanged()) return;
          func.apply(_getScopeOfFunction(this.$scope, funcStr), this.getParamsFromScope(params));
          Platform.performMicrotaskCheckpoint();
        }.bind(this);
        this.removeEventListener = this.$listenTo(_event, callback);
        return callback;
      };

      directive.prototype.removeListener = function () {
        this.removeEventListener && this.removeEventListener();
      };

      directive.prototype.getParamsFromScope = function(params) {
        var a = [];
        for (var i=0; i<params.length; i++) {
          a.push(this.$parse(params[i]).parseFunc(this.$scope));
        }
        return a;
      };

      $app.addDirective(subClass, {
        'name': directiveName,
        'directive': directive
      });

    })(events[i]);
  }


})(subClass);