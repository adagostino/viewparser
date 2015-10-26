var __className = 'directive';
$require(__className, ['extend', 'scopeTree', 'view'], function(extend, ScopeTree, View) {
  var Directive = function(){};

  Directive.prototype.__templateType = 'directive';

  Directive.prototype.__beforeInit = function(attrs, el, domTree, isolateScope) {
    // Make sure a scopeTree is passed in.
    var scopeTreeObj = domTree ? domTree.scopeTree : null;
    scopeTreeObj = scopeTreeObj || new ScopeTree(this);

    // Check if it's an isolate scope.
    if (isolateScope) {
      this.__$isolateScope_ = true;
      // Create an isolate scope for it.
      scopeTreeObj = scopeTreeObj.append({});
    }
    // Now call the super so that the listener sets the scope etc.
    this._super(attrs, el, domTree, scopeTreeObj);

    // Now parse the isolate scope if it's there.
    this.parseIsolateScope(isolateScope);
  };

  var isolateReg = /^[@=&]/;
  var _reserved = {
    '$childScopes': 1,
    '$nextScope': 1,
    '$parentScope': 1,
    '$previousScope': 1,
    '__$scopeId': 1,
    '__id': 1
  };

  Directive.prototype.parseIsolateScope = function($isolateScope) {
    // $isolateScope is the $scope keyword of the directive, $scope is the instantiated directive.
    // get paths of the parentScope from the element attributes and set up binding
    // default - one-way binding from parent to child
    // "=" - 2-way binding from child to parent and vise versa
    // "@" - no binding, just the initial value
    // "&" - means it's a function to call
    $isolateScope = $isolateScope || {};
    var reg = isolateReg,
        observers = [],
        $scope = this.$scope,
        el = this.el;

    var self = this; // could be $scope.
    for (var key in $isolateScope) {
      (function (key) {
        if (_reserved[key]) return;
        var match = $isolateScope[key].match(reg),
            symbol = match ? match[0] : "",
            attr = symbol ? $isolateScope[key].slice(1) : $isolateScope[key],
            str = el.getAttribute(attr),
            value = Path.get(str).getValueFrom($scope.$parentScope);
        switch (symbol) {
          case "@":
            // Parse out the value from the str.
            //console.log(this.$parse(str, $scope.$parentScope));
            value = this.$parse(str, $scope.$parentScope);
            break;
          case "&":
            if (typeof value === "function") {
              var lastIndex = str.lastIndexOf('parentScope'),
                parentStr = lastIndex > -1 ? str.substr(0, lastIndex + 'parentScope'.length) : '',
                $parentScope = parentStr ? Path.get(parentStr).getValueFrom($scope.$parentScope) : $scope.$parentScope;

              var fn = value;
              // Bind the function to the parent scope so it executes in the correct context.
              value = function () {
                // Now create access to the directive.
                var tmp = this.$caller;
                this.$caller = self;
                var ret = fn.apply(this, arguments);
                this.$caller = tmp;
                return ret;
              }.bind($parentScope);
            }
            break;
          case "=":
            // set a watch on the child and change the parent when the child changes
            var observer = new PathObserver(this, key);
            var callback = function (n, o) {
              Path.get(str).setValueFrom($scope.$parentScope, n);
            };
            observer.open(callback);
            observers.push(observer);
            // Fall through and also watch the parent.
          default:
            // set a watch on the parent and change the child when the parent changes
            var observer = new PathObserver($scope.$parentScope, str);
            var callback = function (n, o) {
              Path.get(key).setValueFrom(self, n);
            };
            observer.open(callback);
            observers.push(observer);
            break;
        }
        Path.get(key).setValueFrom(self, value);
      }.bind(this))(key);
    }
    this.addObserver(observers);
  };

  return extend(View, Directive);
});