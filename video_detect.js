// This should check whether a video is currently played and change the title accordingly
// plan: querySelect the element and add a onChanged listener to it!

var supportedSites = ['youtube', 'vimeo', 'netflix'];

var titlePrefix = "Playing ~ ";
var oldPrefix = titlePrefix;

var playerStatus = false;
var oldPlayer = playerStatus;

function setTitle(playing) {
  // Set the window's title depending on bool playing
  if (playing) {
    if (!document.title.startsWith(titlePrefix) && !document.title.startsWith(oldPrefix)) {
      document.title = titlePrefix + document.title;
    } else if (document.title.startsWith(oldPrefix)) {
      document.title = document.title.replace(oldPrefix, titlePrefix);
    }
  } else {
    console.log("stopped video");
    if (document.title.startsWith(titlePrefix) || document.title.startsWith(oldPrefix)) {
      reg = new RegExp(titlePrefix + "|" + oldPrefix, "g");
      document.title = document.title.replace(reg, "");
    }
  }
  oldPrefix = titlePrefix;
}

function getSiteName(url) {
  var i;
  for (i = 0; i < supportedSites.length; i++) {
    if (url.includes(supportedSites[i])) {
      return supportedSites[i];
    }
  }
  return "other";
}

function getPlayer() {
  var player = null;
  switch (getSiteName(document.URL)) {
    case "youtube": {
      if (document.getElementById("movie_player") != null) {
        player = document.getElementById("movie_player").querySelector('video');
      }
    } break;
    case "vimeo": {
      if (document.getElementsByClassName("vp-controls-wrapper").length != 0) {
        player = document.querySelector('div[class^="player "]').querySelector('video');
      }
    } break;
    case "netflix": {
      if (document.getElementsByClassName("PlayerControlsNeo__button-control-row").length != 0) {
        player = document.querySelector('div[class^="VideoContainer"]').querySelector('video');
      }
    } break;
    default: console.log("invalid site");
  }
  return player;
}

function getPlayerStatus() {
  console.log("checking player status...");
  oldPlayer = playerStatus;
  var player;
  switch (getSiteName(document.URL)) {
    case "youtube": {
      player =  document.getElementById("movie_player");
      if (player == null) {
        console.log("no youtube player detected");
        playerStatus = true;
      } else {
        player = document.getElementById("movie_player").querySelector('video');
        playerStatus = true;
      }
    } break;
    case "vimeo": {
      player = document.getElementsByClassName("vp-controls-wrapper");
      if (player.length == 0) {
        console.log("no vimeo player detected");
        playerStatus = false;
      } else {
        player = document.querySelector('div[class^="player "]').querySelector('video');
        playerStatus = true;
      }
    } break;
    case "netflix": {
      player = document.getElementsByClassName("PlayerControlsNeo__button-control-row");
      if (player.length == 0) {
        console.log("no netflix player detected");
        playerStatus = false;
      } else {
        player = document.querySelector('div[class^="VideoContainer"]').querySelector('video');
        playerStatus = true;
        console.log("found player");
      }
    } break;
    default: console.log("invalid site");
  }

  if (playerStatus && !oldPlayer) {
    console.log("setting status handlers");
    setStatusHandler(player);
  } else if (!playerStatus) {
    console.log("no player found. rescheduling");
    setTimeout(getPlayerStatus, 1000);
  }

}

function setStatusHandler(player) {
  // install listeners for video play/paused
  if (playerStatus) {
    player.addEventListener("pause", onPause);
    player.addEventListener("play", onPlay);
  }
  player.addEventListener("loadeddata", onEvent);
  console.log("Set status listeners");
}

function onPause() {
  console.log("video paused");
  setTitle(false);
}

function onPlay() {
  console.log("video playing");
  setTitle(true);
}

function onRun(pref) {
  // set titlePrefix and run script
  if (pref.modifier) {
  titlePrefix = pref.modifier;
  }
}

function onError(e) {
  console.log("Error: " + e);
}

function onPrefTout() {
  console.log("preferences changed");
  browser.storage.local.get("modifier")
    .then(onRun, onError)
}

function onEvent() {
  console.log("An event has occurred!");

  var player = getPlayer();
  if (player.paused) {
    console.log("no autostart");
  } else {
    console.log("autostart detected");
    setTimeout(onPlay, 200);
  }

}

function init() {
  // initlialize stuff

}


console.log("Starting video_detect.js");
onPrefTout();
browser.storage.onChanged.addListener(onPrefTout);
getPlayerStatus();

