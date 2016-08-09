angular.module('appRoutes', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {

    $routeProvider

        .when('/', {
            templateUrl: 'app/views/pages/guest.html',
            controller: 'MainController',
            controllerAs: 'main'
        })
        .when('/qfaAz8Pav8bPG62vbUYcsh8rJzf4EqhA', {
            templateUrl: 'app/views/pages/host.html',
            controller: 'MainController',
            controllerAs: 'main'
        })
    $locationProvider.html5Mode(true);
});
