var __className = 'textnode';
$require(__className, ['element', 'extend'], function(Element, extend) {

  var TextNode = function(){};

  TextNode.prototype = {
    'init': function(tagName, text) {
      this._super.apply(this, arguments);
      this.startTag = '';
      this.endTag = '';
      this.nodeValue = text;
    },
    'buildHTML': function() {
      var text = this.nodeValue || '';
      return this.startTag + text + this.endTag;
    }
  };

  return extend(Element, TextNode);
});