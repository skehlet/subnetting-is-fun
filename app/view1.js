'use strict';

angular.module('myApp')
.controller('View1Ctrl', function($scope, $location) {

    var DottedDecimalIp = (function() {
        var validIpRegex = /^\d+\.\d+\.\d+\.\d+$/;
        return {
            fromString: function(ipString) {
                if (validIpRegex.test(ipString)) {
                    var octets = ipString.split('.');
                    return DottedDecimalIp.new(octets[0], octets[1], octets[2], octets[3]);
                } else {
                    return null;
                }
            },
            new: function(oct1, oct2, oct3, oct4) {
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
                        return DottedDecimalIp.new(
                            oct1 & netmask.oct1,
                            oct2 & netmask.oct2,
                            oct3 & netmask.oct3,
                            oct4 & netmask.oct4
                        );
                    },
                    getBroadcast: function(netmask) {
                        var network = this.getNetwork(netmask);
                        return DottedDecimalIp.new(
                            network.oct1 | (~netmask.oct1 & 0xff),
                            network.oct2 | (~netmask.oct2 & 0xff),
                            network.oct3 | (~netmask.oct3 & 0xff),
                            network.oct4 | (~netmask.oct4 & 0xff)
                        );
                    },
                    equals: function(other) {
                        return this.toDottedDecimalString() == other.toDottedDecimalString();
                    }
                };
            }
        };
    })();

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

        return DottedDecimalIp.new(octs[0], octs[1], octs[2], octs[3]);
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
            var ip = DottedDecimalIp.new(oct1, oct2, oct3, oct4);
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

    function newProblem() {
        var netmask = generateMask();
        var ip = generateIp(netmask);
        $scope.current = {
            ip: ip,
            netmask: netmask,
            network: ip.getNetwork(netmask),
            broadcast: ip.getBroadcast(netmask)
        };
        startTime = (new Date()).getTime();
    }

    function populatePreviousFromQueryParams() {
        var queryParams = $location.search();
        $scope.previous.networkAnswer = queryParams.networkAnswer;
        $scope.previous.broadcastAnswer = queryParams.broadcastAnswer;
        if (queryParams.ip && queryParams.netmask) {
            $scope.previous.ip = DottedDecimalIp.fromString(queryParams.ip);
            $scope.previous.netmask = DottedDecimalIp.fromString(queryParams.netmask);
            if ($scope.previous.ip && $scope.previous.netmask) {
                $scope.previous.network = $scope.previous.ip.getNetwork($scope.previous.netmask);
                $scope.previous.broadcast = $scope.previous.ip.getBroadcast($scope.previous.netmask);
                scorePrevious();
            }
        }
    }

    function populateQueryParamsFromPrevious() {
        $location.search({
            ip: $scope.previous.ip.toDottedDecimalString(),
            netmask: $scope.previous.netmask.toDottedDecimalString(),
            networkAnswer: $scope.previous.networkAnswer,
            broadcastAnswer: $scope.previous.broadcastAnswer
        });
    }

    function scorePrevious() {
        var networkAnswerIp = DottedDecimalIp.fromString($scope.previous.networkAnswer);
        if (networkAnswerIp) {
            $scope.previous.networkAnswerIsCorrect = (networkAnswerIp.equals($scope.previous.network));
        }
        var broadcastAnswerIp = DottedDecimalIp.fromString($scope.previous.broadcastAnswer);
        if (broadcastAnswerIp) {
            $scope.previous.broadcastAnswerIsCorrect = (broadcastAnswerIp.equals($scope.previous.broadcast));
        }
        if (startTime) {
            var msTaken = (new Date()).getTime() - startTime;
            $scope.previous.secondsTaken = Math.round(msTaken/1000 * 10) / 10;
        }
    }

    $scope.current = $scope.previous = {};
    var startTime = null;
    populatePreviousFromQueryParams();
    newProblem();

    $scope.submit = function() {
        $scope.previous = $scope.current;
        scorePrevious();
        populateQueryParamsFromPrevious();
        newProblem();
        $('#networkAnswer').focus();
    };

    $scope.skip = function() {
        newProblem();
    };
})
.config(function($locationProvider) {
  $locationProvider.html5Mode(true).hashPrefix('!');
});

