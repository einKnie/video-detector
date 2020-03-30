// background script for video-detect extension

console.log("background script startup");
browser.runtime.onMessage.addListener(handleMessage);

function onError(e) {
  console.log("error: " + e);
}

function handleMessage(message) {
  console.log("background script received message");
  var msgValue = message.value;
  console.log(msgValue);
  
  var tabs = browser.tabs.query({"url": ["*://*.youtube.com/*", "*://*.vimeo.com/*", "*://*.netflix.com/*", "*://*.orf.at/*"]});
  if (tabs.length == 0) {
    console.log("no tabs found");
    return;
  }
  tabs.then((x) => {x.forEach(function(item, index) {
    try {
      browser.tabs.sendMessage(item.id, {suspend: msgValue });
      console.log("sent message to tab id " + item.id);

    } catch(e) {
      console.log(e);
    }

  })}, onError);

}

