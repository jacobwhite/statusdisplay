var url = 'ws://'+location.hostname + ":8080";

var connection = new WebSocket(url)

connect();
function connect(){
	if(connection.readyState === WebSocket.CLOSED){
		connection = new WebSocket(url);
	}
	connection.onopen = (error) => {
		console.log("connected");
		var msg = {
			type: "getStatus"
		};
		connection.send(JSON.stringify(msg));
		var registerMessage = {
			type: "register",
			displayType: "update",
			name: localStorage.displayName,
		}
		connection.send(JSON.stringify(registerMessage));
	}

	connection.onerror = (error) => {
	  console.log(`WebSocket error:`,error)
	}

	connection.onclose = function(e){
		console.log("socket closed, reconnecting in 1 second. ", e.reason);
		setTimeout(function() {
			connect();
		}, 1000);
	};
	connection.onmessage = (e) => {
		console.log(e.data)
		var message = JSON.parse(e.data);
		if(message.type == "status"){
			document.getElementById("status").value = message.status;
			$(document.body).animate({
				backgroundColor: message.color
			});
			var msg = {
				type: "displayStatus",
				name: localStorage.displayName,
				status: message.status,
				color: "black",
				displayType: "update"
			}
			connection.send(JSON.stringify(msg));
		}

		if(message.type == "displayStatus"){
			if(message.displayType == "update") return;
			scale = 180;
			if(document.getElementById(message.name) == undefined){
				g = document.createElement('div');
				g.setAttribute("id", message.name);
				g.style.backgroundColor = message.color;
				g.style.width = scale * message.width / message.height + "px";
				g.style.height = scale + "px";
				g.style.border = "white solid 1px";
				g.style.float = "left";
				g.style.spacing = "10px";
				g.style.margin = "10px";
				g.innerHTML="<br>" + message.status + "<br><br><br><br><br><br>" + message.name;
				document.getElementById('log').appendChild(g);
			}
			else {
				h = document.getElementById(message.name);
				h.innerHTML="<br>" + message.status + "<br><br><br><br><br><br>" + message.name;
				h.style.backgroundColor =  message.color;
				h.style.width = scale * message.width / message.height + "px";
				h.style.height = scale + "px";
			}
		}
	  
	}
}


function updateStatusFromForm(form){
	updateStatus(document.getElementById("status").value);
}

var lastTime = 0;
function throttle(func, timeFrame) {
	var now = new Date();
	if (now - lastTime >= timeFrame) {
		func();
		window.lastTime = now; 
	}
}

function clickColor() {
	var color;
	color = $("#color").val();
	updateStatus(document.getElementById("status").value);
}

function setColor(color){
	//keys[Math.floor(Math.random()*keys.length)].play();
	localStorage.color=color;
}

function updateStatus(status){
	//startSound.play();
	console.log("status value: ", status);
	var color = "black";
	if(status == "Free"){
		color = "green";
	}
	else if(status == "On Call"){
		color = "red";
	}
	else if(status == "Exercising"){
		color = "green";
	}
	else if(status == "Off"){
		color = "black";
	}
	else if(status == "Send Coffee"){
		color = "#a80";
	}
	else {
		if(typeof $("#color") !== 'undefined'){
		color = $("#color").val();
		color = localStorage.color;
		}
		else {
			color="red";
		}
	}

	var msg = {
		type: "status",
		status: status,
		name: localStorage.displayName,
		date: Date.now(),
		color: color
	}
	console.log("sending: ", msg.status, msg.color);
	connection.send(JSON.stringify(msg));
	//endSound.play();
}


var key1 = new Audio("keyok1.mp3");
var key2 = new Audio("keyok2.mp3");
var key3 = new Audio("keyok3.mp3");
var keys = [key1, key2, key3];

var startSound = new Audio("communications_start_transmission.mp3");

var endSound = new Audio("communications_end_transmission.mp3");



startSound.volume = 0.01;
endSound.volume = 0.01;
key1.volume = 0.01;
key2.volume = 0.01;
key3.volume = 0.01;
