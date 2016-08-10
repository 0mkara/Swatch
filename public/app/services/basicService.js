angular.module('basicService', [])

.factory('Basics', function($http) {
    var basicFactory = {};

    basicFactory.trace = function(text) {
      // This function is used for logging.
      if (text[text.length - 1] === '\n') {
        text = text.substring(0, text.length - 1);
      }
      if (window.performance) {
        var now = (window.performance.now() / 1000).toFixed(3);
        console.log(now + ': ' + text);
      } else {
        console.log(text);
      }
    }
    return basicFactory;
})
.factory('socketio', function($rootScope) {
    var socket = io.connect();
    return {
        on: function(eventName, callback) {
          socket.on(eventName, function() {
              var args = arguments;
              $rootScope.$apply(function(){
                  callback.apply(socket, args);
              });
          });
        },
        emit: function(eventName, data, callback) {
          socket.emit(eventName, data, function() {
              var args = arguments;
              $rootScope.apply(function(){
                if(callback) {
                  callbac.apply(socket, args);
                }
              });
          });
        }
    };
});
