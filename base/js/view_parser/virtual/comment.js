var __className = 'comment';
$require(__className, ['textnode', 'extend'], function(Textnode, extend) {
  /* Comment */
  var Comment = function(){};
  Comment.prototype = {
    'init': function(tagName, commentText) {
      this._super.apply(this, arguments);
      this.startTag = '<!--';
      this.endTag = '-->';
      this.nodeValue = commentText;
    }
  };
  return extend(Textnode, Comment);
});