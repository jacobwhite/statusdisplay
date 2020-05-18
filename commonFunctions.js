
const fs = require('fs');
//Persistent Global Statuses
var statuses = new Object();

module.exports = function () {
    this.wss = undefined;

    this.broadcastStatus = (wss, broadcastMessage) => {
        // var broadcastMessage = {
        //   type: "status",
        //   status: global.status,
        //   color: global.color,
        // }
        wss.broadcast(JSON.stringify(broadcastMessage));
    }

    this.generateCode = (length) => {
        var result = '';
        var characters = 'abcdefghjkmnpqrstuvwxyz23456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result.toUpperCase();
    }


    this.loadStatus = () => {
        let rawdata = fs.readFileSync('status.json');
        let json = JSON.parse(rawdata);
        global.status = json.status == undefined ? "" : json.status;
        global.color = json.color == undefined ? "black" : json.color;
        console.log("loaded status ", JSON.stringify(json));
    }

    this.saveStatus = () => {
        json = {
            status: global.status,
            color: global.color
        }
        fs.writeFileSync('status.json', JSON.stringify(json));
    }


    this.serveFile = (res, file) => {
        // console.log("serving file:", file);
        fs.readFile(file, function (err, data) {
            var mimetype = "text/html";
            let extension = file.substr(file.lastIndexOf('.') + 1);
            if (err) {
                res.writeHead(404);
                res.write("not found");
            }
            else {
                switch (extension) {
                    case "odf":
                        mimetype = "font/opentype";
                        break;
                    case "mp3":
                        mimetype = "audio/mpeg";
                        break;
                    case "html":
                        mimetype = "text/html";
                        break;
                    case "css":
                        mimetype = "text/css";
                        break;
                    case "js":
                        mimetype = "text/javascript";
                        break;
                }
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.writeHead(200, { 'Content-Type': mimetype });
                res.write(data);
                res.end();
            }
        });
    }

    this.getHttpServer = () => {

        const rlf = require("rate-limiter-flexible");
        const opts = {
        points:10,
        duration:60,
        };

        const rateLimiter = new rlf.RateLimiterMemory(opts);

        const http = require('http');
        const url = require('url');
        const querystring = require('querystring');

        const server = http.createServer((req, res) => {
            let parsedURL = url.parse(req.url);

            if (parsedURL.pathname == "/") {
                let queryParameters = querystring.parse(url.parse(req.url).query);

                if (queryParameters['serverConnections'] != undefined || (queryParameters['status'] != undefined || queryParameters['color'] != undefined) && queryParameters['displayCode'] != undefined) {
                    
                    rateLimiter.consume(queryParameters['displayCode'], 1)
                        .then((rateLimiterRes) => {
                            if (queryParameters['serverConnections'] != undefined && this.wss != undefined) {
                                console.log(this.wss._server.connections);
                                res.statuCode = 200;
                                res.setHeader('Content-Type', 'text/plain');
                                res.end('{"connections": "' + this.wss._server.connections +'"}');
                            }
                            else {
                                var broadcastMessage = {
                                    type: "status",
                                    status: queryParameters['status'],
                                    color: queryParameters['color'],
                                    displayCode: queryParameters['displayCode']
                                }
                                broadcastStatus(broadcastMessage);
                                res.statusCode = 200;
                                res.setHeader('Content-Type', 'text/plain');
                                res.end('{"result":"success","status":"' + status + '","color":"' + color + '"}');
                            }
                        })
                        .catch((rateLimiterRes) => { });
                }
                else {
                    this.serveFile(res, "html/index.html");
                }
            }
            else {
                this.serveFile(res, "html" + parsedURL.pathname);
            }
        });

        return server
    }
}