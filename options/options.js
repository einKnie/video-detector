// options script

// default modifier
var mod_default = "Playing ~ ";
var vd_description = "Let's keep it simple: These are the settings you're gonna get.";

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("applybutton").addEventListener("click", saveOptions);

/*
 * Helper to store new settings
 */
function fetchSettings(result) {
  return new Promise((resolve,reject) => {
    var newsites = result.sites;
    try {
      Object.getOwnPropertyNames(result.sites)
        .forEach(function(val) {
        newsites[val] = document.getElementById(val).checked;
      });
    } catch(e) {
      reject("error fetching values");
    }
    resolve(newsites);
  });
}

/*
 * Store options from settings page
 */
function saveOptions(e) {
  e.preventDefault();
  // check if any sites have been enabled/disabled
  var newSites = browser.storage.local.get("sites");
  newSites.then(fetchSettings, onError).then(function(result) {
      console.log(result);
      return new Promise((resolve, reject) => {
        browser.storage.local.set({
          modifier: document.querySelector("#modifier").value.replace(/^\s+/g, '').replace(/(\s)+/g, '$1'),
          sites: result
        }).then(function(){resolve("yay");}, function(){reject("Failed to store data");});});
    }, onError).then(restoreOptions, onError);
}

/*
 * Apply current options to settings page
 */
function restoreOptions() {
  
  function setupSettingsPage(result) {
    console.log(result);
    var buttons = document.getElementById("sitebuttons");
    Object.getOwnPropertyNames(result.sites).forEach(function(val) {
      if (buttons.querySelector(`input[id="${val}"]`) != null) {
        // just update value in case the checkbox already exists
        buttons.querySelector(`input[id="${val}"]`).checked = result.sites[val];
      } else {
        // add a checkbox for each supported site
        var elem = document.createElement("div");
        var chkbox = document.createElement("input");
        chkbox.type = "checkbox";
        chkbox.id = val;
        chkbox.checked = result.sites[val];
        var label = document.createElement("label");
        label.htmlFor = val;
        label.appendChild(document.createTextNode(`Enable on ${val}`));
        elem.appendChild(chkbox);
        elem.appendChild(label);
        buttons.appendChild(elem);
      }
    });
    // pre-fill titlePrefix field with the current set prefix
    document.querySelector("#modifier").value = result.modifier || mod_default;
    document.getElementById("apptext").innerHTML = vd_description;
  }

  let getting = browser.storage.local.get(["modifier", "sites"]);
  getting.then(setupSettingsPage, onError);
}

function onError(error) {
  console.log(`Error: ${error}`);
}


