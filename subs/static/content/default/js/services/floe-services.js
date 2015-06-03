angular.module('floeApp').factory("floeServices", function($http, $q) {
    function callApi(location, method, data) {
        var deferred = $q.defer();
        var request = {
            method: method,
            url: location,
            data: data
        };
        
        $http(request)
            .success(function(successResponse) {
                deferred.resolve(successResponse);
                console.log('win');
            })
            .error(function(failResponse) {
                deferred.reject(failResponse);
                console.log('lose');
            });
        
        return deferred.promise;
    }
    
    var getSessionInfo = function(varName) {
        console.log('getSessionInfo');
        var postData = {
            request_type: 'getVar',
            var_name: varName
        };
        
        return callApi('/api/session', 'POST', postData);
    };

    var setSessionInfo = function(varName, varValue) {
        console.log('setSessionInfo');
        var postData = {
            request_type: 'setVar',
            var_name: varName,
            var_value: varValue
        };
        
        return callApi('/api/session', 'POST', postData);
    };
    
    console.log('got called');
    
    return {
        getSessionInfo: getSessionInfo,
        setSessionInfo: setSessionInfo
    };
});

