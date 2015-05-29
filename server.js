//  Modules
//
var http = require("http");   // http server
var fs = require('fs');       // filesystem.
var path = require('path');   // used for traversing your OS.
var url = require('url');     // utility for URLs
var spawn = require('child_process').spawn;

// Settings
//
var WWW_ROOT = "./www/";
var STYLES_PATH = "styles/";
var HTTP_PORT = 8080;

// WEB SERVER
//
var server = http.createServer( function( req , res ) {
    var parsedReq = url.parse(req.url);

    if(parsedReq.pathname == "/save" && req.method.toLowerCase() == 'post'){
        //  SAVE a content
        var content = '';
        req.on('data', function (data) {
            content += data;
        });
        req.on('end', function () {
            var filename = Date.now()+".yaml";
            fs.writeFile(WWW_ROOT+STYLES_PATH + filename, content, function(err) {
                if(err) {
                    return console.log(err);
                }
                res.write(filename);
                res.end();
            }); 
            content = '';
        });
    } else {
        //  REGULAR WEB SERVER
        //
        var mimeTypes = {
            "html":  "text/html",
            "jpeg":  "image/jpeg",
            "jpg":   "image/jpeg",
            "png":   "image/png",
            "svg":   "image/svg+xml",
            "svgz":  "image/svg+xml",
            "js":    "text/javascript",
            "css":   "text/css"
        };

        var fileToLoad;

        if(req.url == "/") {
          fileToLoad = "index.html";
        } else {
          fileToLoad = url.parse(req.url).pathname.substr(1);
        }

        console.log("[HTTP] :: Loading :: " + WWW_ROOT + fileToLoad);

        var fileBytes;
        var httpStatusCode = 200;

        // check to make sure a file exists...
        fs.exists(WWW_ROOT + fileToLoad,function(doesItExist) {

            // if it doesn't exist lets make sure we load error404.html
            if(!doesItExist) {
                console.log("[HTTP] :: Error loading :: " + WWW_ROOT + fileToLoad);

                httpStatusCode = 404;
                fileToLoad = "error404.html";
            }

            var fileBytes = fs.readFileSync(WWW_ROOT + fileToLoad);
            var mimeType = mimeTypes[path.extname(fileToLoad).split(".")[1]]; // complicated, eh?

            res.writeHead(httpStatusCode,{'Content-type':mimeType});
            res.end(fileBytes);
        });
	}
}).listen(HTTP_PORT);
console.log("Server started at http://localhost:" + HTTP_PORT);
