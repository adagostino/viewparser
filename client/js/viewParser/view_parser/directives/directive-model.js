var __className = 'dc-model';
$require(__className, ['viewParser', 'extend', 'directive'], function(viewParser, extend, Directive) {
  var ModelDirective = function(){};

  ModelDirective.prototype.init = function(attrs) {
    var fn = this.el.tagName === 'INPUT' || this.el.tagName === 'TEXTAREA' ? 'value' : 'innerHTML',
        model = attrs[this.__className];

    this.$watch('$scope.' + model, function(val) {
      if (this.el[fn] !== val) this.el[fn] = (val || '');
    });

    var callback = function(){
      Path.get(model).setValueFrom(this.$scope, this.el[fn]);
      Platform.performMicrotaskCheckpoint();
    }.bind(this);

    this.$listenTo('input', callback);

    var val = Path.get(model).getValueFrom(this.$scope);
    if (this.el[fn] !== val) this.el[fn] = (val || '');
  };

  return viewParser.addDirective({
    'directive': extend(Directive, ModelDirective)
  });
});
