// This should check whether a video is currently played and change the title accordingly

var titlePrefix = "Playing ~ ";
var oldPrefix = titlePrefix;

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
      console.log("some prefix detected");
      var re = titlePrefix + "|" + oldPrefix;
      console.log("regex:" + re);
      reg = new RegExp(re, "g");
      document.title = document.title.replace(reg, "");
    }
  }
  oldPrefix = titlePrefix;
}

function getStatus() {
  // determine status of video player on different websites
  var playstatus = false
  var site = document.URL
  console.log("On site: " + site);

  if (site.includes("youtube")) {
    // youtube-specific
    
    var player =  document.getElementById("movie_player")
    if (player == null) {
      console.log("no youtube player detected");
    } else {
      playstatus = (player.className.includes("playing-mode")) && (!player.className.includes("unstarted-mode")); 
    }
  } else if (site.includes("vimeo")) {

    // vimeo-specific
    var controls = document.getElementsByClassName("vp-controls-wrapper");
    if (controls.length == 0) {
      console.log("no vimeo player detected");
    } else {
      controls = controls[0];
      var button = controls.getElementsByTagName("button")[0];
      playstatus = button.className.includes("playing");
    } 
  } else if (site.includes("netflix")) {
    console.log("on netflix!");
    var controls = document.getElementsByClassName("PlayerControlsNeo__button-control-row");
    if (controls.length == 0) {
      console.log("no netflix player detected");
    } else {
      controls = controls[0];
      if (controls.querySelector('[aria-label="Play"]') != null) {
        console.log("netflix is paused");
      } else if (controls.querySelector('[aria-label="Pause"]') != null) {
        playstatus = true;
        console.log("netflix is playing");
      } else {
        colsole.log("no button found");
      }
    }
  } else {
    console.log("unknown site");
  }

  setTitle(playstatus);
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
  browser.storage.local.get("modifier")
    .then(onRun, onError)
}

console.log("Starting video_detect.js");
onPrefTout();
setInterval(onPrefTout, 5000);
setInterval(getStatus, 1000);


