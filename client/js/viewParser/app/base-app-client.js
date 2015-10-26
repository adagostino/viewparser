var __className = 'baseAppClient';
$require(__className,
[
  'baseApp',
  'extend'
], function(
    BaseApp,
    extend
) {

  var BaseAppClient = function(){};

  BaseAppClient.prototype.init = function() {
    this._super();
    this.setBaseUrl(window.location.origin + '/');
  };

  BaseAppClient.prototype.start = function() {
    if (this._started) return;
    // Do the parsing here.
    // Not right -- think about dc-repeat and other directives. Probably need to fetch the index.html file and then
    // regex it out for <app></app>.
    this.$compile(this.el.outerHTML, null, function (child) {
      this.el.parentNode.replaceChild(child, this.el);
      this._started = true;
      this.history.loadUrl();
    }, false, true);
  };

  return extend(BaseApp, BaseAppClient);
});