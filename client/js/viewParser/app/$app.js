var __className = '$app';
$require(__className, ['utils', 'baseAppClient', 'baseAppServer'], function (utils, BaseAppClient, BaseAppServer) {

  var $app;

  if (utils.isClient()) {
    $app = new BaseAppClient({}, document.getElementsByTagName('app')[0]);
    document.addEventListener("DOMContentLoaded", function () {
      $app.start();
      Platform.performMicrotaskCheckpoint();
    });
  } else {
    $app = new BaseAppServer();
  }

  this[__className] = $app;
  return $app;
});