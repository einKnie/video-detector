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

/*
function handlePopupClick() {
  console.log("clicked");
}


// @TODO: fix this so only the button listens to click
document.addEventListener("click", function(e) {
  if (document.hasFocus()) {
    console.log("focus");
  } else {
    console.log("no focus");
  }
  if (!e.target.classList.contains("button")) {
    console.log("no button");
    return;
  }
  console.log("button pressed");
  if (e.target.textContent == default_suspend) {
    e.target.textContent = default_resume;
    browser.runtime.sendMessage({"value": true});
  } else {
    e.target.textContent = default_suspend;
    browser.runtime.sendMessage({"value": false});
  }
});
*/
function onSuspendClicked(e) {
  console.log("suspend button clicked");
  /*if (typeof onSuspendClicked.suspended == 'undefined') {
    onSuspendClicked.suspended = suspendState;
  }
  onSuspendClicked.suspended = !onSuspendClicked.suspended;*/
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


