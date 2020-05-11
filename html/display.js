var url = 'ws://'+location.hostname + ":8080";
var connection = new WebSocket(url);

var updateSound = new Audio("alarm02.mp3");
updateSound.volume = 0.9;
var coffeeSound = new Audio("alarm03.mp3");
coffeeSound.volume = 0.05;

window.addEventListener('resize', update);

function clickName(){
    console.log("clicked");
    toggle($('#displaySpan'));
    toggle($('#displayName'));
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
			height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
		}
		connection.send(JSON.stringify(response));
		window.lastTime = now;
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
			date: Date.now()
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
	console.log("connecting...");

	connection.onopen = function(e){
		register();
	}
	

	connection.onclose = function(e){
		console.log("socket closed, reconnecting in 1 second. ", e.reason);
		connection.onopen = null;
		//$("#connectButton").show();
		setTimeout(function() {
			connect();
		}, 1000);
	};
	 
	connection.onerror = function(error) {
	  console.log("WebSocket error:",error)
	}
	 
	connection.onmessage = function(e) {
    $('#displayNameLabel').text(localStorage.displayName);
		console.log(e.data)
		var message = JSON.parse(e.data);
		if(message.type == 'status'){
			if(message.status == "Send Coffee" || message.color == "red"){
				coffeeSound.play();
			}	
			else {
				updateSound.play();
			}
			if(message.status == "Off"){
				message.status = "";
			}
			$("#status").fadeOut(function() {
			  $(this).text(message.status).fadeIn().fadeOut().fadeIn();
			});

			localStorage.status = message.status;
			$(document.body).animate({
				backgroundColor: message.color
			});
			localStorage.color=message.color;
			if(message.status == "Exercising"){
				$('body').css('marginTop', '20px');
				$('#exercise').show();
				if(document.getElementById('exercise').getAttribute('src') == ""){
					document.getElementById('exercise').setAttribute('src', "https://photar.net/truepoints/embedded/");
				}
			}
			else {
				document.getElementById('exercise').setAttribute('src', "");
				$('#exercise').hide();
				$('body').css('marginTop', '200px');
			}
			update(message);
		}
		else if(message.type == "getStatus"){
			update();
		}
	}
}
//connect();
