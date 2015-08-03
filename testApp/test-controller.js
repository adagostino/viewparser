var subClass = 'controller';
(function(subClass) {
  var controllerName = 'test-controller';

  var controller = function(){};

  var numObjs = 100;
  controller.prototype.init = function(attrs) {
    this.testObjs = [];
    this.initConstants();

    this.$watch(['numCols', 'thumbWidth', 'thumbHeight', 'gutter'], function(newVals, oldVals) {
      if (oldVals.hasOwnProperty(1) || oldVals.hasOwnProperty(2)){
        var thumbWidth = parseInt(this.thumbWidth);
        this.lastThumbWidth = thumbWidth || this.lastThumbWidth;
        var thumbHeight = parseInt(this.thumbHeight);
        this.lastThumbHeight = thumbHeight || this.lastThumbHieght;
        this._updateImages();
      }
      var numCols = parseInt(this.numCols);
      this.lastNumCols = numCols || this.lastNumCols;
      var gutter = parseInt(this.gutter);
      this.lastGutter = gutter || this.lastGutter;
      this.setCols();
    });

    for (var i=0; i<numObjs; i++) {
      this.testObjs.push(this.createObj(i));
    }

    $(window).on('resize', this.setCols.bind(this));

    this.$timeout(function(){
      this.setCols();
      this.setCols();
    });
    window.scope = this;
  };

  controller.prototype.initConstants = function() {
    this.numCols = 3;
    this.thumbWidth = 320;
    this.thumbHeight = 180;
    this.gutter = 24;
    this.selector = '.item';
    this.cacheBreaker = false; //new Date().getTime();
    this.lastNumCols = this.numCols;
    this.lastThumbWidth = this.thumbWidth;
    this.lastThumbHieght = this.thumbHeight;
    this.lastGutter = this.gutter;
  };

  controller.prototype._getImageSrc = function(idx) {
    var w = typeof this.thumbWidth === 'number' ? this.thumbWidth : this.lastThumbWidth,
        h = typeof this.thumbHeight === 'number' ? this.thumbHeight : this.lastThumbHeight;
    return 'http://placekitten.com/g/' + w + '/' + h + (this.cacheBreaker ? ("?" + this.cacheBreaker + "_" + idx) : "");
  };

  controller.prototype._updateImages = function() {
    for (var i=0; i<this.testObjs.length; i++) {
      this.testObjs[i].src = this._getImageSrc(i);
    }
  };

  controller.prototype.createObj = function(idx) {
    return {
      'src': this._getImageSrc(idx),
      'text': 'First Text Bruh',
      'text1': 'Second Text Bruh',
      'text2': 'Third Text Bruh',
      'text3': '4th Text Bruh',
      'text4': 'fimff Text Bruh',
      'color': 'red',
      'fontWeight': 'bold',
      'marginLeft': '8px',
      'marginTop': '8px',
      'inputText': 'Radical Rat',
      'party': function(idx, color) {
        console.log(idx, color);
      }
    }
  };

  controller.prototype._addStyleSheet = function() {
    if (this.styleSheet) return;
    var el = document.createElement('style');
    document.head.appendChild(el);
    this.stylesheet = el.sheet;
  };

  controller.prototype._setStyleRule = function(selector, ruleObj) {
    if (!this.stylesheet) this._addStyleSheet();
    var idx = this.stylesheet.cssRules.length,
        rule = '';

    // turn rule object into string
    for (var key in ruleObj) {
      var val = ruleObj[key];
      rule += key + ':' + val + ';\n';
    }
    if (this.stylesheet.addRule) {
      this.stylesheet.addRule(selector, rule, idx);
    } else if (_mySheet.insertRule) {
      this.stylesheet.insertRule(selector + ' { ' + rule + ' }', idx);
    }
    return idx;
  };

  controller.prototype.setCols = function(){
    try {
      this._setCols();
    } catch(err) {};
  };

  controller.prototype._setCols = function() {
    var numCols = parseInt(this.numCols);
    numCols = numCols || this.lastNumCols;
    var margin = parseInt(this.gutter);
    margin = margin || this.lastGutter;

    var px = true;

    var offset = window.innerWidth - document.documentElement.clientWidth;
    var w = px ? this.el.getBoundingClientRect().width : 100,
        unit = px ? 'px' : '%';

    this._clearSheet();

    var minWidth = numCols*this.thumbWidth + (numCols - 1)*margin,
        marginRight = w*(margin / minWidth),
        width = w*(1/numCols - ((numCols - 1)/numCols) * margin / minWidth),
        paddingBottom = 100*(this.thumbHeight / this.thumbWidth) + '%';

    if (px) {
      marginRight = Math.floor(marginRight);
      width = Math.floor(width);
    }

    marginRight+=unit;
    width+=unit;

    var nth = this.selector + ':nth-child(' + numCols + 'n)',
        ic = this.selector + '-img-container';
    this._setStyleRule(this.selector, {
      'width': width,
      'margin-right': marginRight,
      'margin-bottom': marginRight
    });
    this._setStyleRule(nth, {
      'margin-right': 0
    });
    this._setStyleRule(ic, {
      'padding-bottom': paddingBottom
    });

  };

  controller.prototype._clearSheet = function() {
    if (!this.stylesheet) this._addStyleSheet();
    while (this.stylesheet.cssRules.length) {
      var idx = this.stylesheet.cssRules.length - 1;
      this.stylesheet.deleteRule(idx);
    }
  };

  $app.addController(subClass, {
    'name': controllerName,
    'controller': controller
  });

})(subClass);