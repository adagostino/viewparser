var name = 'element';
$require(name, ['utils', 'extend', 'node'], function(utils, extend, Node) {
  /* Element */
  var _NODETYPES = {
    'COMMENT': 8,
    'DOCUMENTFRAGMENT': 11,
    'ELEMENT': 1,
    'TEXT': 3
  };

  var _makeMap = function (str) {
    var obj = {}, items = str.split(",");
    for (var i = 0; i < items.length; i++)
      obj[items[i]] = true;
    return obj;
  };

  // Empty Elements - HTML 4.01
	var _empty = _makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed".toUpperCase());

  var El = function(){};

  El.prototype.init = function(tagName){
    this._super.apply(this, arguments);
    this.attributes = []; // {name: str, value: str}
    this.style = {}; // camelCase style key: value
    this.innerHTML = '';
    this.value = '';
    this.className = '';
    this.tagName = tagName.toUpperCase();
    this.nodeType = _NODETYPES[this.tagName] || _NODETYPES['ELEMENT'];
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
  El.prototype.setAttribute = function(name, value, dontSetStyle) {
    // remember, this is an array
    var name = utils.trim(name),
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
            this.style[utils.toCamelCase(n)] = v;
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

  El.prototype.removeAttribute = function(name) {
    var attr = this.attributes[this._getAttributeIndex(name)];
    if (!attr) return;
    var nameLc = utils.trim(name.toLowerCase());
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

  El.prototype._getAttributeIndex = function(name) {
    var name = utils.trim(name.toLowerCase());
    for (var i=0; i<this.attributes.length; i++) {
      if (name === utils.trim(this.attributes[i].name.toLowerCase())) return i;
    }
    return -1;
  };

  El.prototype.getAttribute = function(name) {
    var attr = this.attributes[this._getAttributeIndex(name)] || {};
    return attr.value;
  };

  El.prototype._buildAttributes = function() {
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

  El.prototype._buildStyleAttribute = function() {
    var value = this._buildStyleString();
    this.setAttribute('style', value || null, true);
  };

  El.prototype._buildStyleString = function() {
    var str = '';
    for (var key in this.style) {
      var name = utils.toDash(key);
      if (this.style[key]) {
        if (str) str+='; ';
        str+=name + ':' + this.style[key];
      }
    }
    return str;
  };

  El.prototype.buildHTML = function() {
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

  El.prototype.addEventListener = function(event, callback) {
    // Maybe do something with this later
  };

  El.prototype.removeEventListener = function(event, callback) {
    // Maybe do something with this later.
  };

  return extend(Node, El);
});