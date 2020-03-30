// addon suspension
// functions here shouldbe called when the addon's popup is called and suspend-button pressed
// in which case, stop the addon. 
// how? i have no idea

var default_suspend = "Suspend";
var default_resume = "Resume";
var suspendButton = document.querySelector('[class="button suspend"]');
var suspendState = false;

fetchLocalState()
  .then(function() {
    setButtonText(suspendState);
    document.querySelector('[class="button suspend"]').addEventListener("click", onSuspendClicked);
  }, onError());


function setButtonText() {
  if (suspendButton != null) {
    console.log("button found");
    if (suspendState) suspendButton.textContent = "Resume";
    else              suspendButton.textContent = "Suspend";
  } else {
    console.log("no button found");
  }
}

function onSuspendClicked(e) {
  console.log("suspend button clicked");

  suspendState = !suspendState;
  setButtonText(suspendState);
  browser.runtime.sendMessage({value: suspendState});
  browser.storage.local.set({suspended: suspendState});
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


