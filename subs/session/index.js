#!/usr/bin/env node

/**
 * Manages session controls.
 * This provide a means of storing and retrieving low security small data.
 * Shawn Rapp - 4/13/2015
 */
var plsub = require("party-line-sub")
    , MongoClient = require('mongodb').MongoClient
    , assert = require('assert');

var MONGO_URL = 'mongodb://localhost:27017/floe';

plsub.addListeningContext("web.api");
plsub.addListeningContext("api");

plsub.on("request", filterRequests);

/**
 * Sends a packet to reject the request.
 */
function sendNoReponsePacket(request_packet) {
    var noroute_packet = {
        type: "noResponse",
        context: request_packet.from,
        request_id: request_packet.request_id
    };
    plsub.send(noroute_packet);
}

function filterRequests(request_packet) {
    executeRequests(request_packet);
}

function executeRequests(request_packet) {
}

MongoClient.connect(MONGO_URL, function(err, db){
    assert.equal(null, err);
    console.log("");
    
});