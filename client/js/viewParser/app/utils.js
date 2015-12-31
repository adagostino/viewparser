var __className = 'utils';
$require(__className, ['singleton', 'ngParser', 'idGenerator'], function(singleton, ngParser, idGenerator) {
  var _dashesRegex = /-(.)/g,
      _firstLetterRegex = /^./,
      _hasNonDigitsRegex = /\D+/,
      _toDash = /([^-])([A-Z])|(^[A-Z])/g,
			_isNotWordReg = /^\s*[^\w\$]/g,
      // Just taken from jQuery.
      _rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,
      _ostring = Object.prototype.toString;

  var Utils = function(){};

  Utils.prototype.toCamelCase = function(str) {
    return (str || "").replace(_dashesRegex, function ($0, $1) {
      return $1.toUpperCase();
    }).replace(_firstLetterRegex, function ($0) {
      return $0.toLowerCase()
    });
  };

  Utils.prototype.toDash = function (str) {
    return (str || "").replace(_toDash, function (match, lower, upper, firstChar) {
      upper = upper || firstChar;
      lower = lower || '';
      return lower + '-' + upper.toLowerCase();
    });
  };

  Utils.prototype.round = function(num, dec) {
    var sign = num < 0 ? -1 : 1,
        pow = Math.pow(10, dec || 0);
    return sign * Math.round(sign * num * pow) / pow;
  };

  Utils.prototype.isNumber = function(str) {
    return !_hasNonDigitsRegex.test(str);
  };

  Utils.prototype.trim = function (text) {
    return text == null ? "" : (text + "").replace(_rtrim, "");
  };

  Utils.prototype.$parse = function(expr) {
    return ngParser(expr)
  };

  Utils.prototype.getParser = function() {
    return ngParser;
  };

  Utils.prototype.getPaths = function(tokens) {
		var keys = [];
		for (var i = 0; i < tokens.length; i++) {
			if (!tokens[i].hasOwnProperty('json')) {
				!_isNotWordReg.test(tokens[i].text) && keys.push(tokens[i].text);
			}
		}
		return keys;
	};

  // Just taken from jQuery
  Utils.prototype.isArray = function(it) {
    return this.typeof(it) === 'array';
  };

  Utils.prototype.isFunction = function(it) {
    return this.typeof(it) === 'function';
  };

  Utils.prototype.isObject = function(it) {
    return this.typeof(it) === 'object';
  };

  Utils.prototype.isDate = function(it) {
    return this.typeof(it) === 'date';
  };

  Utils.prototype.isRegExp = function(it) {
    return this.typeof(it) === 'regexp';
  };

  Utils.prototype.isWindow = function(it) {
    return it && it.document && it.location && it.alert && it.setInterval;
  };

  Utils.prototype.isScope = function(it) {
    return it && it.__isScope_;
  };

  Utils.prototype.typeof = function(it) {
    var type = typeof it;
    var rtype = type;
    switch(type) {
      case 'object':
        /* falls through */
      case 'function':
        var str = _ostring.call(it);
        rtype = str.substring(8, str.length - 1);
        break;
      default:
        break;
    }
    return rtype.toLowerCase();
  };

  Utils.prototype.isArrayLike = function (obj) {
    // https://github.com/angular/angular.js/blob/19ecdb54bf85fc4e7bd3cde453aa6843f869a1ab/src/Angular.js.
    if (obj == null || this.isWindow(obj)) {
      return false;
    }

    // Support: iOS 8.2 (not reproducible in simulator)
    // "length" in obj used to prevent JIT error (gh-11508)
    var length = "length" in Object(obj) && obj.length;

    if (obj.nodeType === 1 && length) {
      return true;
    }

    var type = this.typeof(obj);
    return type === 'string' || type === 'array' || length === 0 ||
      typeof length === 'number' && length > 0 && (length - 1) in obj;
  };

  Utils.prototype.equals = function(o1, o2) {
    // Just taken from angular.
    if (o1 === o2) return true;
    if (o1 === null || o2 === null) return false;
    if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
    var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
    if (t1 == t2) {
      if (t1 == 'object') {
        if (this.isArray(o1)) {
          if (!this.isArray(o2)) return false;
          if ((length = o1.length) == o2.length) {
            for (key = 0; key < length; key++) {
              if (!this.equals(o1[key], o2[key])) return false;
            }
            return true;
          }
        } else if (this.isDate(o1)) {
          return this.isDate(o2) && o1.getTime() == o2.getTime();
        } else if (this.isRegExp(o1) && this.isRegExp(o2)) {
          return o1.toString() == o2.toString();
        } else {
          if (this.isScope(o1) || this.isScope(o2) || this.isWindow(o1) || this.isWindow(o2) || this.isArray(o2)) return false;
          keySet = {};
          for (key in o1) {
            if (key.charAt(0) === '$' || this.isFunction(o1[key])) continue;
            if (!this.equals(o1[key], o2[key])) return false;
            keySet[key] = true;
          }
          for (key in o2) {
            if (!keySet.hasOwnProperty(key) &&
              key.charAt(0) !== '$' &&
              o2[key] !== undefined && !this.isFunction(o2[key])) return false;
          }
          return true;
        }
      }
    }
    return false;
  };

  Utils.prototype.getId = function(obj, idFn) {
    // https://github.com/angular/angular.js/blob/291d7c467fba51a9cb89cbeee62202d51fe64b09/src/apis.js
    var key = obj && obj.__id;

    if (key) {
      if (typeof key === 'function') {
        key = obj.__id();
      }
      return key;
    }

    var objType = typeof obj;
    if (objType == 'function' || (objType == 'object' && obj !== null)) {
      //key = obj.$$hashKey = objType + ':' + (nextUidFn || nextUid)();
      key = obj.__id = (idFn || idGenerator)();
    } else {
      key = objType + ':' + obj;
    }
    return key;
  };

  Utils.prototype.isOrphaned = function(el) {
    return el ? (el.tagName === 'BODY' ? false : this.isOrphaned(el.parentNode)) : true;
  };

  var global = this;
  Utils.prototype.isClient = function() {
    return this.isWindow(global);
  };

  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(32);
  }

  Utils.prototype.guid = function() {
    return s4() + s4();
  };

  Utils.prototype.searchArray = function(arr, forThis) {
    if (!this.isArray(arr)) return;
    var isObj = this.isObject(forThis),
        found = false;

    for (var i=0; i<arr.length; i++) {
      var o = arr[i];
      if (isObj && o) {
        found = true;
        for (var key in forThis) {
          if (o[key] !== forThis[key]) {
            found = false;
            break;
          }
        }
      } else {
        found = o === forThis;
      }
      if (found) {
        return o;
      }
    }
  };

  Utils.prototype.getLocal = function(key) {
    if (typeof Storage === 'undefined') return;
    var item = localStorage.getItem(key);
    item = item ? JSON.parse(item) : {'value': item};
    return item.value;
  };

  Utils.prototype.setLocal = function(key, value) {
    if (typeof Storage === 'undefined') return;
    if (typeof value !== 'null' && typeof value !== 'undefined') {
      value = {
        'type': this.typeof(value),
        'value': value
      };
    }
    value ? localStorage.setItem(key, JSON.stringify(value)) : localStorage.removeItem(key);
  };

  return singleton.create(Utils);
});