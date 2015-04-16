#!/usr/bin/env node

/**
 * Generates web pages.
 * Shawn Rapp - 11/25/2014
 */
var plsub = require("party-line-sub");
var fs = require("fs");
var universal_cache = {};

plsub.addListeningContext("web.api");
plsub.addListeningContext("api");

plsub.on("request", filterAPIRequests);

function sendNoReponsePacket(request_packet) {
    var noroute_packet = {
        type: "noResponse",
        context: request_packet.from,
        request_id: request_packet.request_id
    };
    plsub.send(noroute_packet);
}

function filterAPIRequests(request_packet) {
    var reg_pat = /^\/api\/(.*)/;
    var request_matches = request_packet.request.match(reg_pat);
    if (request_matches.length > 0) {
        var path = require("path");
        var api_request = path.join("extensions", request_packet.request);
        fs.exists(api_request, function(exists) {
            if (exists) {
                sendAPI(api_request, request_packet);
            }
            else {
                sendNoReponsePacket(request_packet);
            }
        });
    }
    else {
        sendNoReponsePacket(request_packet);
    }
}

function sendAPI(api_request, request_packet) {
    var mod = require(api_request);
    mod.init(universal_cache, request_packet, function(){
       mod.run();
    });
}