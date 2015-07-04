#!/usr/bin/env node

'use strict';
/**
 * Static Content Handler
 * Shawn Rapp - 11/25/2014
 */

//var self_hostname = "twistedcommunity-2-badopcode.c9.io";
var self_hostname = "localhost";
var self_port = 4321;

var fs = require("fs");
var plsub = require('party-line-sub')('static');
var union = require('union');
var flatiron = require('flatiron');
var ecstatic = require('ecstatic');


plsub.addListeningContext("web.html");

process.on('SIGINT', function() {
    var packet = {
        type: "close",
        exit_level: 0,
    };
    console.log(JSON.stringify(packet));
    process.kill('SIGINT');
});


plsub.on("request", function(packet) {
    //first try to find a file that matches the host_name
    var file_name = __dirname + "/content/" + packet.host_name + packet.request;
    fs.open(file_name, "r", function(err, fd) {
        if (!err && fs.statSync(file_name).isFile()) {
            //found a matching file now feed it to the client
            fs.stat(file_name, function(err, stats) {
                //send file
                var route_packet = {
                    type: "response",
                    response_type: "redirect",
                    context: packet.from,
                    request_id: packet.request_id,
                    hostname: self_hostname,
                    port: self_port,
                    path: "/content/" + packet.host_name + packet.request
                };
                plsub.send(route_packet);
            });
        }
        else { //error happpened lets search the default path
            file_name = __dirname + "/content/default" + packet.request;
            fs.open(file_name, "r", function(err, fd) {
                if (!err && fs.statSync(file_name).isFile()) {
                    //found a match in the default directory
                    fs.stat(file_name, function(err, stats) {
                        //send file
                        var route_packet = {
                            type: "response",
                            response_type: "redirect",
                            context: packet.from,
                            request_id: packet.request_id,
                            hostname: self_hostname,
                            port: self_port,
                            path: "/content/default" + packet.request
                        };
                        plsub.send(route_packet);
                    });
                }
                else {
                    //no content route matching.
                    var noroute_packet = {
                        type: "noResponse",
                        context: packet.from,
                        request_id: packet.request_id
                    };
                    plsub.send(noroute_packet);
                }
            });
        }
    });
});

var app = new flatiron.App();
app.use(flatiron.plugins.http);

app.http.before = [
    ecstatic({
        root: __dirname + '/content',
        baseDir: "content"
    })
];

app.start(self_port);

//console.log('Listening on :'+self_port);