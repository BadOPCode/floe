#!/usr/bin/env node

/**
 * Exposes front end API.
 * Shawn Rapp - 11/25/2014
 */
function ApiSubSystem() {
    var plsub = require('party-line-sub')('API');
    var universal_cache = {};
    
    /* extract what is needed out of PLSub but don't pass the entire object.
      Ideally every function in API module would be a derivative internal function
      like sendNoResponsePacket. */
    var API = {
        sendNoReponsePacket: sendNoReponsePacket,
        logger: plsub.logger,
        send: plsub.send,
        requestService: plsub.requestService
    };
    
    plsub.addListeningContext('web.api');
    plsub.addListeningContext('api');
    
    plsub.on('request', filterAPIRequests);
    
    function sendNoReponsePacket(request_packet) {
        var noroute_packet = {
            type: 'noResponse',
            context: request_packet.from,
            request_id: request_packet.request_id
        };
        plsub.send(noroute_packet);
    }
    
    function filterAPIRequests(request_packet) {
        var reg_pat = /^\/api\/(.*)/;
        var request_matches = request_packet.request.match(reg_pat);
        if (request_matches.length > 0) {
            var path = require('path');
            var api_request = path.join('extensions', request_matches[1]);
            sendAPI(api_request, request_packet);
        }
        else {
            sendNoReponsePacket(request_packet);
        }
    }
    
    function sendAPI(api_request, request_packet) {
        try {
            plsub.logger.info('attempted API call.', api_request);
            var mod = require('./' + api_request)(API, universal_cache);
            mod.run(request_packet);
        }
        catch (e) {
            plsub.logger.error('API ERROR', e);
            sendNoReponsePacket(request_packet);
            return;
        }
    }
}

ApiSubSystem();