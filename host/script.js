// This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// This function creates an <iframe> (and YouTube player)
// after the API code downloads.
var videoId = 'Dg0IjOzopYU';

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: videoId,
    playerVars: {
      autoplay: 1
    },
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
// var done = false;
function onPlayerStateChange(event) {
  console.log("Playlist index on state change is: " + event.data);
  if (event.data == YT.PlayerState.PLAYING || event.data == YT.PlayerState.PAUSED || event.data == YT.PlayerState.BUFFERING) {
    broadcast_data();
  }
}

function onPlayerPlaybackRateChange(event) {
  broadcast_data(null, true);
}

// function stopVideo() {
//   player.stopVideo();
// }



// webRTC
var status = document.getElementById("status");

var peer_ids = [];
var connections = [];
var lastPeerId = null;
var connection_status = false;
var sendMessageBox = document.getElementById("sendMessageBox");
var sendButton = document.getElementById("sendButton");
var message = document.getElementById("message");

var peer = new Peer({ debug: 2 });
//  creates an ID
// Workaround for peer.reconnect deleting previous id

peer.on("open", function(id) {
  if (peer.id === null) {
      console.log("Received null id from peer open");
      peer.id = lastPeerId;
  } else {
      lastPeerId = peer.id;
  }
  console.log("ON");
  console.log("My peer ID is: " + peer.id);
  alert(peer.id);
});

//   Initializes connection
peer.on("connection", function(conn) {
  handle_connection(conn);
});

peer.on("disconnected", function() {
  status.innerHTML = "Connection lost. Please reconnect";
  console.log("Connection lost. Please reconnect");
  // Workaround for peer.reconnect deleting previous id
  peer.id = lastPeerId;
  peer._lastServerId = lastPeerId;
  peer.reconnect();
});

peer.on("close", function() {
  conn = null;
  status.innerHTML = "Connection destroyed. Please refresh";
  console.log("Connection destroyed");
});

peer.on("error", function(err) {
  console.log(err);
  alert("" + err);
});

function handle_connection(conn) {
  console.log(conn);
  peer_ids.push(conn.peer);
  connection_status = true;
  conn.on("data", function(data) {
      addMessage(data);

      console.log("Data Received");
      console.log(data);
  });

  conn.on("close", function() {
      status.innerHTML = "Connection reset<br>Awaiting connection...";
      conn = null;
      connection_status = false;
      start(true); //ゴゴゴゴ?
  });

  connections.push(conn);
  conn.send("kuch bhi")
  setTimeout(function() {broadcast_data(conn, false);}, 500);
  broadcast_new_connection(conn.peer);
}

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

function broadcast_new_connection(peer_id) {
  msg = { type: "new_connection", peer_id: peer_id };
  for (var i = 0; i < connections.length; i++) {
      if (connections[i].peer == peer_id) {
      continue;
      }
      connections[i].send(msg);
  }
}

function fetch_current_video_status(isPlayback) {
  yt_event = player.getPlayerState();
  if (isPlayback){
    yt_event = -7;
  }
  else {
    yt_event = player.getPlayerState();
  }
  videoId = videoId;
  startSeconds = player.getCurrentTime();
  playbackRate = player.getPlaybackRate();

  var payload = {
    "event" : yt_event,
    // "state" : "start",
    "videoId": videoId,
    "startSeconds": startSeconds,
    "playbackRate": playbackRate
  };

  return payload;
}

function broadcast_data(conn=null, isPlayback=false) {
  console.log(conn);
  payloadData = fetch_current_video_status(isPlayback);
  msg = { type: "event_data", payload: payloadData };

  if (conn !== null) {
    conn.send(msg);
  }
  else {
    for (var i = 0; i < connections.length; i++) {
      connections[i].send(msg);
    }
  }
  
}