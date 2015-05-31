var floeService = app.module("floeService", function($http, $q) {
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
            })
            .error(function(failResponse) {
                deferred.reject(failResponse);
            });
        
        return deferred.promise;
    }
    
    function getSessionInfo(varName) {
        var postData = {
            request_type: 'getVar',
            var_name: varName
        };
        
        return callApi('/api/session', 'POST', postData);
    }

    function setSessionInfo(varName, varValue) {
        var postData = {
            request_type: 'setVar',
            var_name: varName,
            var_value: varValue
        };
        
        return callApi('/api/session', 'POST', postData);
    }

    return {
        getSessionInfo: getSessionInfo,
        setSessionInfo: setSessionInfo
    };
});