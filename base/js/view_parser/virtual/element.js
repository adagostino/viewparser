(function(global){
  global = global || window;

  var _makeMap = function (str) {
    var obj = {}, items = str.split(",");
    for (var i = 0; i < items.length; i++)
      obj[items[i]] = true;
    return obj;
  };
  var _dashesRegex = /-(.)/g,
      _firstLetterRegex = /^./;
  var _toCamelCase = function(str) {
    return (str || "").replace(_dashesRegex, function($0, $1){return $1.toUpperCase();})
                      .replace(_firstLetterRegex,function($0) {return $0.toLowerCase()});
  };

  // Just taken from jQuery.
  var _rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
      _trim = function( text ) {
        return text == null ?
          "" :
          ( text + "" ).replace( _rtrim, "" );
      };

  // Empty Elements - HTML 4.01
	var _empty = _makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed".toUpperCase());

  /* Node */
  var ct = 0;

  var node = function(){};

  node.prototype.init = function() {
    this.__id = ct++;
    this.childNodes = [];
    this.parentNode = null;
    this.nodeType = null;
    this.startTag = '';
    this.endTag = '';
    this.tabIndex = -1;
    this.firstChild = null;
    this.firstElementChild = null;
    this.lastChild = null;
    this.lastElementChild = null;

    // Still need to implement
    this.nodeName = '';
    this.parentElement = null; // not in jquery
    this.classList = []; // not in jquery
    this.children = []; // not in jquery

    this.offsetParent = null; //https://drafts.csswg.org/cssom-view/#dom-htmlelement-offsetparent

  };

  node.prototype.appendChild = function(childNode) {
    var prevSibling = this.childNodes[this.childNodes.length - 1];
    if (prevSibling) {
      prevSibling.nextSibling = childNode;
      childNode.previousSibling = prevSibling;
    }
    childNode.__setParent(this);
    this.childNodes.push(childNode);
    this.__updateChildren();
  };

  node.prototype.insertBefore = function(nodeToInsert, beforeThisNode) {
    if (!beforeThisNode) {
      return this.appendChild(nodeToInsert);
    }
    if (!beforeThisNode.parentNode || beforeThisNode.parentNode.__id !== this.__id) {
      console.warn('trying to insert a node', nodeToInsert, 'before a node', beforeThisNode, 'that does not belong to this parent', this);
      return;
    }
    var idx = this._getIndexOfChildNode(beforeThisNode);
    if (idx === -1) {
      console.warn('Coulding find the before childNode', beforeThisNode, 'on', this);
      return;
    }

    var prev = this.childNodes[idx];
    if (prev) {
      prev.nextSibling = nodeToInsert;
      nodeToInsert.previousSibling = prev;
    }
    nodeToInsert.nextSibling = beforeThisNode;
    beforeThisNode.previousSibling = nodeToInsert;
    nodeToInsert.__setParent(this);

    this.childNodes.splice(idx, 0, nodeToInsert);
    this.__updateChildren();
  };

  node.prototype.removeChild = function(childNode) {
    var idx = this._getIndexOfChildNode(childNode);
    if (idx === -1) {
      console.warn('trying to remove a node', childNode, 'that is not a child of', this);
      return;
    }
    var prev = this.childNodes[idx - 1],
        next = this.childNodes[idx + 1];
    if (prev) {
      prev.nextSibling = next;
    }
    if (next) {
      next.previousSibling = prev;
    }
    this.childNodes.splice(idx, 1);
    this.__updateChildren();
  };

  node.prototype.__updateChildren = function() {
    this.firstChild = this.childNodes[0];
    this.lastChild = this.childNodes[this.childNodes.length - 1];
    this.firstElementChild = null;
    this.lastElementChild = null;
    var firstFound = false,
        lastFound = false,
        ct = 0,
        len = this.childNodes.length;
    while (!firstFound && ct < len) {
      if (this.childNodes[ct].nodeType === 1) {
        firstFound = true;
        this.firstElementChild = this.childNodes[ct];
      }
      ct++;
    }
    ct = len -1;
    while (!lastFound && ct > -1) {
      if (this.childNodes[ct].nodeType === 1) {
        lastFound = true;
        this.lastElementChild = this.childNodes[ct];
      }
      ct--;
    }
  };

  node.prototype.__setParent = function(parent){
    this.parentNode = parent;
    this.parentElement = parent.nodeType === 1 ? parent : null;
  };

  node.prototype._getIndexOfChildNode = function(childNode) {
    var idx = -1;
    for (var i=0; i<this.childNodes.length; i++) {
      if (this.childNodes[i].__id === childNode.__id) {
        return i;
      }
    }
    return idx;
  };

  /* Element */
  var _nodeTypes = {
    'COMMENT': 8,
    'DOCUMENTFRAGMENT': 11,
    'ELEMENT': 1,
    'TEXT': 3
  };

  var el = function(){};

  el.prototype.init = function(tagName){
    this._super.apply(this, arguments);
    this.attributes = []; // {name: str, value: str}
    this.style = {}; // camelCase style key: value
    this.innerHTML = '';
    this.value = '';
    this.className = '';
    this.tagName = tagName.toUpperCase();
    this.nodeType = _nodeTypes[this.tagName] || _nodeTypes['ELEMENT'];
    this.__isUnary = _empty[this.tagName];
    this.startTag = '<' + tagName;
    this.endTag = this.__isUnary ? '/>' : ('</' + tagName + '>');
    this.id = '';
    this.title = '';
    this.href = '';
    this.src = '';
    this.type = '';

  };

  var _styleReg = /([^\:\s]+)(?:\s*\:\s*)([^\;\s]+)/g;
  el.prototype.setAttribute = function(name, value, dontSetStyle) {
    // remember, this is an array
    var name = _trim(name),
        nameLc = name.toLowerCase();
    var attr = this.attributes[this._getAttributeIndex(name)];
    if (!attr) {
      attr = {'name': name, 'value': null};
      this.attributes.push(attr);
    }
    attr.value = value;
    switch(nameLc) {
      case 'style':
        if (!dontSetStyle) {
          (value || '').replace(_styleReg, function(match, n, v) {
            this.style[_toCamelCase(n)] = v;
          }.bind(this));
        }
        break;
      case 'class':
        this.className = value;
        break;
      case 'id':
        this.id = value;
        break;
      case 'title':
        this.title = value;
        break;
      case 'href':
        this.href = value;
        break;
      case 'src':
        this.src = value;
        break;
      case 'type':
        this.type = value;
        break;
      default:
        break;
    }
  };

  el.prototype.removeAttribute = function(name) {
    var attr = this.attributes(this._getAttributeIndex(name));
    if (!attr) return;
    var nameLc = _trim(name.toLowerCase());
    switch(nameLc) {
      case 'style':
        this.style = {};
        break;
      case 'class':
        this.className = '';
        break;
      case 'id':
        this.id = '';
        break;
      case 'title':
        this.title = '';
        break;
      case 'href':
        this.href = '';
        break;
      case 'src':
        this.src = '';
        break;
      case 'type':
        this.type = '';
        break;
      default:
        break;
    }
    attr.value = null;
  };

  el.prototype._getAttributeIndex = function(name) {
    var name = _trim(name.toLowerCase());
    for (var i=0; i<this.attributes.length; i++) {
      if (name === _trim(this.attributes[i].name.toLowerCase())) return i;
    }
    return -1;
  };

  el.prototype._buildAttributes = function() {
    var str = '';
    this._buildStyleAttribute();
    if (this.value) this.setAttribute('value', this.value);
    if (this.className) this.setAttribute('class', this.className);
    if (this.id) this.setAttribute('id', this.id);
    if (this.title) this.setAttribute('title', this.title);
    if (this.href) this.setAttribute('href', this.href);
    if (this.src) this.setAttribute('src', this.src);
    if (this.type) this.setAttribute('type', this.type);

    for (var i=0; i<this.attributes.length; i++) {
      var attr = this.attributes[i];
      if (attr.value !== null) {
        if (str) str+=' ';
        str+=attr.name + '="' + attr.value + '"';
      }
    }
    return str;
  };

  el.prototype._buildStyleAttribute = function() {
    var value = this._buildStyleString();
    this.setAttribute('style', value || null, true);
  };

  var _toDash = /([^-])([A-Z])|(^[A-Z])/g;
  el.prototype._buildStyleString = function() {
    var str = '';
    for (var key in this.style) {
      var name = key.replace(_toDash, function(match, lower, upper, firstChar){
        upper = upper || firstChar;
        lower = lower || '';
        return lower + '-' + upper.toLowerCase();
      });
      if (this.style[key]) {
        if (str) str+='; ';
        str+=name + ':' + this.style[key];
      }
    }
    return str;
  };

  el.prototype.buildHTML = function() {
    if (this.innerHTML) return this.innerHTML;
    // otherwise build it.
    var str = this.startTag,
        attrStr = this._buildAttributes();

    if (attrStr) str+= ' ' + attrStr;
    if (!this.__isUnary && this.nodeType !== 11) str+='>';

    for (var i=0; i<this.childNodes.length; i++) {
      str+= this.childNodes[i].buildHTML();
    }
    str+= this.endTag;
    return str;
  };

  el.prototype.addEventListener = function(event, callback) {
    // Maybe do something with this later
  };

  el.prototype.removeEventListener = function(event, callback) {
    // Maybe do something with this later.
  };

  el = __subClass(node, el);

  /* Text Node */
  var tn = function(){};
  tn.prototype = {
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

  var textnode = __subClass(el, tn);


  /* Comment */
  var com = function(){};
  com.prototype = {
    'init': function(tagName, commentText) {
      this._super.apply(this, arguments);
      this.startTag = '<!--';
      this.endTag = '-->';
      this.nodeValue = commentText;
    }
  };
  var comment = __subClass(textnode, com);


  /* Fragment */
  var frag = function(){};
  frag.prototype = {
    'init': function() {
      this._super.apply(this, arguments);
      this.startTag = '';
      this.endTag = '';
    }
  };
  var fragment = __subClass(el, frag);

  /* document */
  var doc = {
    'createDocumentFragment': function() {
      return new fragment('DOCUMENTFRAGMENT');
    },
    'createTextNode': function(text) {
      return new textnode('TEXT', text);
    },
    'createComment': function(text) {
      return new comment('COMMENT', text);
    },
    'createElement': function(tagName) {
      return new el(tagName);
    }
  };

  global.virtualDocument = doc;
})();