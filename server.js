//Global Status
global.status = "Free";
global.color = "green";

//HTTP Stuff
var ip = require("ip");
const hostname = ip.address();
const http = require('http');
const port = 8000;
const url = require('url');
const querystring = require('querystring');
const fs = require("fs");

const server = http.createServer((req, res) => {
  console.log(req.url);
  let parsedURL = url.parse(req.url);
  console.log(parsedURL.pathname);
  
  switch(parsedURL.pathname){
    case "/":
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      let queryParameters = querystring.parse(url.parse(req.url).query);
      global.status = queryParameters['status'];
      global.color = queryParameters['color'];
      broadcastStatus();
      res.end('{"result":"success","status":"'+status+'","color":"'+color+'"}');
    break;
/*
	case "/display.html":
    fs.readFile("display.html", function (err, data) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      res.end();
	});
    break;
	case "/display.js":
    fs.readFile("display.js", function (err, data) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      res.end();
	});
    break;
	case "/stylesheet.js":
    fs.readFile("stylesheet.js", function (err, data) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      res.end();
	});
    break;
*/
	default:
	fs.readFile("html"+parsedURL.pathname, function(err, data){
	var mimetype="text/html";
	let extension = parsedURL.pathname.substr(parsedURL.pathname.lastIndexOf('.') + 1);
		if(err){
			res.writeHead(404);
			res.write("not found");
		}
		else {
			console.log("extension",extension);
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
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

//Web Socket Stuff
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })
console.log("Ready"); 
wss.on('connection', ws => {
  ws.on('message', message => {
    console.log("received:", message)
	var msg = JSON.parse(message);
	
	//If message is a status update
	if(msg.type == "status"){
		console.log(msg.type, "updated to", msg.status);
		global.status = msg.status;
		global.color = msg.color;

		//respond to update
		var response = {
			type: "response",
			value: "success",
			status: global.status,
			color: global.color

		}
		ws.send(JSON.stringify(response));
		
		//Broadcast update to all displays
		broadcastStatus();
	}

	if(msg.type == "getStatus"){
		var broadcastMessage = {
			type: "getStatus"
		}
		wss.broadcast(JSON.stringify(broadcastMessage));
	}

	if(msg.type == "displayStatus"){
		wss.broadcast(JSON.stringify(msg));
	}
	if(msg.type == "register"){
		var message = {
			type: "status",
			status: global.status,
			color: global.color
		}
		console.log("responding to register: ", message);
		ws.send(JSON.stringify(message));
	}
  })
})
wss.broadcast = function(msg) {
	console.log("broadcast: ", msg);
	wss.clients.forEach(function each(client){
		console.log("    sending", msg);
		client.send(msg);
	});
};
function broadcastStatus(){
	var broadcastMessage = {
		type: "status",
		status: global.status,
		color: global.color
	}
wss.broadcast(JSON.stringify(broadcastMessage));
}
