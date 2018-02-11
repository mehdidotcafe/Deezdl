const HISTORY = "deezdlHistory";
const CURRENT_SITE_KEY = "CurrentSite";

var tabs = [];

function getTabById(tabId)
{
  var ret;

  tabs.forEach(function(tab)
  {
    if (tab.id == tabId)
      ret = tab;
  });

  return (ret);
}

chrome.tabs.onRemoved.addListener(function(tabId)
{
  var i = 0;

  for (tab in tabs)
  {
    if (tab.id == tabId)
    {
      tabs.splice(i, 1);
      break ;
    }
    ++i;
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, info)
{
  var tab = getTabById(tabId);

  if (tab && tab.firstRequest && tab.id == tabId && info.status == "complete")
  {
    chrome.tabs.sendMessage(tab.id, {type: "Inner", albumName: tab.albumName, albumArtist: tab.albumArtist});
    tab.firstRequest = false;
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
  function updateHistory(album)
  {
    chrome.tabs.query({windowId: window.id}, function(allTabs)
    {
      allTabs.forEach(function(tab)
      {
        chrome.tabs.sendMessage(tab.id, {type: "UpdateHistory", album: album});
      });
    });
  }

  function createNewWindow(request)
  {
    chrome.tabs.create({url: ('http://' + request.url)}, function(tab)
    {
      var newTab = {
        id: tab.id,
        firstRequest: true,
        albumName: request.albumName,
        albumArtist: request.albumArtist
      };

      chrome.storage.sync.get(HISTORY, function(albums)
      {
        if (!albums[HISTORY])
          albums[HISTORY] = [];
        albums[HISTORY].push(request);
        if (albums[HISTORY].length > 10)
          albums[HISTORY].splice(0, 1);
        chrome.storage.sync.set(albums);
        updateHistory(request);
      });
      tabs.push(newTab);
    });
  }

  function updateCurrentSite(currentSite)
  {
     chrome.tabs.query({windowId: window.id}, function(allTabs)
     {
       allTabs.forEach(function(tab)
       {
         chrome.tabs.sendMessage(tab.id, {type: "UpdateCurrentSite", currentSite: currentSite});
       });
     });
  }

  function saveCurrentSite(url)
  {
    var currentSite = {};

    currentSite[CURRENT_SITE_KEY] = url;
    chrome.storage.sync.set(currentSite);
    updateCurrentSite(url);
  }

  function changeStatus(state)
  {
    chrome.storage.sync.set(state, function()
    {
      chrome.tabs.query({windowId: window.id}, function(allTabs)
      {
        allTabs.forEach(function(tab)
        {
          chrome.tabs.sendMessage(tab.id, {type: "ChangeStatus", state: state});
        });
      });
    });
  }

  if (request.type == "NewWindow")
    createNewWindow(request);
  else if (request.type == "UpdateCurrentSite")
    updateCurrentSite(request.currentSite.CurrentSite);
  else if (request.type == "SavedInput")
    saveCurrentSite(request.currentSite);
  else if (request.type == "ChangeStatus")
    changeStatus(request.state);
  return (true);
});
