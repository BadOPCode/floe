module.exports = function() {
    'use strict';
    var uni_cache;
    var req_packet;

    function stateInit(universal_cache, request_packet, cb_loaded) {
        uni_cache = universal_cache;
        req_packet = request_packet;
        
        cb_loaded();
    }
    
    function stateRun() {
    }

    return {
      init: stateInit,
      run: stateRun
    };
};
