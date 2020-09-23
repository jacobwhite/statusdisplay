// Secrets
const keys = require('./keys');
// //Persistent Global Statuses
const request = require('request');

const commonMethodsFile = require("./commonFunctions")

const commonFunctions = new commonMethodsFile()

commonFunctions.loadStatus();

//Bump this number to force clients to reload
const serverVersion = 0.016;

//HTTP Stuff
var ip = require("ip");
const hostname = ip.address();
const port = 80;
const server = commonFunctions.getHttpServer()
server.listen(port, hostname, () => {
  console.log(`HTTP Server running at http://${hostname}:${port}/`);
});

//Web Socket Stuff
const WebSocket = require('ws')
const wss = new WebSocket.Server({ port: 8080 })
commonFunctions.wss = wss;

console.log("Websocket Ready"); 
wss.on('connection', ws => {
  ws.on('message', message => {
    console.log("received:", message)
    var msg = JSON.parse(message);
  
    //If message is a status update
    console.log("message type:",msg.type);
	  if(msg.type == "ping"){
		  ws.send(JSON.stringify({type: "ping"}));
	  }
	  else if(msg.type == "status"){
      console.log(msg.type, "updated to", msg.status);
      //saveStatus();

      //save status to memory
      global.statuses[msg.displayCode] = {status: msg.status, color: msg.color};
      console.log("status saved:", global.statuses[msg.displayCode]);

      //respond to update
      var response = {
        type: "response",
        value: "success",
        status: msg.status,
        serverVersion: global.serverVersion,
        color: msg.color
      }
      ws.send(JSON.stringify(response));
    
      //Broadcast update to all displays
      var broadcastMessage = {
        type: "status",
        status: msg.status,
        color: msg.color,
        serverVersion: serverVersion,
        displayCode: msg.displayCode
      }
      commonFunctions.broadcastStatus(wss, broadcastMessage);
      //Notify Telegram Channel if theres a channel_id
			console.log("CHAT_ID:", msg.chat_id);
      //if(msg.chat_id != undefined){
        //send message
	sendTelegramNotification("-1337", msg.status, msg.color)
      //}
    }

	  else if(msg.type == "getStatus"){
      var broadcastMessage = {
        type: "getStatus",
        serverVersion: global.serverVersion
      }
      wss.broadcast(JSON.stringify(broadcastMessage));
    }

	  else if(msg.type == "displayStatus"){
      msg.serverVersion = serverVersion;
      console.log("broadcasting displayStatus",msg.displayCode, msg.serverVersion);
      wss.broadcast(JSON.stringify(msg));
    }

	  else if(msg.type == "register"){
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
        serverVersion: global.serverVersion,
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

function sendTelegramNotification(chat_id, message, color){
  telegramAPIKey = keys.bot_api_key;
  chat_id = keys.chat_id;
  console.log(telegramAPIKey);
  console.log(chat_id);
  
	var telegramURL = "https://api.telegram.org/bot"+telegramAPIKey+"/sendMessage"
	var params = 'chat_id=' + chat_id + '&text=' + message + " " + color
	request.post({
		headers: {'content-type' : 'application/x-www-form-urlencoded'},
		url:     telegramURL,
		body:    params
	}, function(error, response, body){
		console.log(body);
	});
}
