var __className = 'virtualDocument';
$require(__className, ['documentfragment', 'textnode', 'comment', 'element'], function(Fragment, Textnode, Comment, Element) {
  /* document */
  var doc = {
    'createDocumentFragment': function() {
      return new Fragment('DOCUMENTFRAGMENT');
    },
    'createTextNode': function(text) {
      return new Textnode('TEXT', text);
    },
    'createComment': function(text) {
      return new Comment('COMMENT', text);
    },
    'createElement': function(tagName) {
      return new Element(tagName);
    }
  };

  return doc;
});