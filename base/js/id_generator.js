$require('idGenerator', function(){
  var _idCt = 0;
  return function() {
    return _idCt++;
  }
});