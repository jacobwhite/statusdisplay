const url = 'ws://172.16.1.186:8080'
const connection = new WebSocket(url)

var msg = {
	type: "message",
	status: "Free",
	name: "Door Display",
	date: Date.now()
}

connection.onopen = () => {
  connection.send(JSON.stringify(msg));
}
 
connection.onerror = (error) => {
  console.log(`WebSocket error:`,error)
}
 
connection.onmessage = (e) => {
  console.log(e.data)
}
