module.exports = function(API, universal_cache) {
    'use strict';

    function stateInit() {}

    function stateRun(request_packet) {
        var decision = {
            'default': function() {
                API.logger.error('Uknown API call', request_packet);
                API.sendNoReponsePacket(request_packet);
            },
            'getVar': function() {
                var session_request = {
                    context: 'api',
                    type: 'session-retrieve',
                    session_id: request_packet.session_id
                };

                API.requestService(session_request, function(session_response) {
                    if (!!session_response) {
                        var out_str = {
                            var_name: request_packet.post_vars.var_name,
                            "value": session_response.session_object[request_packet.post_vars.var_name]
                        };
                        
                        var outpacket = {
                            type: 'response',
                            response_type: 'html',
                            context: request_packet.from,
                            request_id: request_packet.request_id,
                            response_code: 200,
                            header: {
                                'Content-Type': 'application/json'
                            },
                            content: JSON.stringify(out_str)
                        };
                        API.send(outpacket);
                    } else {
                        API.sendNoReponsePacket(request_packet);
                    }
                });
            }
        };
        (decision[request_packet.post_vars.request_type] || decision['default'])();
    }

    stateInit();

    return {
        init: stateInit,
        run: stateRun
    };
};
