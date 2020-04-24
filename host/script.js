// This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// This function creates an <iframe> (and YouTube player)
// after the API code downloads.
var videoId = 'sAKjyRs-n34';
var isStateChangeFromBroadcastData = false;

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
    broadcast_data(null, "playbackRateChange");
  // }
  // isStateChangeFromBroadcastData = false;
}

// function stopVideo() {
//   player.stopVideo();
// }



// webRTC
var status = document.getElementById("status");

var own_id;
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

  own_id = peer.id;
  console.log("ON");
  console.log("My peer ID is: " + peer.id);
  createInviteLink(peer.id);
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
      // player.removeEventListener('onStateChange');
      if (typeof data === "object" && data !== null) {
        if (data.type == "event_data") {
          var payload = data.payload;
          console.log("received state  is: " + payload.event);
          // videoId = payload.videoId;
          // function onYouTubeIframeAPIReady() {
          isStateChangeFromBroadcastData = true;
          if (payload.event == 2) {
            // isStateChangeFromBroadcastData = true;
            player.seekTo(payload.startSeconds, true)
            player.pauseVideo();
          }
          else if (payload.event == 1) {
            // isStateChangeFromBroadcastData = true;
            player.seekTo(Math.ceil(payload.startSeconds), true)
            player.playVideo();
          }
          else if (payload.event == 3) {
            // isStateChangeFromBroadcastData = true;
            player.seekTo(payload.startSeconds, true)
            player.pauseVideo();
          }
          else if (payload.event == "playbackRateChange") {
            player.seekTo(payload.startSeconds, true)
            player.setPlaybackRate(payload.playbackRate);
          }
          // else if (payload.event == "newStart") {
          //   player.loadVideoById(payload.videoId);
          //   player.playVideo();
          // }
          
        }
      }
      // player.addEventListener('onStateChange', 'onPlayerStateChange');
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
  setTimeout(function() {broadcast_data(conn, null);}, 500);
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


// To make invite link
var invite_link = document.getElementById('invite_id');
var copy_link_btn = document.getElementById('copy_link_btn');

copy_link_btn.onclick = function() {
  var invite_link = document.getElementById('invite_id');
  invite_link.select();
  try {
    var successful = document.execCommand("copy");
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }
}

function createInviteLink(host_id) {
  var curr_url = window.location.href;
  var split_url = curr_url.split("/");

  split_url[split_url.length - 2] = "client";

  var client_url = split_url.join('/') + "?host_id=" + host_id;
  invite_link.value = client_url;

}


// To play new video
function fetchVideoIdFromUrl(url) {
  console.log(url);
  var regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  var match = url.match(regExp);
  console.log(match);
  if (match && match[2].length === 11) {
    return match[2];
  } else {
    return false;
  }
}

var load_video_btn = document.getElementById('load_video_btn');
var video_url_txt = document.getElementById('video_url_txt');

load_video_btn.onclick = function () {
  var url = video_url_txt.value;
  var vidId = fetchVideoIdFromUrl(url);

  if (vidId != false) {
    videoId = vidId;
    player.loadVideoById(videoId);
    player.playVideo();

    broadcast_data(null, "newStart");
  }
}