// addon suspension
// functions here shouldbe called when the addon's popup is called and suspend-button pressed


var default_suspend = "Suspend";
var default_resume = "Resume";
var suspendButton = document.querySelector('[class="button suspend"]');
var suspendState = false;

fetchLocalState()
  .then(function() {
    setButtonText(suspendState);
    document.querySelector('[class="button suspend"]').addEventListener("click", onSuspendClicked);
    document.querySelector('[class="button settings"]').addEventListener("click", onSettingsClicked);
  }, onError());


function setButtonText() {
  if (suspendButton != null) {
    console.log("button found");
    if (suspendState) suspendButton.textContent = default_resume;
    else              suspendButton.textContent = default_suspend;
  } else {
    console.log("no button found");
  }
}

function onSuspendClicked() {
  console.log("suspend button clicked");

  suspendState = !suspendState;
  setButtonText(suspendState);
  browser.storage.local.set({suspended: suspendState});
}


function onSettingsClicked() {
  console.log("settings button clicked");  
  browser.runtime.sendMessage({settings: true});
  window.close();
}

function fetchLocalState() {
  return new Promise((resolve, reject) => {
    var applySetting = function(pref) {
      console.log("applying settings");
      if (pref.suspended) {
        suspendState = pref.suspended;
      } else {
        // no setting yet
        suspendState = false;
      }
      setButtonText(suspendState);
      resolve("success");
    };

    console.log("state applied");
    browser.storage.local.get("suspended")
      .then(applySetting, onError);
  });
}

function onError(e) {
  console.log("error: " + e);
}

console.log("popup opened");


