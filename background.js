chrome.runtime.onMessage.addListener(
  function (request, sender, sendReponse) {
    if (request.type === "changeTab") {
      chrome.tabs.query({ currentWindow: true }, function (tabs) {
        chrome.tabs.query({ currentWindow: true, active : true }, function (curTab) {
          var index = curTab[0].index + request.shift;
          if (index < 0)
            index += tabs.length;
          if (index >= tabs.length)
            index -= tabs.length;

          var switchId = tabs[index].id;
          chrome.tabs.update(switchId, { active: true });
          sendResponse(switchId);
        });
      });
    } else if (request.type === "newTab") {
      chrome.tabs.create({ active: true }, function (tab) {
        sendResponse(tab.id);
      });
    } else if (request.type === "closeTab") {
      chrome.tabs.query({ currentWindow: true, active : true }, function (curTab) {
        chrome.tabs.remove(curTab[0].id, function () {
          sendResponse();
        });
      });
    }
  }
);