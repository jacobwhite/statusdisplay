var url = 'ws://'+location.hostname + ":8080";
var connection = undefined;// = new WebSocket(url);

var updateSound = new Audio("alarm02.mp3");
updateSound.volume = 0.9;
var coffeeSound = new Audio("alarm03.mp3");
coffeeSound.volume = 0.05;

window.addEventListener('resize', update);

$(document).ready( function() {
	$('#statush2').hide();
	if(localStorage.displayCode == undefined){
		localStorage.displayCode = generateCode(3);
	}

	if(localStorage.displayCode != undefined){
		document.getElementById("displayCodeTextBox").value = localStorage.displayCode;
	}
	if(localStorage.displayName != undefined){
		document.getElementById("displayNameTextBox").value = localStorage.displayName;
	}
	else {
		document.getElementById("displayNameTextBox").value = suggestDisplayName();
	}
	if(localStorage.displayName != undefined &&
	   localStorage.displayName != "undefined" &&
	   localStorage.displayCode != undefined &&
	   localStorage.displayCode != "undefined"){
		   connect();
	   }
});
function suggestDisplayName(){
	var characters = ["Kurse","Alpha","Shades","Hulk","Winter-Soldier","Hawkeye","Hellcow","Ghost-Rider","Abomination","Beta","Dagger","Agent-13","The-Punisher","Scorch","Absorbing-Man","Yellowjacket","Whitney-Frost","Blackout","White-Power-Dave","Chico","Black-Mariah","Drax-the-Destroyer","Rooster","Kingpin","Honest-Eddie","Ego-the-Living-Planet","Viktor-Ivchenko","Kingpin","Madame-Gao","Lash","Deathlok","The-Superior","Jimmy-the-Bear","Cloak","Mandarin","Hank-Thompson","Korath-the-Pursuer","Ant-Man","Micro","The-Patriot","The-Tinkerer","Quicksilver","Scarlet-Witch","The-Calvary","Daredevil","Agent-33","Spider-Man","Deathlok","Ant-Man","Star-Lord","Nova-Prime","Ghost-Rider","War-Machine","Iron-Patriot","Yo-Yo","Captain-America","Black-Widow","Ronan-the-Accuser","Crossbones","Red-Skull","Blacksmith","Shocker","The-Executioner","The-Manderin","Iron-Monger","Iron-Man","Cottonmouth","Pistol-Pete","Doctor-Strange","Diamondback","Black-Panther","Kilgrave","The-Collector","Wasp","Whiplash","Patsy","Falcon"];
	var result = characters[Math.floor(Math.random()*characters.length)];
	return result + "-Display".toUpperCase();
}

function clickName(){
	$("#displaySpan").hide();
	$("#displayNameBoxSpan").show();
}

function clickCode(){
	$("#displayCodeContainter").hide();
	$("#displayCodeBoxSpan").show();
}

function changedname(){
	if(connection!=undefined){
		connection.close();
		connect();
		$("#displayNameBoxSpan").hide();
		$("#displaySpan").show();
	}
}

function changedcode(){
	if(connection!=undefined){
		connection.close();
		connect();
		$("#displayCodeBoxSpan").hide();
		$("#displayCodeContainter").show();
	}

}

var lastTime = 0;
function throttle(func, timeFrame) {
	var now = new Date();
	if (now - lastTime >= timeFrame) {
		func();
		window.lastTime = now; 
	}
}

function update(message){
	var now = new Date();
	if (now - lastTime >= 250){
		var response = {
			type: "displayStatus",
			name: localStorage.displayName,
			status: localStorage.status,
			color: localStorage.color,
			width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
			height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
			displayCode: localStorage.displayCode
		}
		connection.send(JSON.stringify(response));
		window.lastTime = now;
	}	
}

lastPing = new Date();
function sendPing(){
	console.log("sent ping");
	connection.send(JSON.stringify({type:"ping"}));
}

function handlePing(){
	lastPing = new Date();
	console.log("received ping", "lastPing:",lastPing);
}

function isAlive(){
	var now = new Date();
	if(now - lastPing >= 10){//10 seconds
		console.log("ping timed out", now - lastPing);
		location.reload();
	}
	else {
		console.log("still alive", now - lastPing);
		
	}
}

function toggle(element){
    if( $(element).is(":visible")){
        $(element).hide();
    }
    else {
        $(element).show();
    }
}
function handle(e){
    var oldDisplayName = localStorage.displayName;
    e.preventDefault(); // Otherwise the form will be submitted
    localStorage.displayName = $('#displayName').val();
    console.log(localStorage.displayName);
    toggle($('#displaySpan'));
    toggle($('#displayName'));
	$('#displayNameLabel').text(localStorage.displayName);

    var url="https://photar.net/ip/";
  //$.get(url).then(function(data){ $.get("https://photar.net/oncall/remove/?ip="+data+"&displayName="+oldDisplayName)});
}

function register(){
	if(connection.readyState === WebSocket.OPEN){
		updateSound.play();
		var msg = {
			type: "register",
			name: localStorage.displayName,
			date: Date.now(),
			displayCode: localStorage.displayCode
		}
		connection.send(JSON.stringify(msg));
		console.log("registered");

	}
	else {
		console.log("websoket open but not ready?");
		console.log(connection.readyState);
	}
}

function connect(){
	connection = new WebSocket(url);
	$("#connectButton").hide();
	$("#displayNameBoxSpan").hide();
	$("#displayCodeBoxSpan").hide();
	$("#statushd").show();
	localStorage.displayName = $("#displayNameTextBox").val();
	localStorage.displayCode = $("#displayCodeTextBox").val();
	console.log("connecting...");

	connection.onopen = function(e){
		register();
		setInterval(function() {
			sendPing();
		},10000);
		setInterval(function(){isAlive()},10000);
	}
	
	connection.onclose = function(e){
		console.log("socket closed, reconnecting in 1 second. ", e.reason);
		connection.onopen = null;
		//$("#connectButton").show();
		setInterval(function() {
			connect();
		}, 10000);
	};
	 
	connection.onerror = function(error) {
	  console.log("WebSocket error:",error)
	}
	 
	connection.onmessage = function(e) {
	  $('#statush2').show();	
	  $('#displayNameLabel').text(localStorage.displayName);
	  $('#displayCodeSpan').text(localStorage.displayCode);
	  console.log(e.data)
	  var message = JSON.parse(e.data);

	  if(localStorage.serverVersion == undefined || localStorage.serverVersion == "undefined"){
		  if(message.serverVersion != undefined && message.serverVersion != "undefined"){
			  localStorage.serverVersion = message.serverVersion;
		  }
	  }
	  else if(localStorage.serverVersion != message.serverVersion){
		if(message.serverVersion != undefined && message.serverVersion != "undefined"){
			localStorage.serverVersion = message.serverVersion;
			location.reload();
		}
	  }

		if(message.type == 'ping'){
			handlePing();
		}
		else if(message.type == 'status'){
			if(message.status == "Send Coffee" || message.color == "red"){
				coffeeSound.play();
			}	
			else {
				updateSound.play();
			}
			if(message.status == "Off"){
				message.status = "";
			}
			localStorage.displayCode = message.displayCode;

			if(message.status != undefined && message.status != "undefined"){
			  localStorage.status = message.status;
			}
			else {
			  message.status = localStorage.status;
			}
			$("#status").text(message.status)
			
			if(message.color != undefined && message.color != "undefined"){
				localStorage.color = message.color;
			}
			else {
				message.color = localStorage.color;
			}
			$(document.body).animate({
				backgroundColor: message.color
			});

			// if(message.status == "Exercising"){
			// 	$('body').css('marginTop', '20px');
			// 	$('#exercise').show();
			// 	if(document.getElementById('exercise').getAttribute('src') == ""){
			// 		document.getElementById('exercise').setAttribute('src', "https://photar.net/truepoints/embedded/");
			// 	}
			// }
			// else {
			// 	document.getElementById('exercise').setAttribute('src', "");
			// 	$('#exercise').hide();
			// 	//$('body').css('marginTop', '200px');
			// }
			update(message);
		}
		else if(message.type == "getStatus"){
			update();
		}
	}
}
function generateCode(length){
	var result           = '';
	 //var characters       = 'abcdefghjkmnpqrstuvwxyz23456789';
	var characters = ["Kurse","Alpha","Shades","Hulk","Winter-Soldier","Hawkeye","Hellcow","Ghost-Rider","Abomination","Beta","Dagger","Agent-13","The-Punisher","Scorch","Absorbing-Man","Yellowjacket","Whitney-Frost","Blackout","White-Power-Dave","Chico","Black-Mariah","Drax-the-Destroyer","Rooster","Kingpin","Honest-Eddie","Ego-the-Living-Planet","Viktor-Ivchenko","Kingpin","Madame-Gao","Lash","Deathlok","The-Superior","Jimmy-the-Bear","Cloak","Mandarin","Hank-Thompson","Korath-the-Pursuer","Ant-Man","Micro","The-Patriot","The-Tinkerer","Quicksilver","Scarlet-Witch","The-Calvary","Daredevil","Agent-33","Spider-Man","Deathlok","Ant-Man","Star-Lord","Nova-Prime","Ghost-Rider","War-Machine","Iron-Patriot","Yo-Yo","Captain-America","Black-Widow","Ronan-the-Accuser","Crossbones","Red-Skull","Blacksmith","Shocker","The-Executioner","The-Manderin","Iron-Monger","Iron-Man","Cottonmouth","Pistol-Pete","Doctor-Strange","Diamondback","Black-Panther","Kilgrave","The-Collector","Wasp","Whiplash","Patsy","Falcon"];
	 var result = characters[Math.floor(Math.random()*characters.length)];
	 result += "-" + Math.floor(Math.random()*10000);
	 return result.toUpperCase();
  }
