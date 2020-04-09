// addon suspension
// functions here shouldbe called when the addon's popup is called and suspend-button pressed


const default_suspend = "Suspend";
const default_resume  = "Resume";
const suspendButton   = document.querySelector('[class="button suspend"]');
var   suspendState    = false;

fetchLocalState()
  .then(function() {
    setButtonText(suspendState);
    document.querySelector('[class="button suspend"]').addEventListener("click", onSuspendClicked);
    document.querySelector('[class="button settings"]').addEventListener("click", onSettingsClicked);
  }, onError);


function setButtonText() {
  if (suspendButton != null) {
    if (suspendState) suspendButton.textContent = default_resume;
    else              suspendButton.textContent = default_suspend;
  } else {
    onError("no button found");
  }
}

function onSuspendClicked() {
  suspendState = !suspendState;
  setButtonText(suspendState);
  browser.storage.local.set({suspended: suspendState});
}


function onSettingsClicked() {
  browser.runtime.sendMessage({settings: true});
  window.close();
}

function fetchLocalState() {
  return new Promise((resolve) => {
    let applySetting = function(pref) {
      suspendState = pref.suspended || false;
      setButtonText(suspendState);
      resolve("success");
    };

    browser.storage.local.get("suspended")
      .then(applySetting, onError);
  });
}

function onError(e) {
  console.log("error: " + e);
}
