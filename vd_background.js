// background script for video-detect extension

(function() {

  console.log("background script startup");

  var prefix_default    = "Playing ~ ";
  var suspended_default = false;

  // will be filled at script startup, values are gotten from menifest match strings
  var activeSites = {};

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
              activeSites[sitename] = true;
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
            modifier:   pref.modifier  || prefix_default,
            suspended:  pref.suspended || suspended_default,
            sites:      pref.sites     || activeSites
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
   * openSettingsPage()
   * Open a new tab with the Addon's setting page
   */
  function openSettingsPage() {
    // open new tab with settings page next to current tab
    var winid = browser.windows.getCurrent({populate: true});
    winid.then(getCurrentTab, onError).then(function(index) {
      var tabcfg = {
        active: true,
        index: index + 1, 
        url: "options/options.html"
      };
      browser.tabs.create(tabcfg)
        .then(function() { console.log("yay");}, onError);
    }, onError);
  }

})();
