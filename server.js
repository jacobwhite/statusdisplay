// //Persistent Global Statuses
// var statuses = new Object();

const commonMethodsFile = require("./commonFunctions")

const commonFunctions = new commonMethodsFile()

// const fs = require('fs');

commonFunctions.loadStatus();

//HTTP Stuff

var ip = require("ip");
const hostname = ip.address();
// const http = require('http');
const port = 8000;
// const url = require('url');
// const querystring = require('querystring');

const server = commonFunctions.getHttpServer()


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

	//save status to memory
	global.statuses[msg.displayCode] = {status: msg.status, color: msg.color};

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
      commonFunctions.broadcastStatus(wss, broadcastMessage);
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
        ws.displayCode = commonFunctions.generateCode(6);
      }
      else {
        ws.displayCode = msg.displayCode;
      }
	  if(global.statuses == undefined){
		global.statuses = new Object();
	  }
	  if(global.statuses[msg.displayCode] == undefined){
		global.statuses[msg.displayCode] = new Object();
	  }

      var message = {
        type: "status",
        status: global.statuses[msg.displayCode].status,
        color: global.statuses[msg.displayCode].color,
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

