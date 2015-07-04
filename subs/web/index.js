#!/usr/bin/env node

/**
 * Routes web traffic.
 * Shawn Rapp - 11/23/2014
 */

var http = require('http'),
    plsub = require('party-line-sub')('web');

var request_stack = [];

request_stack.remove = function(to, from) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
}

/**
 *  Scans the request stack and finds dead or closed requests and removes them from the stack.
 */
var garbageCollector = function() {
    //run backwards so loop doesn't break when removing closed requests
    for (var i = request_stack.length; i > 0; i--) {
        if (request_stack[i].scheduled_to_close) {
            request_stack.remove(i);
        }
    }
};

var requestSessionId = function(request) {
    var request_packet = {
        context: 'web.api',
        type: 'session-generate',
        ip_address: request.client_ip,
        request_id: request.id
    }
    plsub.send(request_packet);
}

/**
 * RequestHandler Object Definition
 */
var RequestHandler = function(req, res) {
    var self = this;
    var post_vars = '';

    function init() {
        self.id = require('node-uuid').v4(); //generate a request ID
        self.method = req.method;
        self.host_name = req.headers.host;
        self.url = req.url;
        self.request_headers = req.headers;
        self.response_stream = res;
        self.client_ip = req.connection.remoteAddress;
        self.scheduled_to_close = false;
        self.headers = {
            'X-Powered-By': 'Floe'
        };
        self.cookies = {};
        self.outbound_cookies = [];

        self.getCookies();
        if (!self.cookies['session_id'])
            requestSessionId(self);

        var packet = {
            context: 'web',
            type: 'request',
            request_id: self.id,
            method: self.method,
            request: self.url,
            post_vars: self.post_vars,
            host_name: self.host_name,
            session_id: self.cookies['session_id']
        };
        plsub.send(packet);

        request_stack[self.id] = self;

        plsub.queryService('web', function(listen_stack) {
            request_stack[self.id].listen_stack = listen_stack;
        });

        self.response_stream.on('close', function() {
            self.scheduled_to_close = true;
            garbageCollector();
        });
    }

    if (req.method == 'POST') {
        req.on('data', function(chunk) {
            post_vars += chunk;
        });
        req.on('end', function() {
            self.post_vars = JSON.parse(post_vars);
            init();
        });
    }
    else {
        init();
    }

};

RequestHandler.prototype.processPacket = function(packet) {
    var self = this;

    if (packet.header === undefined) return;

    //copy packet with HTML's header to what will be the response header
    Object.getOwnPropertyNames(packet.header).forEach(function(name) {
        var new_header = Object.getOwnPropertyDescriptor(packet.header, name);
        //simplify header object
        if (typeof(new_header) === 'object') {
            self.headers[name] = new_header.value;
        }
        else {
            self.headers[name] = new_header;
        }
    });

    //strip cookie object to an array for response.
    var send_cookies = [];
    self.outbound_cookies.forEach(function(cookie_name) {
        send_cookies.push(self.cookies[cookie_name]);
    });

    //add cookies to headers
    self.headers['Set-Cookie'] = send_cookies;

    self.response_stream.writeHead(packet.response_code, self.headers);
    self.response_stream.write(packet.content);
    self.response_stream.end();
};

RequestHandler.prototype.processRedirect = function(packet) {
    var self = this;

    var options = {
        hostname: packet.hostname,
        port: packet.port,
        path: packet.path,
        method: 'GET'
    };
    plsub.logger.info('REDIRECT -- Hostname:' + packet.hostname + ' Port:' + packet.port + ' Path:' + packet.path);
    var req = http.request(options, function(res) {
        self.response_stream.writeHead(200, res.headers);
        plsub.logger.info('REDIRECT HEADERS :', {
            header: res.headers
        });
        res.on('data', function(chunk) {
            self.response_stream.write(chunk);
        });

        res.on('error', function(err) {
            plsub.logger.error(err.message);
            self.response_stream.writeHead(500);
            self.response_stream.write('Fatal error occurred.');
            self.response_stream.end();
        });

        res.on('end', function() {
            self.response_stream.end();
        });
    });

    req.on('error', function(err) {
        plsub.logger.error(err);
        self.response_stream.writeHead(500);
        self.response_stream.write('Fatal error occurred.');
        self.response_stream.end();
    });

    req.end();
};

RequestHandler.prototype.setCookie = function(packet) {
    var self = this;

    var cookie_str = packet.cookie_name + '=' + packet.cookie_value;

    self.cookies[packet.cookie_name] = cookie_str;
    if (self.outbound_cookies.indexOf(packet.cookie_name) < 0)
        self.outbound_cookies.push(packet.cookie_name);
};

RequestHandler.prototype.getCookies = function() {
    var self = this;
    var cookie = require('cookie');

    var cookie_str = self.request_headers['cookie'];
    self.cookies = cookie.parse(cookie_str);
};

RequestHandler.prototype.processFileNotFound = function() {
    var self = this;

    self.response_stream.writeHead(404, '');
    self.response_stream.write('File not found.');
    self.response_stream.end();
};

/* Recieved a response from context request */
plsub.on('response', function(packet) {
    Object.keys(request_stack).forEach(function(request_id) {
        if (request_id == packet.request_id) {
            switch (packet.response_type) {
                case 'html':
                    request_stack[request_id].processPacket(packet);
                    break;
                case 'redirect':
                    request_stack[request_id].processRedirect(packet);
                    break;
            }
            //no fall through
        }
    });
});

plsub.on('setCookie', function(packet) {
    Object.keys(request_stack).forEach(function(request_id) {
        if (request_id == packet.request_id) {
            request_stack[request_id].setCookie(packet);
        }
    });
});

/* Recieved that a service on context didn't know how to answer */
plsub.on('noResponse', function(packet) {
    Object.keys(request_stack).forEach(function(request_id) {
        if (request_id == packet.request_id) {
            var finish_waiting = true;

            request_stack[request_id].listen_stack.forEach(function(listener) {
                if (packet.from == listener.worker_id) {
                    listener.response = 'noResponse';
                }
                if (listener.response == 'unknown') {
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

var server = http.createServer(function(req, res) {
    server.new_req = new RequestHandler(req, res);
});


server.listen(process.env.PORT, process.env.IP);