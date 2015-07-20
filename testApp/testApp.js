var name = 'testApp';
(function(global, name){
  global = global || window;

  var testApp = function(){};

  testApp.prototype.init = function(framework) {
    this.testObjs =[];
    var numObjs = 1;
    var start = new Date().getTime();
    for (var i=0; i<numObjs; i++) {
      var o ={
        'text': 'Sup Bruh ' + i,
        'text2': 'time to party ' + i,
        'text3': 'who likes to party? ' + i,
        'text4': 'I like to party ' + i,
        'color': 'red',
        'fontWeight': 'bold',
        'index': i,
        'hide': false,
        'inputText': 'Radical rat',
        'party': function() {
          console.log('party', arguments);
        }
      };

      this.testObjs.push(o);
      var template = this.viewParser.compile('#test-template', o);
      document.querySelector('body').appendChild(template);

    }
    console.log(new Date().getTime() - start);

  };

  global.$app.addApp(name, testApp);

})(undefined, name);