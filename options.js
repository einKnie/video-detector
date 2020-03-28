// options script

// default modifier
var mod_default = "Playing ~ ";

function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    modifier: document.querySelector("#modifier").value
  });
}

function restoreOptions() {

  function setCurrentChoice(result) {
    document.querySelector("#modifier").value = result.modifier || mod_default;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  let getting = browser.storage.local.get("modifier");
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

