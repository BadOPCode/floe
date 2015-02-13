#!/usr/bin/env node

/**
 * Routes web traffic.
 * Shawn Rapp - 11/23/2014
 */
 
var http = require('http')
,   plsub = require("party-line-sub");

var request_stack = [];

request_stack.remove = function(to, from){
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
}

/**
 *  Scans the request stack and finds dead or closed requests and removes them from the stack.
 */
var garbageCollector = function() {
    //run backwards so loop doesn't break when removing closed requests
    for (var i=request_stack.length; i>0; i--) {  
        if (request_stack[i].scheduled_to_close) {
            request_stack.remove(i);
        }
    }
};

/**
 * RequestHandler Object Definition
 */
var RequestHandler = function(req, res) {
    var self = this;
    
    self.id = require("node-uuid").v4();  //generate a request ID
    self.method = req.method;
    self.host_name = req.headers.host;
    self.url = req.url;
    self.post_vars = req.post_vars;
    self.response_stream = res;
    self.scheduled_to_close = false;

    var packet = {
        context: "web.html",
        type: "request",
        request_id: self.id,
        method: self.method,
        request: self.url,
        post_vars: self.post_vars,
        host_name: self.host_name
    };
    plsub.send(packet);

    request_stack[self.id] = self;

    plsub.queryService("web.html", function(listen_stack){
        request_stack[self.id].listen_stack = listen_stack;
    });
    
    self.response_stream.on("close", function() {
       self.scheduled_to_close = true; 
       garbageCollector();
    });
};

RequestHandler.prototype.processPacket = function(packet) {
    var self = this;
    
    if (packet.header === undefined) return;

    self.response_stream.writeHead(packet.response_code, packet.header);
    self.response_stream.write(packet.content);
    self.response_stream.end();
};

RequestHandler.prototype.processRedirect = function(packet) {
    var self = this;
    
    var options = {
        hostname: packet.hostname,
        port: packet.port,
        path: packet.path,
        method: "GET"
    };
    plsub.logger.info("REDIRECT -- Hostname:"+packet.hostname+" Port:"+packet.port+" Path:"+packet.path);
    var req = http.request(options, function(res){
        self.response_stream.writeHead(200, res.headers);
        plsub.logger.info("REDIRECT HEADERS :", {header:res.headers});
        res.on("data", function(chunk){
            self.response_stream.write(chunk);
        });
        
        res.on("error", function(err){
            plsub.logger.error(err.message);
            self.response_stream.writeHead(500);
            self.response_stream.write("Fatal error occurred.");
            self.response_stream.end();
        });
        
        res.on("end", function(){
            self.response_stream.end();
        });
    });

    req.on("error", function(err){
       plsub.logger.error(err); 
        self.response_stream.writeHead(500);
        self.response_stream.write("Fatal error occurred.");
        self.response_stream.end();
    });
    
    req.end();
};

RequestHandler.prototype.processFileNotFound = function(){
    var self = this;
    
    self.response_stream.writeHead(404, "");
    self.response_stream.write("File not found.");
    self.response_stream.end();
};

/* Recieved a response from context request */
plsub.on("response", function(packet){
    Object.keys(request_stack).forEach(function(request_id) {
        if (request_id == packet.request_id) {
            switch (packet.response_type) {
                case "html":
                    request_stack[request_id].processPacket(packet);
                    break;
                case "redirect":
                    request_stack[request_id].processRedirect(packet);
                    break;
            }
            //no fall through
        }
    });
});

/* Recieved that a service on context didn't know how to answer */
plsub.on("noResponse", function(packet){
    Object.keys(request_stack).forEach(function(request_id) {
        if (request_id == packet.request_id) {
            var finish_waiting = true;
            
            request_stack[request_id].listen_stack.forEach(function(listener){
                if (packet.from == listener.worker_id) {
                   listener.response = "noResponse";
                }
                if (listener.response == "unknown") {
                    finish_waiting = false;
                }
            });
            
            //not waiting for any more services.
            if (finish_waiting) {
                request_stack[request_id].processFileNotFound();
            }
        }
    });
});

var server = http.createServer(function (req, res) {
    server.new_req = new RequestHandler(req, res);
});


server.listen(process.env.PORT, process.env.IP);