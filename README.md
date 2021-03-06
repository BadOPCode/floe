# Floe Web Server
Party Line based cloud distributed web server.

WARNING STILL IN A ALPHA STAGE!

Installing
----------

clone the git repo of Floe

```
git clone https://github.com/BadOPCode/floe.git
```

in the Floe directory type

```
npm install
cd subs/html
npm install
cd ../static
npm install
cd ../web
npm install
```

This is a bit clunky but haven't even started working on a installation script 
yet.


Quick Overview
--------------

Floe web services is not like any other web server out there.  It's actually a 
collage of subsystems that connect to a service backbone called Party Line.
Unlike other servers where intercommunication happens as an external addition, 
in Floe intercommunication happens at it's very core.  The entire web 
transaction is broken up into subsystems.  This allows for easy to scale and
easy to write web services.


In Development
--------------
- API subsystem.
- Angular factories and directives that simplify connecting to Floe.
- Session handler subsystem.
- Authorization subsystem.
- Better instructions.
- Installation and upgrade scripts

PS: Please remember if you hate any sub in the server.  Like you want Jade 
instead of EJS...  Feel free to make your own sub just how you want.  In fact 
you can leave the EJS sub in there and run a new sub that renders in Jade no 
problem.  And it's fairly easy to do.  Feel free to fork your own project based
on Floe.  Please just mention this project as part of your inspiration if you
do.


What is Party Line?
-------------------

Put simply it is a application written in Node JS that provides the means of 
applications to communicate to each other.  It provides console IO listeners or
workers that you can run your application and output console IO in JSON format
that will be read and interpretted by the worker.  This means you can write 
these subsystems in any language you like.  As it has to do is output JSON and
understand the Party Line language.
To learn more about Party Line please go to 
http://github.com/badopcode/party-line


Floe Communication
------------------

While the means of communicating is via the Party-Line what each individual subs
of Floe expect to see is a different topic.
The basic subs of Floe are as such:
- api:  API Subsystem
- html:  HTML Subsystem
- less:  Less/CSS Subsystem
- session:  Session Subsystem
- static:  Static Content Subsystem
- web:  Web Client Handler Subsystem

Each one of these subs has a specific duty it handles.  It is important to the
philosophy of Floe that subs don't cross functionality.  This can impose extra
challenges in designing.  But the final product is that you will have no 
problems scaling and adding functionality.
When a Floe subsystem is started Party Line will generate a address for the new
worker that came online.  Subs should never have static addresses, because
communication should always start with broadcasting who can solve your query.
If your using the Party Line Sub module you will notice one of the first things
it does is queries the bus for what it's current address is.
```Example: {"context":"bus","type":"whoAmI"}```
The bus will return back what this sub's current address is set to.  Which is
GUID v4 string that will look like "eb4e98de-fda2-4b50-af72-f19a382144db".
While Party Line most definitely allows for direct communication, again try to
reframe from using it to initiate a Floe communication.  Instead use the channel
context instead.  The subs will add themselves to the bus as listening to these
channel contexts.
```Example: {"context":"bus","type":"setListenContext","listen_context":["web.html"]}```
This PL packet being sent to the PL bus will set the sending sub's listening context
to the strings specified in listen_context.  In this case is just set to web.html.
A sub can set itself to listen to as many channel contexts as it wants.  And there
is nothing special that has to be done to create a channel context.  Just someone
has to say they are going to listen for packets in it.
Packets that are broadcasted to a context with no listeners is instantly killed
and returns back an error to the sender.
If your using party-line-sub module to add your sub to a channel context you looks
like this:
```
var plsub  = require("party-line-sub");
plsub.addListeningContext("my.channel.context");
```
And to send a message into this channel context you would write something like
```
    var test_packet = {
        type: "test",
        context: "my.channel.context",
        message: "Hello World!"
    };
    plsub.send(test_packet);
```


##API Subsystem
Listens on context: api; web.api
The API subsystem is designated for high level front end or exposed API services.
This sub is a easy to extend frame work for making API services without having to
build out a entire subsystem.

##HTML Subsystem
Listens on context: web.html
The HTML subsystem is a EJS rending engine.  It crunches complex EJS templates
and creates HTML output.

##Less/CSS Subsystem
Listens on context: web.css
The Less/CSS Subsystem generates CSS files that are built from Less that are
compiled against Bootstrap.

##Session Subsystem
Listens on context: api; web.api
The Session Subsystem hold small bits of low security data.  It generates a
session id and sends it to the client.  Incoming traffic is labeled with this
session id and you can retrieve or store data server side about the current
client session.  Percausions are taken to discourage session exploits but best
practice is to not be too trusting.

##Static Content Subsystem
Listens on context: web
The static content subsystem is where you can place static content files such
as pictures, pre-built HTML's or CSS's.  Static content has no conditions on 
what it can serve.  But it does not process anything it serves.

##Web Client Handler Subsystem
Listens on context: N/A
The web client handler subsystem handles all incoming web connections from user
web browsers and interprets it into a Floe/Party Line session.  Modules can not
broadcast to speak to web subs (as of yet.)  But web client sub generates a new
request with a request ID.  Requests to generate a session ID if there isn't one
already.  Than forwards a request into the PL bus.
