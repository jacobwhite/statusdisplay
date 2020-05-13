//Persistent Global Status
const fs = require('fs');
function loadStatus(){
  let rawdata = fs.readFileSync('status.json');
  let json = JSON.parse(rawdata);
  global.status = json.status == undefined ? "" : json.status;
  global.color = json.color == undefined ? "black" : json.color;
  console.log("loaded status ", JSON.stringify(json));
}

function saveStatus(){
  json = {
    status: global.status,
    color: global.color
  }
  fs.writeFileSync('status.json', JSON.stringify(json));
}

loadStatus();

//HTTP Stuff
var ip = require("ip");
const hostname = ip.address();
const http = require('http');
const port = 8000;
const url = require('url');
const querystring = require('querystring');

const server = http.createServer((req, res) => {
  let parsedURL = url.parse(req.url);
  
  if(parsedURL.pathname == "/"){
    let queryParameters = querystring.parse(url.parse(req.url).query);
    
    if((queryParameters['status'] != undefined || queryParameters['color'] != undefined) && queryParameters['displayCode'] != undefined){
      var broadcastMessage = {
        type: "status",
        status: queryParameters['status'],
        color: queryParameters['color'],
        displayCode: queryParameters['displayCode']
      }
      broadcastStatus(broadcastMessage);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('{"result":"success","status":"'+status+'","color":"'+color+'"}');
    }
    else {
      serveFile(res,"html/index.html");
      }  
	}
	else {
    serveFile(res, "html"+parsedURL.pathname);
  }
});

function serveFile(res, file){
  // console.log("serving file:", file);
  fs.readFile(file, function(err, data){
    var mimetype="text/html";
    let extension = file.substr(file.lastIndexOf('.') + 1);
    if(err){
      res.writeHead(404);
      res.write("not found");
    }
    else {
      switch(extension){
      case "odf":
        mimetype="font/opentype";
        break;
      case "mp3":
        mimetype="audio/mpeg";
        break;
      case "html":
        mimetype="text/html";
        break;
      case "css":
        mimetype="text/css";
        break;
      case "js":
        mimetype="text/javascript";
        break;
      }
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.writeHead(200, {'Content-Type': mimetype});
      res.write(data);
      res.end();
    }
  });
}

server.listen(port, hostname, () => {
  console.log(`HTTP Server running at http://${hostname}:${port}/`);
});

//Web Socket Stuff
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })
console.log("Websocket Ready"); 
wss.on('connection', ws => {
  ws.on('message', message => {
    console.log("received:", message)
    var msg = JSON.parse(message);
  
    //If message is a status update
    if(msg.type == "status"){
      console.log(msg.type, "updated to", msg.status);
      //global.status = msg.status;
      //global.color = msg.color;
      //saveStatus();

      //respond to update
      var response = {
        type: "response",
        value: "success",
        status: msg.status,
        color: msg.color
      }
      ws.send(JSON.stringify(response));
    
      //Broadcast update to all displays
      var broadcastMessage = {
        type: "status",
        status: msg.status,
        color: msg.color,
        displayCode: msg.displayCode
      }
      broadcastStatus(broadcastMessage);
    }

    if(msg.type == "getStatus"){
      var broadcastMessage = {
        type: "getStatus"
      }
      wss.broadcast(JSON.stringify(broadcastMessage));
    }

    if(msg.type == "displayStatus"){
      console.log("broadcasting displayStatus",msg.displayCode);
      wss.broadcast(JSON.stringify(msg));
    }

    if(msg.type == "register"){
      if(msg.displayCode == undefined){
        ws.displayCode = generateCode(6);
      }
      else {
        ws.displayCode = msg.displayCode;
      }
      var message = {
        type: "status",
        status: global.status,
        color: global.color,
        displayCode: ws.displayCode
      }
      console.log("responding to register: ", message);
      ws.send(JSON.stringify(message));
      console.log("display code is:", ws.displayCode);
    }
  })
})

wss.broadcast = function(msg) {
  var json = JSON.parse(msg);
  wss.clients.forEach(function each(client){
    if(client.displayCode == json.displayCode){
      console.log("    sending", msg);
      client.send(msg);
    }
  });
};

function broadcastStatus(broadcastMessage){
  // var broadcastMessage = {
  //   type: "status",
  //   status: global.status,
  //   color: global.color,
  // }
  wss.broadcast(JSON.stringify(broadcastMessage));
}

function generateCode(length){
  var result           = '';
   var characters       = 'abcdefghjkmnpqrstuvwxyz23456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result.toUpperCase();
}
