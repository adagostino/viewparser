(function(global){
  global = global || window;
	var $parse = global.ngParser;
  // Regular Expressions for parsing tags and attributes
	var startTag = /^<([-A-Za-z0-9_:]+)((?:\s+[-A-Za-z0-9_,:;\'\"\)\(]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,
		  endTag = /^<\/([-A-Za-z0-9_:]+)[^>]*>/,
		  attr = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g,
			curlyCurlyReg = /{{[^}}]+}}/ig,
			curlyReg = /({|})/g,
			idReg = /^\s*\#/,
			atReg = /^\s*\@/,
			isNotWordReg = /[^\w]/g;

  var makeMap = function (str) {
    var obj = {}, items = str.split(",");
    for (var i = 0; i < items.length; i++)
      obj[items[i]] = true;
    return obj;
  };

	// Empty Elements - HTML 4.01
	var empty = makeMap("area,base,basefont,br,col,frame,hr,img,input,isindex,link,meta,param,embed");

	// Block Elements - HTML 4.01
	var block = makeMap("address,applet,blockquote,button,center,dd,del,dir,div,dl,dt,fieldset,form,frameset,hr,iframe,ins,isindex,li,map,menu,noframes,noscript,object,ol,p,pre,script,table,tbody,td,tfoot,th,thead,tr,ul");

	// Inline Elements - HTML 4.01
	var inline = makeMap("a,abbr,acronym,applet,b,basefont,bdo,big,br,button,cite,code,del,dfn,em,font,i,iframe,img,input,ins,kbd,label,map,object,q,s,samp,script,select,small,span,strike,strong,sub,sup,textarea,tt,u,var");

	// Elements that you can, intentionally, leave open
	// (and which close themselves)
	var closeSelf = makeMap("colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr");

	// Attributes that have their values filled in disabled="disabled"
	var fillAttrs = makeMap("checked,compact,declare,defer,disabled,ismap,multiple,nohref,noresize,noshade,nowrap,readonly,selected");

	// Special Elements (can contain anything)
	var special = makeMap("script,style");


  viewParser.prototype.htmlParser = function(html, handler) {
    var index, chars, match, stack = [], last = html;
		stack.last = function(){
			return this[ this.length - 1 ];
		};

		while ( html ) {
			chars = true;

			// Make sure we're not in a script or style element
			if ( !stack.last() || !special[ stack.last() ] ) {

				// Comment
				if ( html.indexOf("<!--") == 0 ) {
					index = html.indexOf("-->");

					if ( index >= 0 ) {
						if ( handler.comment )
							handler.comment( html.substring( 4, index ) );
						html = html.substring( index + 3 );
						chars = false;
					}

				// end tag
				} else if ( html.indexOf("</") == 0 ) {
					match = html.match( endTag );
					if ( match ) {
						html = html.substring( match[0].length );
						match[0].replace( endTag, parseEndTag );
						chars = false;
					}

				// start tag
				} else if ( html.indexOf("<") == 0 ) {
					match = html.match( startTag );
					if ( match ) {
						html = html.substring( match[0].length );
						match[0].replace( startTag, parseStartTag );
						chars = false;
					}
				}

				if ( chars ) {
					// change match to look for a tag instead of just < b/c just < could happen anywhere
					// ie: <<a href=emailto:joeblow@gmail.com>joe blow</a>>
					// was: index = html.indexOf("<");
					var m = html.match(/<\s*[^<|$]/);
					index = m ? m.index : -1;
					var text = index < 0 ? html : html.substring( 0, index );
					html = index < 0 ? "" : html.substring( index );

					if ( handler.chars )
						handler.chars( text );
				}

			} else {
				var reg = new RegExp("([\\w\\W]*)<\/" + stack.last() + "[^>]*>");
				html = html.replace(reg, function(all, text){
					text = text.replace(/<!--(.*?)-->/g, "$1")
						.replace(/<!\[CDATA\[(.*?)]]>/g, "$1");

					if ( handler.chars ) {
						handler.chars(text);
					}
					return "";
				});
				parseEndTag( "", stack.last() );
			}
			if ( html == last ) {
				console.error("Parse Error: " + html);
				return;
			}

			last = html;
		}

		// Clean up any remaining tags
		parseEndTag();

		function parseStartTag( tag, tagName, rest, unary ) {
			tagName = tagName.toLowerCase();

			if ( block[ tagName ] ) {
				while ( stack.last() && inline[ stack.last() ] ) {
					parseEndTag( "", stack.last() );
				}
			}

			if ( closeSelf[ tagName ] && stack.last() == tagName ) {
				parseEndTag( "", tagName );
			}

			unary = empty[ tagName ] || !!unary;

			if ( !unary )
				stack.push( tagName );

			if ( handler.start ) {
				var attrs = [];

				rest.replace(attr, function(match, name) {
					var value = arguments[2] ? arguments[2] :
						arguments[3] ? arguments[3] :
						arguments[4] ? arguments[4] :
						fillAttrs[name] ? name : "";

					attrs.push({
						name: name,
						value: value,
						escaped: value.replace(/(^|[^\\])"/g, '$1\\\"') //"
					});
				});
				if ( handler.start )
					handler.start( tagName, attrs, unary );
			}
		}

		function parseEndTag( tag, tagName ) {
			// If no tag name is provided, clean shop
			if ( !tagName )
				var pos = 0;

			// Find the closest opened tag of the same type
			else
				for ( var pos = stack.length - 1; pos >= 0; pos-- )
					if ( stack[ pos ] == tagName )
						break;

			if ( pos >= 0 ) {
				// Close all the open elements, up the stack
				for ( var i = stack.length - 1; i >= pos; i-- )
					if ( handler.end )
						handler.end( stack[ i ] );

				// Remove the open elements from the stack
				stack.length = pos;
			}
		}

  };

	var _templateMap = {};

	viewParser.prototype.getTemplate = function(id) {
		return _templateMap[id];
	};

	viewParser.prototype.getTemplateFromEl = function(el) {
		return this.getTemplate(el.__templateId);
	};

	viewParser.prototype._createEl = function(tag, attrs, unary) {
		var el =  {
			'id': this.generateId(),
			'tag': tag ? tag.toLowerCase() : 'documentfragment',
			'unary': unary || '',
			'children': [],
			'attributes': []
		};
		if (tag === 'textnode') {
			el.text = attrs;
		} else {
			el.attributes = attrs || [];
		}
		this.parseAttributes(el);
		_templateMap[el.id] = el;
		return el;
	};

	viewParser.prototype.parseTemplate = function(html) {
		var id = idReg.test(html) ? html : null;
		if (id) {
			if (this._parsedTemplates[id]) {
				return this._parsedTemplates[id];
			}
			html = document.querySelector(id).innerHTML;
		}

		var frag = this._createEl(),
				currEl = frag,
				path = [];

		this.htmlParser(html, {
			start: function(tag, attrs, unary) {
				var el = this._createEl.apply(this, arguments);
				currEl.children.push(el.id);
				if (!unary) {
					path.push(currEl.id);
					//path.push('children[' + (currEl.children.length - 1) + ']');
					currEl = el;
				}
			}.bind(this),
			end: function(tag) {
				currEl = _templateMap[path.pop()];
			}.bind(this),
			chars: function(text) {
				var a = this.parseText(text);
				for (var i=0; i< a.length; i++) {
					var el = this._createEl('textnode', a[i]);
					currEl.children.push(el.id);
				}
			}.bind(this),
			comment: function() {

			}.bind(this)
		});

		if (id) this._parsedTemplates[id] = frag;

		return frag;
	};

	viewParser.prototype.parseText = function(text) {
		var a = [],
				lastIdx = 0;

		text.replace(curlyCurlyReg, function(match, idx) {
			a.push({
				'name': 'text',
				'value': text.substring(lastIdx,idx)
			});
			var expression = match.replace(curlyReg, ''),
					parseFunc = $parse(expression);

			a.push({
				'name': 'watch',
				'value': expression,
				'parseFunc': parseFunc,
				'paths': this.getPaths(parseFunc.lexer.lex(expression))
			});
			lastIdx = idx + match.length;
		}.bind(this));
		lastIdx < text.length && a.push({
			'name': 'text',
			'value': text.substring(lastIdx, text.length)
		});
		return a;
	};

	viewParser.prototype.getDirectiveTemplate = function(directive, attrs) {
		var template = directive.template;
		if (!template) return;
		if (atReg.test(template)) {
			template = template.replace(atReg, '');
			var templateFound = false;
			for (var i=0; i<attrs.length; i++) {
				if (attrs[i].name === template) {
					template = attrs[i].value;
					templateFound = true;
					break;
				}
			}
			if (!templateFound) {
				console.warn('Can not find reference to a template for attr:', template, ' on directive:', directive.name);
				return;
			}
			// If it's a reference to an actual template, then return it. Otherwise it'll have to be handled in the directive
			// (which is slow).
			return idReg.test(template) ? template : null;
		}

		return template;
	};

	viewParser.prototype.parseAttributes = function(el) {
		var attrs = el.attributes;
		var a = [];
		for (var i=0; i<attrs.length; i++) {
			var attr = attrs[i];
			var directive = this.parseDirective(attr.name);
			var presidence = false;
			if (directive) {
				attr.directive = directive;
				presidence = !!directive.value.presidence;
			} else {
				attr.parsedValue = this.parseText(attr.value);
			}
			presidence ? a.unshift(attr) : a.push(attr);
		}

		for (var i=0; i< a.length; i++) {
			if (a[i].directive) {
				// Do this here instead of parseDirective b/c we don't want to affect the stored directive object, only this
				// instance of the directive
				var template = this.getDirectiveTemplate(a[i].directive.value, attrs);
				template && el.children.push(this.parseTemplate(template).id);
			}
		}
		el.attributes = a;
	};

	viewParser.prototype.parseDirective = function(directiveName) {
		var directive = this.directives[directiveName];
		if (!directive) return;
		var o = {
			'name': 'directive',
			'value': directive,
			'template': null
		};
		if (directive.template) {
			o.template = idReg.test(directive.template) ? document.querySelector(directive.template).innerHTML : directive.template;
		}
		return o;
	};

	viewParser.prototype.getPaths = function(tokens) {
		var keys = [];
		for (var i = 0; i < tokens.length; i++) {
			if (!tokens[i].hasOwnProperty('json')) {
				!isNotWordReg.test(tokens[i].text) && keys.push(tokens[i].text);
			}
		}
		return keys;
	};


})();