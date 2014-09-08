// http://stackoverflow.com/a/20865048/296829
angular.module('myApp.autoFocus.autoFocus-directive', [])
.directive('autoFocus', ['$timeout', function($timeout) {
    return {
        restrict: 'AC',
        link: function(scope, element) {
            $timeout(function(){
                element[0].focus();
            });
        }
    };
}]);
