// This should check whether a video is currently played and change the title accordingly

var supportedSites = ['youtube', 'vimeo', 'netflix'];

var titlePrefix = "Playing ~ ";
var oldPrefix = titlePrefix;

var playerStatus = false;
var oldPlayer = playerStatus;

/*
 * init()
 * Initialize script
 */
function init() {
  console.log("Starting video_detect.js");
  onSettingChanged();
  browser.storage.onChanged.addListener(onSettingChanged);
  initPlayer();
}

/*
 * initPlayer()
 * Check if a player exists on site.
 * Function reschedules itself periodically until a player is found.
 * @TODO: rethink this concept. could this be event-based?
 */
function initPlayer() {
  console.log("checking player status...");
  oldPlayer = playerStatus;
  var player = getPlayer();
  playerStatus = (player != null);

  if (playerStatus) {
    console.log("setting status handlers");
    initListeners(player);
  } else if (!playerStatus) {
    console.log("no player found. rescheduling");
    setTimeout(initPlayer, 1000);
  }
}

/*
 * getPlayer()
 * Return the current video player object, or null if none is found
 */
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

/*
 * setTitle(bool)
 * Add or remove the current Tab's title prefix, depending on parameter
 */
function setTitle(playing) {
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

/*
 * getSiteName()
 * Return a string for each supported site
 */
function getSiteName(url) {
  var i;
  for (i = 0; i < supportedSites.length; i++) {
    if (url.includes(supportedSites[i])) {
      return supportedSites[i];
    }
  }
  return "other";
}


/*
 * initListeners()
 * Set EventListeners for the loaded video player
 */
function initListeners(player) {
  // install listeners for video play/paused
  if (player != null) {
    player.addEventListener("pause", onPause);
    player.addEventListener("play", onPlay);
    player.addEventListener("loadeddata", onPlayerReload);
    setPlayerChangeHandler();
    console.log("Set status listeners");
    if (!player.paused) {
      // if player is already running
      onPlay();
    }
  } else {
    console.log("invalid player");
  }
}

/*
 * videoRunning()
 * Return true if video is running in current player, false otherwise
 */
function videoRunning() {
  var player = getPlayer();
  if (player != null) {
    return !player.paused;
  }
  return false;
}

//
// CALLBACK HANDLER
//

/*
 * onPause()
 * Callback handler for video player pause event.
 */
function onPause() {
  console.log("video paused");
  setTitle(false);
}

/*
 * onPlay()
 * Callback handler for video player play event.
 */
function onPlay() {
  console.log("video playing");
  setTitle(true);
}


function onError(e) {
  console.log("Error: " + e);
}

/*
 * onSettingChanged()
 * Event handler for settings changes event.
 */
function onSettingChanged() {

  function applySetting(pref) {
    if (pref.modifier) {
      titlePrefix = pref.modifier;
      setTitle(videoRunning());
    }
  }

  console.log("preferences changed");
  browser.storage.local.get("modifier")
    .then(applySetting, onError);
}

/*
 * onPlayerReload()
 * Event handler for a player-internal reload.
 * This happens e.g. on youtube if autoplay is active.
 * This handler is used to detect a new autoplaying video.
 * @TODO: check if there is a way to catch event on when title is set.
 */
function onPlayerReload() {
  var player = getPlayer();
  if (!player.paused) {
    console.log("autostart detected");
    setTimeout(onPlay, 500); // hacky hack: site name might not be fully loaded when video is loaded, wait a bit
  }
}


/*
 * mutationHandler()
 * Handle a mutation event.
 * In case the player's src attribute has changed, reinit the player by calling initPlayer.
 */
function mutationHandler(mutationList, observer) {
  console.log("data mutation observed!");
  
  for (let mutation of mutationList) {
    if (mutation.type == 'attributes') {
      console.log(mutation.attributeName + " changed.");
      if (mutation.attributeName == "src") {
        initPlayer();
      }
    } else {
      console.log("weird other thing changed");
    }
  }
}

/*
 * setPlayerChangedHandler()
 * Set up event handler for current player
 * to trigger when the player's attributes have changed.
 */
function setPlayerChangeHandler() {
  const player = getPlayer();
  const config = { attributes: true };

  const observer = new MutationObserver(mutationHandler);
  observer.observe(player, config);
}

init();
