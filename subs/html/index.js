#!/usr/bin/env node

/**
 * Generates web pages.
 * Shawn Rapp - 11/25/2014
 */
var ejs = require("ejs");
var plsub = require("party-line-sub");
var fs = require("fs");
var template_object = {};

plsub.addListeningContext("web.html");
plsub.on("request", sendPage);

process.on('SIGINT', function () {
    var packet = {
        type:"close",
        exit_level: 0,
    };
    plsub.send(packet);

    process.kill('SIGINT');
});

process.chdir(__dirname);

function sendPage(request_packet) {
    var response_packet = {
        type: "response",
        response_type: "html",
        context: request_packet.from,
        request_id: request_packet.request_id,
        response_code: 200,
        header: {"Content-Type":"text/html"},
        content: ""
    };
    if (request_packet.request == "/")
        request_packet.request = "/default";
        
    var template_object = {
        title: "Hello"
    }
    var file_name = __dirname+"/content/"+request_packet.host_name+request_packet.request+".ejs";
    fs.readFile(file_name, function(err, data) {
       if (!err) {
           var options = {
             filename: __dirname+"/cache/"+request_packet.host_name+request_packet.request
           };
           response_packet.content = ejs.render(data.toString(), template_object, options);
           plsub.send(response_packet);
       } else {
            file_name = __dirname+"/content/default"+request_packet.request+".ejs";
            fs.readFile(file_name, function(err, data){
                if (!err) {
                    var options = {
                     filename: __dirname+"/cache/default"+request_packet.request
                    };
                    response_packet.content = ejs.render(data.toString(), template_object, options);
                    plsub.send(response_packet);
                } else {
                    var noroute_packet = {
                        type: "noResponse",
                        context: request_packet.from,
                        request_id: request_packet.request_id
                    };
                    plsub.send(noroute_packet);
                }
            });
       }
    });
}

function sendFragment() {}
