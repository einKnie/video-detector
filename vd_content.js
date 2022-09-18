// Content script runs on supported sites and watches video player for changes

videoDetector = function() {
  
  const DEBUG = false;
  var logDebug;
  if (DEBUG) {
    logDebug = console.log;
  } else {
    logDebug = function() { };
  }

  // supported websites
  const sites = {
    YOUTUBE: "youtube",
    VIMEO:   "vimeo",
    NETFLIX: "netflix",
    ORF:     "orf",
    TWITCH:  "twitch"
  };


  // 'globals'
  // these could well be addon-global. maybe turn them into a 'config' module?
  const g_titleMod      = "(%title%)";
  const g_prefixDefault = "Playing ~ " + g_titleMod;
  var g_currPrefix    = g_prefixDefault;
  var g_lastPrefix    = g_currPrefix;
  var g_isSuspended   = false;
  var g_siteSuspended = false;
  var g_activeSites   = {};

  // site-global 'globals'
  // these differ in each tab
  // create observer here so we can access it at different times
  const g_observer = new MutationObserver(mutationHandler);

  // set MutationObserver for title (youtube-specific; youtube resets title when an ad was supposed to play)
  const g_titleObs = new MutationObserver(titleMutationHandler);
 
  var   g_player   = null;

  // start script execution
  //window.addEventListener("load", init);
  init();

  /*
   * init()
   * Initialize script
   */
  function init() {
    logDebug("Starting content script");
    browser.storage.onChanged.addListener(onSettingChanged);
    // need to make sure that settings are applied prior to initializing player
    initSettings()
      .then(initPlayer);
  }


  /*
   * initSettings()
   * Apply settings from local storage.
   */
  function initSettings() {
    // return a Promise to make the it possible
    // to wait for this function's completion (in init())
    // before doing other init stuff
    return new Promise((resolve) => {
      function applySetting(pref) {
        g_currPrefix  = pref.modifier   || g_prefixDefault;
        g_isSuspended = pref.suspended  || g_isSuspended;
        g_activeSites = pref.sites      || g_activeSites;
        checkSiteStatus(g_activeSites);
        resolve("success");
      }

      browser.storage.local.get({ modifier:   g_currPrefix,
                                  suspended:  false,
                                  sites:      g_activeSites })
        .then(applySetting, onError);
    });
  }


  /*
   * initPlayer()
   * Check if a player exists on site.
   * Function reschedules itself periodically until a player is found.
   * @TODO: rethink this concept. could this be event-based?
   */
  function initPlayer() {
    g_player = getPlayer();

    if (g_player != null) {
      logDebug("player found");
      if (!g_isSuspended && !g_siteSuspended) {
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
    if (g_player != null) {
      // cleanup old player
      setListeners(false);
      g_player = null;
    }

    switch (getSite()) {
      case sites.YOUTUBE: {
        if (document.getElementById("movie_player") != null) {
          g_player = document.getElementById("movie_player").querySelector("video");
        }
      } break;
      case sites.VIMEO: {
        if (document.getElementsByClassName("vp-controls-wrapper").length != 0) {
          g_player = document.querySelector("div[class^='player']").querySelector("video");
        }
      } break;
      case sites.NETFLIX: {
        if (document.querySelector("div[class='watch-video']") != null) {
          g_player = document.querySelector("div[class='watch-video']").querySelector("video");
        }
      } break;
      case sites.ORF: {
        if (document.getElementById("player-wrapper").length != 0) {
          g_player = document.querySelector("div[id='player-wrapper']").querySelector("video");
        }
      } break;
      case sites.TWITCH: {
        if (document.querySelector("[class*='video-player'][data-a-player-type='site']") != null) {
          g_player = document.querySelector("div[class*='video-player'][data-a-player-type='site']").querySelector("video");
        }
      } break;
     
      default: logDebug("invalid site");
    }
    if (g_player)
      logDebug(g_player);
    return g_player;
  }


  /*
   * setTitle()
   * Change the tab's title, depending on 'playing'.
   * This function takes all possible variations of the 'title string'
   */
  function setTitle(playing) {
    let origTitle;
    // first, get the tab's original title
    // we need to check all possible mod types
    if (g_lastPrefix.includes(g_titleMod)) {

      // --> we have a titleMod
      if (g_lastPrefix.trim().startsWith(g_titleMod) || g_lastPrefix.trim().endsWith(g_titleMod)) {
        
        // --> titleMod at start or end of title
        origTitle = document.title.replace(new RegExp(`(${fixRegex(removePrefixMod(g_lastPrefix))})`, "g"), "");
      } else {
        
        // --> we have a titleMod in the middle of the title
        var arr = g_lastPrefix.trim().split(/(\(%)|(%\))/g);
        origTitle = document.title.replace(new RegExp(`(${fixRegex(arr[0])})|(${fixRegex(arr[arr.length - 1])})`, "g"), "");
      }
    } else {
      
      // --> we have a regular prefix
      origTitle = document.title.replace(new RegExp(`(${fixRegex(g_currPrefix)})|(${fixRegex(g_lastPrefix)})`, "g"), "");
    }

    // finally, set the tabs title
    if (playing) {
      logDebug("Setting title");
      if (g_currPrefix.includes(g_titleMod)) {
        document.title = g_currPrefix.replace(g_titleMod, origTitle);
      } else {
        document.title = g_currPrefix + origTitle;
      }
    } else {
      logDebug("Unsetting title");
      document.title = origTitle;
    }
    
    // store prefix
    g_lastPrefix = g_currPrefix;
    g_titleObs.observe(document.querySelector('title'), { childList: true });
  }


  /*
   * getSite(string)
   * Return the name of the site, or 'other' if the site is not supported
   */
  function getSite() {
    let url = document.URL;
    for (let site in sites) {
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
    if (g_player != null) {
      if (on) {
        logDebug("Registering listeners");
        g_player.addEventListener("pause", onPause);
        g_player.addEventListener("play", onPlay);
        g_player.addEventListener("ended", onPause);
        g_player.addEventListener("loadeddata", onPlayerReload);
        setPlayerChangeHandler(true); // netflix specific
        if (!g_player.paused) {
          // if player is already running
          setTitle(true); 
        }
      } else {
        logDebug("Unregistering listeners");
        g_player.removeEventListener("pause", onPause);
        g_player.removeEventListener("play", onPlay);
        g_player.removeEventListener("ended", onPause);
        g_player.removeEventListener("loadeddata", onPlayerReload);
        setPlayerChangeHandler(false);
        if (!g_player.paused) {
          setTitle(false);
        }
      }
    }
  }


  /*
   * fixRegex()
   * Return a rexeg-friendly version of the given string
   */
  function fixRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }


  /*
   * removePrefixMod(str)
   * remove the title modficator from a string
   */
  function removePrefixMod(str) {
    return str.replace(g_titleMod, "").trim();
  }

  /*
   * isTitleNeeded()
   * Check if the basic prerequisites for setting title prefix are met
   */
  function isTitleNeeded() {
    return (g_player && !g_player.paused && !(g_siteSuspended || g_isSuspended));
  }


  //
  // CALLBACK HANDLER
  //


  /*
   * onPause()
   * Callback handler for video player pause event.
   */
  function onPause() {
    setTitle(false);
  }


  /*
   * onPlay()
   * Callback handler for video player play event.
   */
  function onPlay() {
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
    logDebug("Settings have changed!");
    browser.storage.local.get(["modifier", "suspended", "sites"])
      .then(function(pref) {
        logDebug(pref);
        g_currPrefix  = pref.modifier  || g_prefixDefault;
        g_isSuspended = pref.suspended || false;
        checkSiteStatus(pref.sites);

        if (g_siteSuspended || g_isSuspended) {
          setListeners(false);
        } else {
          setListeners(true);
        }
      }, onError);
  }


  /*
   * checkSiteStatus()
   * Check if current site is suspended
   */
  function checkSiteStatus(sites) {
    Object.getOwnPropertyNames(sites).forEach(function(val) {
      if (document.URL.includes(val)) {
        g_siteSuspended = !sites[val];
      }
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
    if ((g_player != null) && !g_player.paused) {
      logDebug("player reloading");
      setTimeout(onPlay, 1000); // hacky hack: site name might not be fully loaded when video is loaded, wait a bit
    }
  }


  /*
   * mutationHandler()
   * Handle a mutation event.
   * In case the player's src attribute has changed, reinit the player by calling initPlayer.
   * Turns out, this is only needed for netflix, all other sites work well without it.
   * Considering moving this to netflix-specific
   */
  function mutationHandler(mutationList) {

    for (let mutation of mutationList) {
      logDebug(`mutation observed: type: ${mutation.type}, name: ${mutation.attributeName}`);
      if (mutation.type == "attributes") {
        if (mutation.attributeName == "src") {
          logDebug("mutation observed");
          initPlayer();
        }
      }
    }
  }
  
  /*
   * titleMutationHandler()
   * Handler for observes page title changes.
   * Youtube keeps resetting the title whenever ads are scheduled, even if they are blocked.
   * This handler is used to detect theses changes and set the title again
   * FIXME: this breaks firefox when ads are enabled; find another way
   */
  function titleMutationHandler(mutationList) {
    if (g_player.currentTime == 0) {
      logDebug("0 runtime");
      return;
    } 

    for (let mutation of mutationList) {
      if (DEBUG) {
        let msg = "Title mutation observed";
        if (g_player != null) {
          msg += ` at time ${g_player.currentTime / 60} m`;
        }
        logDebug(msg);
      }
      if (isTitleNeeded() && !document.title.includes(removePrefixMod(g_currPrefix))) {
        logDebug("resetting title");
        g_titleObs.disconnect();
        setTitle(true);
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
      if (g_player == null) {
        return;
      }
      g_observer.observe(g_player, { attributeFilter: ["src"] });
    } else {
      g_observer.disconnect();
    }
  }


}();
