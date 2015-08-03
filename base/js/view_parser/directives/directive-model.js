var subClass = 'directive';
(function(subClass){
  var directiveName = 'dc-model';

  var directive = function(){};

  directive.prototype.init = function(attrs) {
    var fn = this.el.tagName === 'INPUT' || this.el.tagName === 'TEXTAREA' ? 'value' : 'innerHTML',
        model = attrs[directiveName];

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

  $app.addDirective(subClass, {
    'name': directiveName,
    'directive': directive
  });
})(subClass);