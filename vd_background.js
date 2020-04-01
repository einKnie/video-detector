// background script for video-detect extension

var sBackground = function() {

  console.log("background script startup");

  var prefix_default    = "Playing ~ ";
  var suspended_default = false;
  var supportedSites = ["*://*.youtube.com/*", "*://*.vimeo.com/*", "*://*.netflix.com/*", "*://*.orf.at/*", "*://*.vivo.sx/*"];

  var settings = {
    modifier: prefix_default,
    suspended: suspended_default
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
    browser.storage.local.get(["modifier", "suspended"])
      .then(function(pref) {
        var newPrefs = {
          modifier: pref.modifier || prefix_default,
          suspended: pref.suspended || suspended_default
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
    if (!("value" in message)) {
      return;
    }
    var suspendState = message.value;
    console.log("Suspended: " + suspendState);

    // get all relevant tabs and send message
    var tabs = browser.tabs.query({"url": supportedSites});
    if (tabs.length == 0) {
      console.log("no tabs found");
      return;
    }
    tabs.then((x) => {x.forEach(function(item, index) {
      try {
        browser.tabs.sendMessage(item.id, {suspend: suspendState });
        console.log(`sent message to tab id ${item.id} (${item.title})`);

      } catch(e) {
        console.log(e);
      }

    })}, onError);
  }
}();
