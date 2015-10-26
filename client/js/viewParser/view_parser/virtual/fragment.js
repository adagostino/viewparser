var __className = 'documentfragment';
$require(__className, ['element', 'extend'], function(Element, extend) {
  /* Fragment */
  var Fragment = function(){};

  Fragment.prototype = {
    'init': function() {
      this._super.apply(this, arguments);
      this.startTag = '';
      this.endTag = '';
    }
  };

  return extend(Element, Fragment);
});