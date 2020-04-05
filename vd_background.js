// background script for video-detect extension

(function() {

  console.log("background script startup");
  
  // base settings
  var g_titleMod         = "(%title%)";
  var g_prefixDefault    = "Playing ~ " + g_titleMod;
  var g_suspendedDefault = false;
  
  // handling the settings page
  var g_lastTabId = null;
  var g_optionsURL = "options/options.html";

  // will be filled at script startup, values are gotten from menifest match strings
  var g_activeSites = {};

  browser.runtime.onMessage.addListener(handleMessage);
  getSupportedSites()
    .then(initSettings, onError);
  
  /*
   * getSupportedSites()
   * Retrieve the supported domains from manifest.json
   * (this way, I won't have to add new sites at multiple locations)
   */
  function getSupportedSites() {
    return new Promise((resolve, reject) => {
      var manifest = browser.runtime.getManifest();
      manifest.content_scripts.forEach(function(obj) {
        if (obj.matches != undefined) {
          for (var site in obj.matches) {
            if (obj.matches.hasOwnProperty(site)) {
              var sitename = obj.matches[site].replace(/^\*:\/\/\*\.(\w+\.\w+)[\*\/]*$/g, '$1');
              g_activeSites[sitename] = true;
            }
          }
          resolve("yay");
        } else {
          reject("Failed to find matches");
        }
      });  
    });    
  }
  

  /*
   * should actually just initialite storage if nothing is there yet (i.e. first start after installation)
   */
  function initSettings() {
    try {
      browser.storage.local.get(["modifier", "suspended", "sites"])
        .then(function(pref) {
          var newPrefs = {
            modifier:   pref.modifier  || g_prefixDefault,
            suspended:  pref.suspended || g_suspendedDefault,
            sites:      pref.sites     || g_activeSites
          };
          console.log(newPrefs);
          browser.storage.local.set(newPrefs);
        }, onError);
    } catch(e) {
      console.log(e);
    }
  }


  function onError(e) {
    console.log("error: " + e);
  }


  /*
   * handleMessage()
   * Deal with an incoming message from the toolbar button
   */
  function handleMessage(message) {
    console.log("background script received message");
    if ("settings" in message) {
      console.log("settings message received");
      openSettingsPage();
    }
  }

  
  /*
   * getCurrentTab()
   * Return the index ( = position) of the currently active tab
   */
  function getCurrentTab(winInfo) {
    return new Promise((resolve, reject) => {

      for (let tabInfo of winInfo.tabs) {
        if (tabInfo.active == true) {
          console.log("active tab found");
          resolve(tabInfo.index);
        }
      }
      reject("Failed to get current tab");
    });
  }
  
  
  /*
   * isSettingsOpen()
   * Return true if a settings page is already open in the current active window
   * else false.
   */
  function isSettingsOpen(winInfo) {
    var views = browser.extension.getViews({type: "tab", windowId: winInfo.windowId});
    console.log(views);
    for (var win of views) {
      if (win.location.href.includes(g_optionsURL)) {
        // switch to tab instead of open
        console.log("settings page found");
        console.log(win);
        return true;
      }
    }
    return false;
  }

  
  /*
   * openSettingsPage()
   * Open a new tab with the Addon's setting page.
   * If a setings page is found to be open already, it is closed.
   * TODO: see if there is a better way to do this
   */
  function openSettingsPage() {
    try{
    
    var winid = browser.windows.getCurrent({populate: true});
      // close settings tab, if open
      winid.then(isSettingsOpen)
        .then(function(res) {
          if (res == true) {
            console.log("closing");
            browser.tabs.remove([g_lastTabId]);
          }
        });
      // in parallel
      // open new settings tab next to current tab
      winid.then(getCurrentTab)
        .then(function(index) {
          var tabcfg = {
            active: true,
            index: index + 1, 
            url:   g_optionsURL
          };
          browser.tabs.create(tabcfg)
            .then(function(tab) {
              g_lastTabId = tab.id;
            }, onError);
        }, onError);
      
    } catch(e) { console.log(e); }
  }

})();
