// background script for video-detect extension

console.log("background script startup");
browser.runtime.onMessage.addListener(handleMessage);

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
  var tabs = browser.tabs.query({"url": ["*://*.youtube.com/*", "*://*.vimeo.com/*", "*://*.netflix.com/*", "*://*.orf.at/*"]});
  if (tabs.length == 0) {
    console.log("no tabs found");
    return;
  }
  tabs.then((x) => {x.forEach(function(item, index) {
    try {
      browser.tabs.sendMessage(item.id, {suspend: suspendState });
      console.log("sent message to tab id " + item.id + " (" + item.title + ")");

    } catch(e) {
      console.log(e);
    }

  })}, onError);

}

