'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

.directive('stevek', function() {
  var INTEGER_REGEXP = /^\-?\d+$/;
  console.log('stevek directive initialized');
  return {
    require: 'ngModel',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.push(function(viewValue) {
        // if (INTEGER_REGEXP.test(viewValue)) {
        //   // it is valid
        //   ctrl.$setValidity('integer', true);
        //   return viewValue;
        // } else {
        //   // it is invalid, return undefined (no model update)
        //   ctrl.$setValidity('integer', false);
        //   return undefined;
        // }
        ctrl.$setValidity('stevek', false);
	    console.log('stevek directive fired');
        return undefined;
      });
    }
  };
})

.controller('View1Ctrl', ['$scope', function($scope) {

	function DottedDecimalIp(oct1, oct2, oct3, oct4) {
		var octs = [oct1, oct2, oct3, oct4];
		return {
			oct1: oct1,
			oct2: oct2,
			oct3: oct3,
			oct4: oct4,
			toDottedDecimalString: function() {
				return octs.join('.');
			},
			getNetwork: function(netmask) {
        		return DottedDecimalIp(
	        		oct1 & netmask.oct1,
	        		oct2 & netmask.oct2,
	        		oct3 & netmask.oct3,
	        		oct4 & netmask.oct4
    			);
    		},
    		getBroadcast: function(netmask) {
        		var network = this.getNetwork(netmask);
        		return DottedDecimalIp(
        			network.oct1 | (~netmask.oct1 & 0xff),
        			network.oct2 | (~netmask.oct2 & 0xff),
        			network.oct3 | (~netmask.oct3 & 0xff),
        			network.oct4 | (~netmask.oct4 & 0xff)
    			);
    		}
		};
	}

	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
	// Returns a random integer between min (included) and max (excluded)
	// Using Math.round() will give you a non-uniform distribution!
	function getRandomInt(min, max) {
	  return Math.floor(Math.random() * (max - min)) + min;
	}

	// Generate a "sane" subnet mask:
	// - not: 0.0.0.0, 128.0.0.0, 255.255.255.255, 255.255.255.254
	function generateMask() {
	    var ct = 10; // infinite loop prevention :-)
	    while (ct-- > 0) {
	    	var octs = [255, 255, 255, 255];
	    	var which = getRandomInt(0, 4);

    		octs[which] = 256 - Math.pow(2, getRandomInt(0, 9));
    		for (var i = which + 1; i < 4; i++) {
    			octs[i] = 0;
    		}

	        var netmaskString = octs.join('.');
	        // sanity check
	        if (netmaskString != '0.0.0.0' &&
	            netmaskString != '128.0.0.0' &&
	            netmaskString != '255.255.255.255' &&
	            netmaskString != '255.255.255.254') {
	            // good netmask
	            break;
	        }
	    }

	    return DottedDecimalIp(octs[0], octs[1], octs[2], octs[3]);
	}

	// Generate a "sane" IP:
	// - Class A, B, or C (i.e. first octet < 224)
	// - resulting network address is not 0.0.0.0
	// - resulting broadcast address is not 255.255.255.255
	// - IP address is not the same as the network or broadcast address
	function generateIp(netmask) {
	    var ct = 10; // infinite loop prevention :-)
	    while (ct-- > 0) {
	        var oct1 = getRandomInt(0, 256);
	        var oct2 = getRandomInt(0, 256);
	        var oct3 = getRandomInt(0, 256);
	        var oct4 = getRandomInt(0, 256);
	        var ip = DottedDecimalIp(oct1, oct2, oct3, oct4);

	        // sanity check
	        // debugger;
	        var network = ip.getNetwork(netmask);
	        var broadcast = ip.getBroadcast(netmask);
	        var ipString = ip.toDottedDecimalString();
	        var networkString = network.toDottedDecimalString();
	        var broadcastString = broadcast.toDottedDecimalString();
	        if (oct1 < 224 &&
	            networkString != '0.0.0.0' &&
	            broadcastString != '255.255.255.255' &&
	            ipString != networkString &&
	            ipString != broadcastString) {
	            // good IP
	            break;
	        }
	    }
	    return ip;
	}

	var netmask;
	var ip;
	var network;
	var broadcast;

	function newProblem() {
		netmask = generateMask();
		ip = generateIp(netmask);
		network = ip.getNetwork(netmask);
		broadcast = ip.getBroadcast(netmask);
		$scope.netmask = netmask.toDottedDecimalString();
		$scope.ip = ip.toDottedDecimalString();
		// $scope.networkAnswer = ip.getNetwork(netmask).toDottedDecimalString();
		// $scope.broadcastAnswer = ip.getBroadcast(netmask).toDottedDecimalString();
	}

	newProblem();

	$scope.submit = function() {
		$scope.networkAnswerIsCorrect = ($scope.networkAnswer == network.toDottedDecimalString());
		$scope.broadcastAnswerIsCorrect = ($scope.broadcastAnswer == broadcast.toDottedDecimalString());
	};

	$scope.skip = function() {
		console.log('skipping');
	};
}]);