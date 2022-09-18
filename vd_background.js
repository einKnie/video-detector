// background script for video-detect extension

(function() {
  
  // TODO: not finished
  // browser.runtime.onInstalled.addListener(showOnboarding);

  const DEBUG = false;
  var logDebug;
  if (DEBUG) {
    logDebug = console.log;
  } else {
    logDebug = function () { };
  }

  // base settings
  const g_titleMod         = "(%title%)";
  const g_prefixDefault    = "▶️ " + g_titleMod;
  const g_suspendedDefault = false;

  // handling the settings page
  var g_lastTabId = null;
  var g_optionsURL = "options/options.html";

  // will be filled at script startup, values are gotten from manifest match strings
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
      let manifest = browser.runtime.getManifest();
      manifest.content_scripts.forEach(function(obj) {
        if (obj.matches != undefined) {
          for (let site in obj.matches) {
            if (obj.matches.hasOwnProperty(site)) {
              let sitename = obj.matches[site].replace(/^\*:\/\/\*\.(\w+\.\w+)[\*\/]*$/g, '$1');
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
   * initialize storage if nothing is there yet (i.e. first start after installation)
   * and deal with added/removed supported sites on update
   */
  function initSettings() {
    browser.storage.local.get(["modifier", "suspended", "sites"])
      .then(function(pref) {
        // update current active sites with stored preferences
        // this makes it easier for me to add/remove supported sites on the addon level
        if (pref.sites) {
          Object.keys(g_activeSites).forEach(site => {
            if (pref.sites.hasOwnProperty(site)) {
              g_activeSites[site] = pref.sites[site];
            }
          });
        }
        let newPrefs = {
          modifier:   pref.modifier  || g_prefixDefault,
          suspended:  pref.suspended || g_suspendedDefault,
          sites:      g_activeSites
        };
        browser.storage.local.set(newPrefs);
      }, onError);
  }


  function onError(e) {
    console.log("error: " + e);
  }


  // TODO: not finished
  async function showOnboarding(reason) {
    logDebug(reason.reason);
    logDebug(reason.temporary);
    switch (reason.reason) {
      case "install": {
        const url = browser.runtime.getURL("views/onboard.html");
        await browser.tabs.create({ url });
      }
      break;
    }
  }


  /*
   * handleMessage()
   * Deal with an incoming message from the toolbar button
   */
  function handleMessage(message) {
    logDebug("message received");
    if ("settings" in message) {
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
    let views = browser.extension.getViews({type: "tab", windowId: winInfo.windowId});
    for (let win of views) {
      if (win.location.href.includes(g_optionsURL)) {
        // switch to tab instead of open
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
    let winid = browser.windows.getCurrent({populate: true});
      // close settings tab, if open
      winid.then(isSettingsOpen)
        .then(function(res) {
          if (res == true) {
            browser.tabs.remove([g_lastTabId]);
          }
        });
      // in parallel
      // open new settings tab next to current tab
      winid.then(getCurrentTab)
        .then(function(index) {
        let tabcfg = {
            active: true,
            index: index + 1,
            url:   g_optionsURL
          };
          browser.tabs.create(tabcfg)
            .then(function(tab) {
              g_lastTabId = tab.id;
            }, onError);
        }, onError);
  }

})();
