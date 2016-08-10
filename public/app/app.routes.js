angular.module('appRoutes', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {

    $routeProvider

        .when('/room/:roomID', {
            templateUrl: 'app/views/pages/guest.html',
            controller: 'MainController',
            controllerAs: 'main'
        })
        .when('/', {
            templateUrl: 'app/views/pages/host.html',
            controller: 'MainController',
            controllerAs: 'main'
        })
    $locationProvider.html5Mode(true);
});
