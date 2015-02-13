# Floe Web Server
Party Line based cloud distributed web server.

WARNING STILL IN A ALPHA STAGE!

Installing
----------
clone the git repo of Floe
{code}
git clone https://github.com/BadOPCode/floe.git
{code}

in the Floe directory type
{code}
npm install
cd subs/html
npm install
cd ../static
npm install
cd ../web
npm install
{code}

This is a bit clunky but haven't even started working on a installation script yet.


Quick Overview
--------------

Web is the sub system that handles incoming requests and passes it along the bus.

Static is a static content repository.  It has a directory named content.  In the content folder there should be a default folder that matches all requests and folders named after domain names that have specific files that matches the request for that domain name.  Anything can be in the static sub.  It's basically the equiv of Apache with no script modules loaded.

Last but not least is the html sub.  This sub too has a content directory that has the default for unmatched domain names and folders with the domains.  HTML sub is a HTML generator that uses the EJS template system though.  Currently as of writing this doc, it is in a primitive state because it's not able to generate a page / partial object like it will in the future.

In Development
--------------
LESS Sub that will compile LESS files and cache CSS's.
Match weight.  A algorithm that will determin what is the best response for the request.
Better instructions.
More Angular and Bootstrap front end love.  

PS: Please remember if you hate any sub in the server.  Like you want Jade instead of EJS...  Feel free to make your own sub just how you want.  In fact you can leave the EJS sub in their and run a new sub that renders in Jade no problem.  And it's fairly easy to do.
