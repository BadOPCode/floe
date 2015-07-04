#!/usr/bin/env node
'use strict';
/**
 * Less Sub
 * Shawn Rapp - 2/18/2015
 */
 
var plsub = require('party-line-sub')('less');
var qc = require('quick-compare');
var fs = require("fs");
var rs = require("run-spout");
//var union = require('union');
var flatiron = require('flatiron');
var ecstatic = require('ecstatic');

var config = {};

//sync less files from bootstrap node module to the source path.
var syncBootstrap = function() {
    qc.directoryCompare(__dirname+"/node_modules/bootstrap/less", __dirname+"/src/bootstrap", function(ret_obj){
        var shell = require("shelljs");
        
        if (ret_obj[0].modified_diff !== 0) {
            shell.cp('-f', ret_obj[0].fullPath, ret_obj[1].fullPath);
            fs.open(ret_obj[1].fullPath, "r", function(err, fd){
                if (!err) {
                    fs.futimesSync(fd, ret_obj[0].stats.atime, ret_obj[0].stats.mtime);
                }
            });
        }
    });
};

var compileBranch = function(branch) {
    var lessc = require("less");
    var path = require("path");
    
    //include global paths and branch path.
    var inc_paths = config["global"].import_path.concat(config.import_path, config[branch].import_path);
    var cur_path = path.join(__dirname, "src", branch);
    var out_path = path.join(__dirname, "content", branch);
    
    config[branch].compile.forEach(function(root_file){
        var less_file = path.join(cur_path, root_file);
        fs.readFile(less_file, function(err, less_data){

            lessc.render(less_data.toString(),
                {
                    paths: inc_paths,
                    filename: less_file,
                    compress: false
                },
                function(err, output) {
                    if (!err) {
                        var out_file = path.join(out_path, root_file).replace(".less", ".css");
                        fs.writeFile(out_file, output.css, "UTF8", function(err){
//                           if (err) console.log(err); 
                        });
                    } else {
//                        console.log(err);
                    }
                }
            );
        });
    });
};

rs.run();

function compileTask(f) {
    var reg = new RegExp(/src\/([\w]+)\/([\w.]+)/);
    var matches = f.match(reg);
    var branch_name = matches[1];
    var file_name = matches[2];
    
    var less_compile_task = rs.TASK.create("compile "+branch_name, 10000, compileBranch(branch_name));
    rs.addTask(less_compile_task);
}

plsub.addListeningContext("web.html");

process.on('SIGINT', function () {
    var packet = {
        type:"close",
        exit_level: 0,
    };
    console.log(JSON.stringify(packet));
    process.kill('SIGINT');
});


plsub.on("request", function(packet){
    //first try to find a file that matches the host_name
    var file_name = __dirname+"/content/"+packet.host_name+packet.request;
    fs.open(file_name, "r", function(err, fd){
        if (!err && fs.statSync(file_name).isFile()) {
            //found a matching file now feed it to the client
            fs.stat(file_name, function(err, stats){
                //send file
                var route_packet = {
                    type: "response",
                    response_type: "redirect",
                    context: packet.from,
                    request_id: packet.request_id,
                    hostname: config.global.hostname,
                    port: config.global.port,
                    path: "/content/"+packet.host_name+packet.request
                };
                plsub.send(route_packet);
            });
        } else { //error happpened lets search the default path
            file_name = __dirname+"/content/default"+packet.request;
            fs.open(file_name, "r", function(err, fd){
                if (!err && fs.statSync(file_name).isFile()) {
                    //found a match in the default directory
                    fs.stat(file_name, function(err, stats){
                        //send file
                        var route_packet = {
                            type: "response",
                            response_type: "redirect",
                            context: packet.from,
                            request_id: packet.request_id,
                            hostname: config.global.hostname,
                            port: config.global.port,
                            path: "/content/default"+packet.request
                        };
                        plsub.send(route_packet);
                    });
                } else {
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

//read configuration
fs.readFile(__dirname+"/config.json", function(err,data){
    if (!err) {
        config = JSON.parse(data.toString());

        var watch = require("watch");
        var app = new flatiron.App();

        app.use(flatiron.plugins.http);

        app.http.before = [
            ecstatic({root: __dirname + '/content', baseDir:"content"})
        ];

        //console.log(config);
        app.start(config.global.port);

        watch.createMonitor(__dirname+'/src', function(monitor){
            monitor.on("created", function(f, stat){
                compileTask(f);
            });

            monitor.on("changed", function(f, curr, prev){
                compileTask(f);
            });

            monitor.on("removed", function(f, stat){
                compileTask(f);
            });
        });
        
        syncBootstrap();
        //compileBranch("default");
    } else {
//        console.log(err);
    }
});
