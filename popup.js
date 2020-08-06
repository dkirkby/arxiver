let changeColor = document.getElementById('saveButton');

saveButton.onclick = function(element) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.executeScript(
          tabs[0].id,
          {file: 'save.js'});
    });
  };
