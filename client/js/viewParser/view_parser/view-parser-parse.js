var __className = 'viewParserParse';
$require(__className,
[
	'viewParserBase',
	'utils',
	'idGenerator',
	'htmlParser'
],
function(
	ViewParser,
	utils,
	idGenerator,
	htmlParser
) {
  // Regular Expressions for parsing tags and attributes
	var attr = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g,
			curlyCurlyReg = /{{[^}}]+}}/ig,
			curlyReg = /({|})/g,
			idReg = /^\s*\#/,
			templateReg = /^.*\.(html)$/i,
			atReg = /^\s*\@/;

  ViewParser.prototype._createEl = function(tag, attrs, unary) {
		var el =  {
			'id': idGenerator(),
			'tag': tag ? tag.toLowerCase() : 'documentfragment',
			'unary': unary || '',
			'isTemplate': 1,
			'children': [],
			'attributes': [],
			'views': []
		};
		switch(el.tag) {
			case 'textnode':
				/* falls through */
			case 'comment':
				el.text = attrs;
				break;
			default:
				el.attributes = attrs || [];
				break;
		}
		this.parseAttributes(el);
		this.addTemplateToMap(el);
		return el;
	};

	ViewParser.prototype._getTemplateFromString = function(str, callback) {
		var path = templateReg.test(str) ? str : null;
		if (!path) return callback.call(this, str);
		var template = this._parsedTemplates[path];
		template ? callback.call(this, template) : this._fetchTemplate(path, callback);
	};

  ViewParser.prototype.parseTemplate = function(html, callback) {
		this._getTemplateFromString(html, function(template, path) {
			template.isTemplate ? callback(template) : this._parseHtml(template, callback, path);
		});
	};

	ViewParser.prototype._parseHtml = function(html, callback, path) {
		var frag = this._createEl(),
				currEl = frag,
				path = [],
				done = false,
				numFetching = 0;

		var fetchCallback = function() {
			numFetching--;
			if (done && numFetching <= 0) {
				callback(frag, path);
			}
		};

		htmlParser(html, {
			start: function(tag, attrs, unary) {
				var el = this._createEl.apply(this, arguments);
				if (el.fetching) {
					numFetching++;
					el.doneFetching = fetchCallback;
				}
				currEl.children.push(el.id);
				if (!unary) {
					path.push(currEl.id);
					currEl = el;
				}
			}.bind(this),
			end: function(tag) {
				currEl = this.getTemplate(path.pop());
			}.bind(this),
			chars: function(text) {
				var a = this.parseText(text);
				for (var i=0; i< a.length; i++) {
					var el = this._createEl('textnode', a[i]);
					currEl.children.push(el.id);
				}
			}.bind(this),
			comment: function(comment) {
				var el = this._createEl('comment', comment);
				currEl.children.push(el.id);
			}.bind(this)
		});

		if (path) this._parsedTemplates[path] = frag;
		done = true;
		// Add in a fetching number b/c when fetchCallback is called, it will reduce it by one.
		numFetching++;
		fetchCallback();
	};

  ViewParser.prototype.parseText = function(text) {
		var a = [],
				lastIdx = 0;

		text.replace(curlyCurlyReg, function(match, idx) {
			a.push({
				'name': 'text',
				'value': text.substring(lastIdx,idx)
			});
			var expression = match.replace(curlyReg, ''),
					parseFunc = utils.$parse(expression);

			a.push({
				'name': 'watch',
				'value': expression,
				'parseFunc': parseFunc,
				'paths': utils.getPaths(parseFunc.lexer.lex(expression))
			});
			lastIdx = idx + match.length;
		}.bind(this));
		lastIdx < text.length && a.push({
			'name': 'text',
			'value': text.substring(lastIdx, text.length)
		});
		return a;
	};

  ViewParser.prototype.getDirectiveTemplate = function(directive, attrs) {
		var template = directive.template;
		if (!template) return;
		if (atReg.test(template)) {
			template = template.replace(atReg, '');
      template = template || directive.name;
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
			return templateReg.test(template) ? template : null;
		}

		return template;
	};

  ViewParser.prototype.parseAttributes = function(el) {
		var attrs = el.attributes;
		var a = [],
				c = null,
				d = [],
				app = null;
		for (var i=0; i<attrs.length; i++) {
			var attr = attrs[i],
					directive = this.parseDirective(attr.name),
					controller = this.parseController(attr),
					app = this.parseApp(attr);


			if (directive) {
				attr.directive = directive;
				!!directive.value.presidence ? d.unshift(attr) : d.push(attr);
			} else if (controller) {
				// Can only have one controller per element.
				attr.controller = controller;
				c = attr;
			} else if (app) {
				attr.app = app;
				app = attr;
			} else {
				attr.parsedValue = this.parseText(attr.value);
			}
			a.push(attr);
		}

		if (d.length) {
			var idx = el.children.length;
			el.fetching = true;
			this._buildDirectiveTemplates(d, attrs, function (children) {
				children.splice(0, 0, idx, 0);
				Array.prototype.splice.apply(el.children, children);
				el.fetching = false;
				typeof el.doneFetching === 'function' && el.doneFetching.apply(this, el);
			});
		}

		if (c) {
			d.unshift(c);
		}
		if (app) {
			d.unshift(app);
		}

		el.attributes = a;
		el.views = d;
	};

	ViewParser.prototype._buildDirectiveTemplates = function(directiveArray, attrs, callback) {
		var a = [];
		for (var i=0; i< directiveArray.length; i++) {
			// Do this here instead of parseDirective b/c we don't want to affect the stored directive object, only this
			// instance of the directive
			(function(idx) {
				var dir = directiveArray[idx].directive.value;
				this._buildDirectiveTemplate(dir, attrs, function (children) {
					a[idx] = children;
					if (a.length === directiveArray.length) {
						callback.call(this, Array.prototype.concat.apply([], a));
					}
				});
			}.bind(this))(i);
		}
	};

	ViewParser.prototype._buildDirectiveTemplate = function(directive, attrs, callback) {
		var template = this.getDirectiveTemplate(directive, attrs);
		if (!template) return callback.call(this, []);
		this.parseTemplate(template, function(parsedTemplate) {
			var a = [];
			if (parsedTemplate.tag === 'documentfragment') {
				for (var i=0; i<parsedTemplate.children.length; i++) {
					a.push(parsedTemplate.children[i]);
				}
			} else {
				a.push(parsedTemplate.id);
			}
			callback.call(this, a);
		});
	};

	ViewParser.prototype.parseApp = function(attr) {
		if (attr.name.toLowerCase() !== 'dc-app') return;
		var app = this.apps[attr.value];
		if (!app) {
			console.warn('could not find app:', attr.value,'Did you forget to add it?');
			return
		}
		return {
			'name': 'app',
			'value': app
		}
	};


  ViewParser.prototype.parseController = function(attr) {
		if (attr.name.toLowerCase() !== 'dc-controller') return;
		var controller = this.controllers[attr.value];
		if (!controller) {
			console.warn('could not find controller:', attr.value,'Did you forget to add it?');
			return
		}
		return {
			'name': 'controller',
			'value': controller
		}
	};

  ViewParser.prototype.parseDirective = function(directiveName) {
		var directive = this.directives[directiveName];
		if (!directive) return;
		var o = {
			'name': 'directive',
			'value': directive,
			'template': directive.template
		};
		return o;
	};

  return ViewParser;
});