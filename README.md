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

This is a bit clunky but haven't even started working on a installation script yet.


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