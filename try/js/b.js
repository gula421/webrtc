// html elements
var msgSoFar = '';
const h2 = document.getElementById('history');
const msg = document.getElementById('msg');
const btnConnect = document.getElementById('btnConnect');
const btnSend = document.getElementById('btnSend');
const idToConnect = document.getElementById('idToConnect');
const videoLocal = document.getElementById('videoLocal');
const videoRemote = document.getElementById('videoRemote');
const status = document.getElementById('status');

btnSend.addEventListener('click', setSendText);
btnConnect.addEventListener('click', join);

// peer connection
var lastId = null;
var peer = null;
var conn = null;
var currentMsg = '';
var localStream = null;

// video
const constraints = window.constraints = {
	audio: true,
	video: true};

// prepare message history
function setSendText(){
	if (msg){
		// debugger;
		currentMsg = 'B: '+ msg.value + '</br>';
		msgSoFar = msgSoFar + currentMsg;
		h2.innerHTML = `<p>${msgSoFar}</p>`;
	} 
	// send text
	conn.send(currentMsg);
	console.log('send: '+currentMsg);

	// clear current text
	msg.value = '';
}

function addReceivedMessage(message){
	// stop call
	if (message ===conn.peer+'stopCall'){
		const tracks = localStream.getTracks();

		tracks.forEach(function(track) {
		    track.stop();
		});

		videoLocal.srcObject = null;
		videoRemote.srcObject = null;
	} else if(message){ // normal message
		msgSoFar =msgSoFar +  message;
		h2.innerHTML = `<p>${msgSoFar}</p>`;
	}
	
}

function initialize(){
	peer = new Peer(null, {debug:2});

	// get peerId
	peer.on('open', getMyId);

	// received call
	peer.on('call', handleStream);
}

async function handleStream(call){
	// get local medaiStream
	localStream = await navigator.mediaDevices.getUserMedia(constraints);

	// set local video
	videoLocal.srcObject = localStream;
	window.stream = localStream;
	console.log('localStream: '+ localStream);
	
	// Answer the call, providing our mediaStream
	call.answer(localStream);

	// handle received stream
	call.on('stream', handleRemoteVideo);
}

function handleRemoteVideo(stream){
	videoRemote.srcObject = stream;
	console.log('received remote stream');
}


function getMyId(id){
	console.log('id of B: '+id);
}

function join(){
	// close old connections
	if (conn) {
		conn.close();
	}
	// debugger;
	// initialize connection
	conn = peer.connect(idToConnect.value, {reliable: true});

	// handle connection
	conn.on('open', function(){
		console.log('connected');
		status.innerText = 'connected to: ' + conn.peer;
	})

	conn.on('data', addReceivedMessage);
	conn.on('close', function(){
		console.log('close connection');
		conn = null;
	});	
}

initialize();



