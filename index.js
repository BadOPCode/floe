'use strict';

var partyline = require("party-line");

var webserver = new partyline.addLocalProcess('subs/web/index.js', function(packet){
    //display packet generated by service
    console.log("----[HTTP Client Handler "+webserver.worker.configuration.worker_id+" Start]-----");
    console.log(JSON.stringify(packet));
    console.log("----[HTTP Client Handler "+webserver.worker.configuration.worker_id+" End]-----");
});
webserver.startService();

var html_generator = new partyline.addLocalProcess('subs/html/index.js', function(packet){
    //display packet generated by service
    console.log("----[Page Generator "+html_generator.worker.configuration.worker_id+" Start]-----");
    console.log(JSON.stringify(packet));
    console.log("----[Page Generator "+html_generator.worker.configuration.worker_id+" End]-----");
});
html_generator.startService();

var static_repository = new partyline.addLocalProcess('subs/static/index.js', function(packet){
    //display packet generated by service
    console.log("----[Static Repository "+static_repository.worker.configuration.worker_id+" Start]-----");
    console.log(JSON.stringify(packet));
    console.log("----[Static Repository "+static_repository.worker.configuration.worker_id+" End]-----");
});
static_repository.startService();