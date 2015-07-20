var subClass = 'directive';
(function(subClass){
  var directiveName = 'dc-model';

  var directive = function(){};

  directive.prototype.init = function(attrs) {
    var fn = this.el.tagName === 'INPUT' || this.el.tagName === 'TEXTAREA' ? 'value' : 'innerHTML',
        model = attrs[directiveName];

    this.$parseAndWatch(model, function() {
      var val = this._parseFunc(this.$scope);
      if (this.el[fn] !== val) this.el[fn] = (val || '');
    });

    var callback = function(){1
      Path.get(model).setValueFrom(this.$scope, this.el[fn]);
      Platform.performMicrotaskCheckpoint();
    }.bind(this);
    this.removeEventListener = this.listenTo('input', callback);
  };

  $app.addDirective(subClass, {
    'name': directiveName,
    'directive': directive
  });
})(subClass);