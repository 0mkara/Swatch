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
    basicFactory.getCredentials = function(userType) {
        return $http.get('/api/getCredentials', { userType: userType });
    }
    return basicFactory;
})
