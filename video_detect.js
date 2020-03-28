// This should check whether a video is currently played and change the title accordingly
// plan: querySelect the element and add a onChanged listener to it!

var titlePrefix = "Playing ~ ";
var oldPrefix = titlePrefix;

var playStatus = false;
var oldStatus = playStatus;

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

function getYoutubeStatus() {
  // youtube-specific
  console.log("getting youtube status"); 
  var player =  document.getElementById("movie_player")
  if (player == null) {
    console.log("no youtube player detected");
    return;
  } else {
    console.log("fetching video status");
    playStatus = (player.className.includes("playing-mode")) && (!player.className.includes("unstarted-mode")); 
  }
}

function getVimeoStatus() {
  // vimeo-specific

  var controls = document.getElementsByClassName("vp-controls-wrapper");
  if (controls.length == 0) {
    console.log("no vimeo player detected");
    return;
  } else {
    controls = controls[0];
    var button = controls.getElementsByTagName("button")[0];
    playStatus = button.className.includes("playing");
  } 
}

function getNetflixStatus() {
  // netflix-specific

  console.log("on netflix!");
  var controls = document.getElementsByClassName("PlayerControlsNeo__button-control-row");
  if (controls.length == 0) {
    console.log("no netflix player detected");
    return;
  } else {
    controls = controls[0];
    if (controls.querySelector('[aria-label="Play"]') != null) {
      playStatus = false;
      console.log("netflix is paused");
    } else if (controls.querySelector('[aria-label="Pause"]') != null) {
      playStatus = true;
      console.log("netflix is playing");
    } else {
      colsole.log("no button found");
    }
  }
}

function getStatus() {
  // determine status of video player on different websites
  //var playStatus = false;
  var site = document.URL;
  console.log("On site: " + site);
  oldStatus = playStatus;

  if (site.includes("youtube")) {
    getYoutubeStatus();
  } else if (site.includes("vimeo")) {
    getVimeoStatus();
  } else if (site.includes("netflix")) {
    getNetflixStatus();
  } else {
    console.log("unknown site");
  }
  
  if (oldStatus != playStatus) {
     setTitle(playStatus);
  }
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

console.log("Starting video_detect.js");
onPrefTout();
browser.storage.onChanged.addListener(onPrefTout);
setInterval(getStatus, 1000);


