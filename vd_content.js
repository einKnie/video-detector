// This should check whether a video is currently played and change the title accordingly
// @TODO: fix suspend setting propagation: find _one_ way to do this, and the stick to that.

videoDetector = function() {

  // supported websites
  const sites = {
    YOUTUBE: "youtube",
    VIMEO:   "vimeo",
    NETFLIX: "netflix",
    ORF:     "orf",
    VIVO:    "vivo"
  };

  // 'globals'
  var prefixDefault = "Playing ~ ";
  var currPrefix    = prefixDefault;
  var lastPrefix    = currPrefix;
  var isSuspended   = false;

  // create observer here so we can access it at different times
  const observer = new MutationObserver(mutationHandler);

  // video player object
  var player = null;

  // start script execution
  init();

  /*
   * init()
   * Initialize script
   */
  function init() {
    console.log("Starting content script");
    browser.storage.onChanged.addListener(onSettingChanged);
    browser.runtime.onMessage.addListener(handleMessage);
    // need to make sure that settings are applied prior to initializing player
    initSettings()
      .then(initPlayer);
  }


  /*
   * initPlayer()
   * Check if a player exists on site.
   * Function reschedules itself periodically until a player is found.
   * @TODO: rethink this concept. could this be event-based?
   */
  function initPlayer() {
    console.log("checking player status...");

    if (player != null) {
      // cleanup old player
      console.log("Cleaning up old player");
      setListeners(false);
      player = null;
    }

    player = getPlayer();
    if (player != null) {
      console.log("player found");
      if (!isSuspended) {
        setListeners(true);
      }
    } else {
      setTimeout(initPlayer, 1000);
    }
  }


  /*
   * getPlayer()
   * Return the current video player object, or null if none is found
   */
  function getPlayer() {
    console.log("in getPlayer()");
    if (player != null) {
      // cleanup old player
      console.log("Cleaning up old player");
      setListeners(false);
      player = null;
    }

    switch (getSite(document.URL)) {
      case sites.YOUTUBE: {
        if (document.getElementById("movie_player") != null) {
          player = document.getElementById("movie_player").querySelector("video");
        }
      } break;
      case sites.VIMEO: {
        if (document.getElementsByClassName("vp-controls-wrapper").length != 0) {
          player = document.querySelector("div[class^='player']").querySelector("video");
        }
      } break;
      case sites.NETFLIX: {
        if (document.getElementsByClassName("PlayerControlsNeo__button-control-row").length != 0) {
          player = document.querySelector("div[class^='VideoContainer']").querySelector("video");
        }
      } break;
      case sites.ORF: {
        if (document.getElementsByClassName("video_wrapper").length != 0) {
          player = document.querySelector("div[class^='video_wrapper']").querySelector("video");
        }
      } break;
      case sites.VIVO: {
        if (document.getElementsByClassName("plyr").length != 0) {
          player = document.querySelector("div[class^='plyr']").querySelector("video");
        }
      } break;
      default: console.log("invalid site");
    }
    return player;
  }


  /*
   * setTitle(bool)
   * Add or remove the current tab's title prefix, depending on parameter
   */
  function setTitle(playing) {
    if (playing) {
      if (!document.title.startsWith(currPrefix) && !document.title.startsWith(lastPrefix)) {
        document.title = currPrefix + document.title;
      } else if (document.title.startsWith(lastPrefix)) {
        document.title = document.title.replace(lastPrefix, currPrefix);
      }
    } else {
      var re = RegExp(`^(${fixRegex(currPrefix)})|^(${fixRegex(lastPrefix)})`, "g");
      if (re.exec(document.title) != null) {
        document.title = document.title.replace(re, "");
      }
    }
    lastPrefix = currPrefix;
  }


  /*
   * getSite(string)
   * Return the name of the site, or 'other' if the site is not supported
   */
  function getSite(url) {
    for (site in sites) {
      if (sites.hasOwnProperty(site)) {
        if (url.includes(sites[site])) {
          return sites[site];
        }
      }
    }
    return "other";
  }


  /*
   * setListeners()
   * Enable or disable player event monitoring
   */
  function setListeners(on) {
    // install listeners for video play/paused
    if (player != null) {
      if (on) {
        player.addEventListener("pause", onPause);
        player.addEventListener("play", onPlay);
        player.addEventListener("loadeddata", onPlayerReload);
        setPlayerChangeHandler(true);
        console.log("Set status listeners");
        if (!player.paused) {
          // if player is already running
          onPlay();
        }
      } else {
        player.removeEventListener("pause", onPause);
        player.removeEventListener("play", onPlay);
        player.removeEventListener("loadeddata", onPlayerReload);
        setPlayerChangeHandler(false);
        console.log("Disconnected status listeners");
        if (!player.paused) {
          setTitle(false);
        }
      }
    }
  }


  /*
   * videoRunning()
   * Return true if video is running in current player, false otherwise
   */
  function videoRunning() {
    if (player != null) {
      return !player.paused;
    }
    return false;
  }


  /*
   * fixRegex()
   * Return a rexeg-friendly version of the given string 
   */
  function fixRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    console.log("preferences changed");
    browser.storage.local.get(["modifier", "suspended"])
      .then(function(pref) {
        if (pref.modifier) {
          currPrefix = pref.modifier;
        } else {
          // no modifier found
          currPrefix = prefixDefault;
        }
        isSuspended = pref.suspended;
        setTitle(videoRunning() && !pref.suspended);
      }, onError);
  }

  /*
   * initSettings()
   * Apply settings from local storage
   */
  function initSettings() {
    // return a Promise to make the it possible
    // to wait for this function's completion (in init())
    // before doing other init stuff
    return new Promise((resolve, reject) => {
      var applySetting = function(pref) {
        console.log("applying settings");
        console.log(pref);
        if ("modifier" in pref) {
          currPrefix = pref.modifier;
        } else {
          // no modifier found
          currPrefix = prefixDefault;
        }
        isSuspended = pref.suspended || false;
        console.log(`Applied settings: ${currPrefix}, ${isSuspended}`);
        resolve("success");
      };

      console.log("retrieving settings");
      browser.storage.local.get(["modifier", "suspended"])
        .then(applySetting, onError);
    });
  }



  /*
   * onPlayerReload()
   * Event handler for a player-internal reload.
   * This happens e.g. on youtube if autoplay is active.
   * This handler is used to detect a new autoplaying video.
   * @TODO: check if there is a way to catch event on when title is set.
   */
  function onPlayerReload() {
    if ((player != null) && !player.paused) {
      console.log("autostart detected");
      setTimeout(onPlay, 1000); // hacky hack: site name might not be fully loaded when video is loaded, wait a bit
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
      if (mutation.type == "attributes") {
        if (mutation.attributeName == "src") {
          initPlayer();
        }
      }
    }
  }


  /*
   * setPlayerChangedHandler()
   * Set up event handler for current player
   * to trigger when the player's attributes have changed.
   */
  function setPlayerChangeHandler(start) {
    if (start) {
      if (player == null) {
        return;
      }
      observer.observe(player, { attributeFilter: ["src"] });
    } else {
      observer.disconnect();
    }
  }

  /*
   * handleMessage()
   * Deal with a message from background script
   */
  function handleMessage(message) {
    // handle a message from background script
    if ("suspend" in message) {
      isSuspended = message.suspend;
      if (message.suspend) {
        setListeners(false);
      } else {
        initPlayer();
      }
    }
  }

}();
