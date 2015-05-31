module.exports = (function() {
    'use strict';

    function stateInit(universal_cache, request_packet, cb_loaded) {
        
        cb_loaded();
    };
    
    function stateRun() {
    };

    return {
      init: stateInit,
      run: stateRun
    };
});
