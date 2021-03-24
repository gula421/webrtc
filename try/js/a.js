// html elements
var msgSoFar = '';
const h2 = document.getElementById('history');
const msg = document.getElementById('msg');
const btn = document.querySelector('button');
const id = document.getElementById('id');
const status = document.getElementById('status');
const videoLocal = document.getElementById('videoLocal');
const btnCall = document.getElementById('btnCall');
const videoRemote = document.getElementById('videoRemote');

// eventListener
btn.addEventListener('click', setSendText);
btnCall.addEventListener('click', startCall);

// peer connetion
var peer = null; // own peer object
var conn = null; // connection
var lastId = null;
var currentMsg = '';

// video
const constraints = window.constraints = {
	audio: true,
	video: true};


// prepare message history
function setSendText(){
	if (msg){
		// debugger;
		currentMsg = 'A: '+ msg.value + '</br>';
		msgSoFar += currentMsg;
		h2.innerHTML = `<p>${msgSoFar}</p>`;
	} 
	// send text
	conn.send(currentMsg);
	console.log('send: '+currentMsg);
}

function addReceivedMessage(message){
	if (message) {
		msgSoFar = msgSoFar + message;
		h2.innerHTML = `<p>${msgSoFar}</p>`;
	}
}

function initialize(){
	// Create own peer object with connection to shared PeerJS server
	peer = new Peer(null, {debug: 2});

	// set Id when it's open
	peer.on('open', getMyId);

	// connect
	peer.on('connection', handleConnection);

	// reconnect if disconnect
	peer.on('disconnected', function(){
		console.log('Disconnected');
		// Workaround for peer.reconnect deleting previous id
		peer.id = lastId;
		peer._lastServerID = lastId;
		peer.reconnect();

	});

	// close connection
	peer.on('close', function(){
		conn = null;
		console.log('Connetion closed');
	});

	// error
	peer.on('error', function(err){
		console.log('Error: '+ err)
	});

}

function getMyId(event){
	if (peer.id === null) {
		console.log('null peer.id. reconnect to '+lastId);
		peer.id = lastId;
	} else {
		lastId = peer.id;
	}
	console.log('event: '+event);
	id.innerText = "id: "+ peer.id;
}

function handleConnection(connection){
	// allow only a single connection
	// if old connection existed
	if (conn && conn.open) {
		connection.on('open', function(){
			connection.send("Already connected to another client");
			setTimeout(function(){connection.close();}, 500);
		})
		return;
	}

	// start new connection
	conn = connection;
	console.log('connected to: '+ conn.peer);
	status.innerText = 'connected to: '+ conn.peer;

	// handle received data (message)
	conn.on('data', addReceivedMessage); 

	conn.on('close', function(){
		console.log('Connection reset. Awaiting connection...');
		conn = null; 
	})

}

async function startCall(){
	// get local mediaStream
	const localStream = await navigator.mediaDevices.getUserMedia(constraints);
	// set local video
	videoLocal.srcObject = localStream;
	window.stream = localStream;
	console.log('localStream: '+ localStream);

	// start call - send stream
	var call = peer.call(conn.peer, localStream);

	// handle received stream
	call.on('stream', handleRemoteVideo);
}

function handleRemoteVideo(stream){
	videoRemote.srcObject = stream;
	console.log('received remote stream');
}


initialize();

