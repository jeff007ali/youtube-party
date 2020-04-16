// This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// This function creates an <iframe> (and YouTube player)
// after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    // videoId: videoId,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onPlaybackRateChange': onPlayerPlaybackRateChange
    }
  });
}

// The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.playVideo();
}

// The API calls this function when the player's state changes.
var done = false;
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {

    // setTimeout(stopVideo, 6000);
    // done = true;
  }
}
function onPlayerPlaybackRateChange(event) {
  // broadcast_data();
}


// webRTC
var peer_ids = [];
var connections = [];
var status = document.getElementById("status");
var connection_status = false;
var sendMessageBox = document.getElementById("sendMessageBox");
var sendButton = document.getElementById("sendButton");
var message = document.getElementById("message");

var peer = new Peer();
connect_to_peer("vk6sr92c4h000000");

peer.on("connection", function(conn) {
  handle_connection(conn);
});

sendButton.onclick = function() {
  if (connection_status) {
    var msg = sendMessageBox.value;
    sendMessageBox.value = "";
    for (var i = 0; i < connections.length; i++) {
      connections[i].send(msg);
    }
    console.log("Sent: " + msg);
    addMessage('<span class="selfMsg">Self: </span>' + msg);
  } else {
    console.log("Connection is closed");
  }
};

function addMessage(msg) {
  var now = new Date();
  var h = now.getHours();
  var m = addZero(now.getMinutes());
  var s = addZero(now.getSeconds());

  if (h > 12) h -= 12;
  else if (h === 0) h = 12;

  function addZero(t) {
    if (t < 10) t = "0" + t;
    return t;
  }

  message.innerHTML =
    '<br><span class="msg-time">' +
    h +
    ":" +
    m +
    ":" +
    s +
    "</span>  -  " +
    msg +
    message.innerHTML;
}

function connect_to_peer(peer_id) {
  var conn = peer.connect(peer_id);
  handle_connection(conn);
}

function handle_connection(conn) {
  console.log("Handle connection called");
  peer_ids.push(conn.peer);
  connection_status = true;
  conn.on("data", function(data) {
    console.log(data);
    // debugger;
    addMessage(data);
    if (typeof data === "object" && data !== null) {
      if (data.type == "new_connection") {
        connect_to_peer(data.peer_id);
      }
      else if (data.type == "event_data") {
        var payload = data.payload;
        if (payload.event == -1) {
          player.loadVideoById(payload.videoId, payload.startSeconds);
          player.playVideo();
        }
        
      }
    }
    console.log("Data Received");
    console.log(data);
  });

  conn.on("close", function() {
    // TODO remove peer id from list
    status.innerHTML = "Connection reset<br>Awaiting connection...";
    conn = null;
    connection_status = false;
  });
  connections.push(conn);
}
