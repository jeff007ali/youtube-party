// This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// This function creates an <iframe> (and YouTube player)
// after the API code downloads.
var videoId;
var isStateChangeFromBroadcastData = false;

var player;
// function onYouTubeIframeAPIReady() {
//   player = new YT.Player('player', {
//     height: '390',
//     width: '640',
//     // videoId: videoId,
//     events: {
//       'onReady': onPlayerReady,
//       'onStateChange': onPlayerStateChange,
//       'onPlaybackRateChange': onPlayerPlaybackRateChange
//     }
//   });
// }

// The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.playVideo();
}

// The API calls this function when the player's state changes.
var done = false;
function onPlayerStateChange(event) {
  console.log("Playlist index on state change is: " + event.data);
  console.log("state of flag : " + isStateChangeFromBroadcastData);
  if (!isStateChangeFromBroadcastData) {
    if (event.data == YT.PlayerState.PLAYING || event.data == YT.PlayerState.PAUSED || event.data == YT.PlayerState.BUFFERING) {
      broadcast_data();
    }
  }
  if (event.data != YT.PlayerState.BUFFERING && isStateChangeFromBroadcastData) {
    isStateChangeFromBroadcastData = false;
  }
}
function onPlayerPlaybackRateChange(event) {
  // if (!isStateChangeFromBroadcastData) {
  //   broadcast_data(null, "playbackRateChange");
  // }
  // isStateChangeFromBroadcastData = false;
}


// webRTC
var peer_ids = [];
var connections = [];
var status = document.getElementById("status");
var connection_status = false;
var sendMessageBox = document.getElementById("sendMessageBox");
var sendButton = document.getElementById("sendButton");
var message = document.getElementById("message");
var query_params = new URLSearchParams(window.location.search);

var peer = new Peer();
var host_id = query_params.get('host_id');
connect_to_peer(host_id);

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
        videoId = payload.videoId;
        console.log("received state  is: " + payload.event);
        // function onYouTubeIframeAPIReady() {
        if (player == null){
          player = new YT.Player('player', {
            height: '390',
            width: '640',
            videoId: payload.videoId,
            playerVars: {
              autoplay: 1,
              start: Math.ceil(payload.startSeconds),
              controls: 0
            },
            events: {
              'onReady': onPlayerReady,
              'onStateChange': onPlayerStateChange,
              'onPlaybackRateChange': onPlayerPlaybackRateChange
            }
          });

          // setTimeout(function() {player.setPlaybackRate(payload.playbackRate);}, 500);
        }
        else {
          // player.removeEventListener('onStateChange');
          isStateChangeFromBroadcastData = true;
          // isStateChangeFromBroadcastData = true;
          if (payload.event == 2) {
            // isStateChangeFromBroadcastData = true;
            player.seekTo(Math.ceil(payload.startSeconds), true);
            player.pauseVideo();
          }
          else if (payload.event == 1) {
            // isStateChangeFromBroadcastData = true;
            player.seekTo(Math.ceil(payload.startSeconds), true);
            player.playVideo();
          }
          else if (payload.event == 3) {
            // isStateChangeFromBroadcastData = true;
            player.seekTo(Math.ceil(payload.startSeconds), true);
            player.pauseVideo();
          }
          else if (payload.event == "playbackRateChange") {
            // isStateChangeFromBroadcastData = true;
            player.seekTo(Math.ceil(payload.startSeconds), true)
            player.setPlaybackRate(payload.playbackRate);
          }
          else if (payload.event == "newStart") {
            // isStateChangeFromBroadcastData = true;
            player.loadVideoById(payload.videoId);
            player.playVideo();
          }
        }
         
        // player.addEventListener('onStateChange', 'onPlayerStateChange');
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

function fetch_current_video_status(event) {
  var yt_event;
  if (event != null){
    yt_event = event;
  }
  else {
    yt_event = player.getPlayerState();
  }
  // var videoId = videoId;
  var startSeconds = player.getCurrentTime();
  var playbackRate = player.getPlaybackRate();

  var payload = {
    "event" : yt_event,
    // "state" : "start",
    "videoId": videoId,
    "startSeconds": startSeconds,
    "playbackRate": playbackRate
  };

  return payload;
}

function broadcast_data(conn=null, event=null) {
  // console.log(conn);
  payloadData = fetch_current_video_status(event);
  console.log("Sent state : " + payloadData.event);
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