// Content script runs on supported sites and watches video player for changes


videoDetector = function() {

  // supported websites
  const sites = {
    YOUTUBE: "youtube",
    VIMEO:   "vimeo",
    NETFLIX: "netflix",
    ORF:     "orf",
    VIVO:    "vivo",
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
  var   g_player   = null;

  // start script execution
  init();

  /*
   * init()
   * Initialize script
   */
  function init() {
    console.log("Starting content script");
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
   * Check if a g_player exists on site.
   * Function reschedules itself periodically until a g_player is found.
   * @TODO: rethink this concept. could this be event-based?
   */
  function initPlayer() {
    g_player = getPlayer();

    if (g_player != null) {
      console.log("player found");
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
      // cleanup old g_player
      setListeners(false);
      g_player = null;
    }

    switch (getSite(document.URL)) {
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
        if (document.getElementsByClassName("PlayerControlsNeo__button-control-row").length != 0) {
          g_player = document.querySelector("div[class^='VideoContainer']").querySelector("video");
        }
      } break;
      case sites.ORF: {
        if (document.getElementsByClassName("video_wrapper").length != 0) {
          g_player = document.querySelector("div[class^='video_wrapper']").querySelector("video");
        }
      } break;
      case sites.VIVO: {
        if (document.getElementsByClassName("plyr").length != 0) {
          g_player = document.querySelector("div[class^='plyr']").querySelector("video");
        }
      } break;
      case sites.TWITCH: {
        try {
        if (document.getElementsByClassName("video-player").length != 0) {
          console.log(document.getElementsByClassName("video-player"));
          g_player = document.querySelector("div[class='video-player']").querySelector("video");
        }
        } catch(e) {
          console.log(e);
        }
      } break;
      default: console.log("invalid site");
    }
    return g_player;
  }


  /*
   * setTitle()
   * Change the tab's title, depending on 'playing'.
   * This function takes all possible varations of the 'title string'
   */
  function setTitle(playing) {
    let origTitle;
    // first, get the tab's original title
    // we need to check all possible mod types
    if (g_lastPrefix.includes(g_titleMod)) {

      // --> we have a g_titleMod
      if (g_lastPrefix.trim().startsWith(g_titleMod) || g_lastPrefix.trim().endsWith(g_titleMod)) {
        
        // --> g_titleMod at start or end of title
        origTitle = document.title.replace(new RegExp(`(${fixRegex(removePrefixMod(g_lastPrefix))})`, "g"), "");
      } else {
        
        // --> we have a g_titleMod in the middle of the title
        var arr = g_lastPrefix.trim().split(/(\(%)|(%\))/g);
        origTitle = document.title.replace(new RegExp(`(${fixRegex(arr[0])})|(${fixRegex(arr[arr.length - 1])})`, "g"), "");
      }
    } else {
      
      // --> we have a regular prefix
      origTitle = document.title.replace(new RegExp(`(${fixRegex(g_currPrefix)})|(${fixRegex(g_lastPrefix)})`, "g"), "");
    }

    // finally, set the tabs title
    if (playing) {
      if (g_currPrefix.includes(g_titleMod)) {
        document.title = g_currPrefix.replace(g_titleMod, origTitle);
      } else {
        document.title = g_currPrefix + origTitle;
      }
    } else {
      document.title = origTitle;
    }
    
    // store prefix
    g_lastPrefix = g_currPrefix;
  }


  /*
   * getSite(string)
   * Return the name of the site, or 'other' if the site is not supported
   */
  function getSite(url) {
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
        g_player.addEventListener("pause", onPause);
        g_player.addEventListener("play", onPlay);
        g_player.addEventListener("ended", onPause);
        g_player.addEventListener("loadeddata", onPlayerReload);
        setPlayerChangeHandler(true);
        if (!g_player.paused) {
          // if player is already running
          onPlay();
        }
      } else {
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
    browser.storage.local.get(["modifier", "suspended", "sites"])
      .then(function(pref) {
        console.log(pref);
        g_currPrefix  = pref.modifier  || g_prefixDefault;
        g_isSuspended = pref.suspended || false;
        checkSiteStatus(pref.sites);

        if (g_siteSuspended || g_isSuspended) {
          setListeners(false);
        } else {
          initPlayer();
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
      setTimeout(onPlay, 1000); // hacky hack: site name might not be fully loaded when video is loaded, wait a bit
    }
  }


  /*
   * mutationHandler()
   * Handle a mutation event.
   * In case the g_player's src attribute has changed, reinit the g_player by calling initPlayer.
   */
  function mutationHandler(mutationList) {

    for (let mutation of mutationList) {
      if (mutation.type == "attributes") {
        if (mutation.attributeName == "src") {
          initPlayer();
        }
      }
    }
  }


  /*
   * setg_playerChangedHandler()
   * Set up event handler for current g_player
   * to trigger when the g_player's attributes have changed.
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
