// background script for video-detect extension

var sBackground = function() {

  console.log("background script startup");

  var prefix_default    = "Playing ~ ";
  var suspended_default = false;
  var activeSites = { "youtube.com": true,
                      "vimeo.com": true,
                      "netflix.com": true,
                      "orf.at": true,
                      "vivo.sx": true };

  
  var settings = {
    modifier: prefix_default,
    suspended: suspended_default,
    sites: activeSites
  };

  browser.runtime.onMessage.addListener(handleMessage);
  initSettings();

  /*
   * should actually just initialite storage if nothing is there yet (i.e. first start after installation)
   */
  function initSettings() {
    try {
    console.log("initial settings");
    console.log(settings);
    browser.storage.local.get(["modifier", "suspended", "sites"])
      .then(function(pref) {
        var newPrefs = {
          modifier: pref.modifier || prefix_default,
          suspended: pref.suspended || suspended_default,
          sites: pref.sites || activeSites
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
   * Return an array of match-strings for the supported sites
   */
  function getSiteMatches() {
    var arr = [];
    Object.getOwnPropertyNames(activeSites).forEach(function(val) {
      console.log(val + ":" + activeSites[val]);
      arr.push(`*://*.${val}/*`);
    });
    console.log(arr);
    return arr;
  }


  /*
   * handleMessage()
   * Deal with an incoming message from the toolbar button
   * TODO: remove handling of suspend-message since that does not exist anymore
   */
  function handleMessage(message) {
    console.log("background script received message");
    if ("value" in message) {

      var suspendState = message.value;
      console.log("Suspended: " + suspendState);

      // get all relevant tabs and send message
      var tabs = browser.tabs.query({"url": getSiteMatches()});
      if (tabs.length == 0) {
        console.log("no tabs found");
        return;
      }
      tabs.then((x) => {x.forEach(function(item) {
        try {
          browser.tabs.sendMessage(item.id, {suspend: suspendState });
          console.log(`sent message to tab id ${item.id} (${item.title})`);

        } catch(e) {
          console.log(e);
        }
      });}, onError);
    } else if ("settings" in message) {
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

}();
