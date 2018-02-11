const CURRENT_SITE_KEY = "CurrentSite";
const FR_LANG_PATH = "../lang/fr.json";
const DEEZDLHISTORY = "deezdlHistory";
const SITES_KEY = "SitesKey";
const ACTIVATION_KEY = "ActivationKey";

function updateDefaultSite(event)
{
  var elem;
  var currentSite = {};

  elem = event.target || event.srcElement;
  currentSite[CURRENT_SITE_KEY] = elem.parentNode.getElementsByClassName("text-content")[0].textContent;
  chrome.storage.sync.set(currentSite);
  chrome.runtime.sendMessage({type: "UpdateCurrentSite", currentSite: currentSite});
}

function addAlbumToHistory(album, container)
{
  var div = document.createElement("div");
  var txt = document.createElement("div");
  var albumContainer = document.createElement("div");
  var urlContainer = document.createElement("div");

  div.setAttribute("class", "img-container");
  albumContainer.setAttribute("class", "img-txt-container");
  urlContainer.setAttribute("class", "img-txt-container website");
  albumContainer.textContent = album.albumName;
  urlContainer.textContent = album.url;
  var img = new Image;

  img.src = album.cover;
  img.addEventListener("click", function()
  {
    album.type = "NewWindow";
    chrome.runtime.sendMessage(album);
  });
  txt.insertAdjacentElement('afterbegin', urlContainer);
  txt.insertAdjacentElement('afterbegin', albumContainer);
  div.insertAdjacentElement('afterbegin', txt);
  div.insertAdjacentElement('afterbegin', img);
  container.insertAdjacentElement('afterbegin', div);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
  if (request.type == "UpdateHistory")
  {
    addAlbumToHistory(request, document.getElementById('history-container'));
  }
  return (true);
});

function noWebsite()
{
  var elem = document.getElementById("no-website");

  elem.style.visibility = "visible";
}

function createChoice(value)
{
  var element = document.createElement("div");
  var input = document.createElement("input");
  var cross = document.createElement("a");
  var txt = document.createElement("div");

  input.setAttribute("type", "radio");
  input.setAttribute("value", value);
  input.setAttribute("name", "site");
  input.addEventListener("click", updateDefaultSite);
  txt.textContent = value.replace("https://", "").replace("http://", "");
  txt.className = 'text-content';
  element.className = 'site-container';
  element.insertAdjacentElement('afterbegin', input);
  element.insertAdjacentElement('beforeend', txt);
  element.insertAdjacentElement('beforeend', cross);

  cross.className += "cross-container";
  cross.addEventListener("click", function(e)
  {
    e.preventDefault();
    chrome.storage.sync.get(SITES_KEY, function(sites)
    {
      for (var i = 0; i < sites[SITES_KEY].length; i++)
      {
        if (sites[SITES_KEY][i].href == value)
        {
          sites[SITES_KEY].splice(i, 1);
          break ;
        }
      }
      chrome.storage.sync.set(sites);
      element.remove();
    });
  });

  return element;
}

function callback()
{
  function setCurrentSite(currentSite)
  {
    var inputs = document.getElementsByTagName("input");

    for (var i = 0; i < inputs.length; ++i)
    {
      if (inputs[i].value == currentSite)
        inputs[i].checked = true;
      else
        inputs[i].checked = false;
    }
  }

  chrome.storage.sync.get(ACTIVATION_KEY, function(state)
  {
    if (state[ACTIVATION_KEY] == false)
      showDeactivateButton();
    else
      showActivateButton();
  });

  list = document.getElementById("website-list");
  chrome.storage.sync.get(SITES_KEY, function(sites)
  {
    var currentSite;
    var noResearchWebsite = document.getElementById("no-research-website")

    list = document.getElementById("website-list");
    if (!sites[SITES_KEY] || sites[SITES_KEY].length == 0)
      return ;
    else
      noResearchWebsite.remove();
    sites[SITES_KEY].forEach(function(site)
    {
      list.insertAdjacentElement('beforeend', createChoice(site.href));
    });
    chrome.storage.sync.get(CURRENT_SITE_KEY, function(currentSite)
    {
      setCurrentSite(currentSite[CURRENT_SITE_KEY]);
    });
  });

  chrome.storage.sync.get("deezdlHistory", function(a)
  {
    var container = document.getElementById('history-container');
    var noHistory = document.getElementById('no-history')

    if (a && a.deezdlHistory)
    {
      a.deezdlHistory.forEach(function(album)
      {
        if (noHistory.style.visibility == "visible" || noHistory.style.visibility == "")
          noHistory.remove();
        addAlbumToHistory(album, container);
      });
    }
  });

  var activatedButton = document.getElementById('is-activate');
  var deactivatedButton = document.getElementById('is-deactivate');

  function showDeactivateButton()
  {
    activatedButton.style.visibility = "hidden";
    activatedButton.style.height = "0px";
    deactivatedButton.style.visibility = "visible";
    deactivatedButton.style.height = "auto";
  }

  function showActivateButton()
  {
    activatedButton.style.visibility = "visible";
    activatedButton.style.height = "auto";
    deactivatedButton.style.visibility = "hidden";
    deactivatedButton.style.height = "0px";
  }

  activatedButton.addEventListener("click", function()
  {
    var state = {};

    state[ACTIVATION_KEY] = false;
    showDeactivateButton();
    chrome.runtime.sendMessage({type: "ChangeStatus", state: state});
  });

  deactivatedButton.addEventListener("click", function()
  {
    var state = {};

    state[ACTIVATION_KEY] = true;
    showActivateButton();
    chrome.runtime.sendMessage({type: "ChangeStatus", state: state});
  });

  document.getElementById("left-arrow").addEventListener("click", function()
  {
    var container = document.getElementById('history-container');
    var scrollMax = 200
    var currValue = 0
    var step = 20
    var inter

    function setScroll()
    {
      container.scrollLeft = container.scrollLeft - step >= 0 ? container.scrollLeft - step : 0;
      currValue += step;
      if (currValue >= scrollMax)
        clearInterval(inter);
    }

    inter = setInterval(setScroll, 10)
  });

  document.getElementById("right-arrow").addEventListener("click", function()
  {
    var container = document.getElementById('history-container');
    var scrollMax = 200
    var currValue = 0
    var step = 20
    var inter

    function setScroll()
    {
      container.scrollLeft = container.scrollLeft + step <= container.scrollWidth ? container.scrollLeft + step : container.scrollWidth;
      currValue += step;
      if (currValue >= scrollMax)
        clearInterval(inter);
    }

    inter = setInterval(setScroll, 10)
  });
};

document.addEventListener("DOMContentLoaded", function()
{
  var list;
  var sites = {};
  var lang = navigator.language || navigator.userLanguage;

  if (lang == 'fr')
    new Translation(FR_LANG_PATH).translate(callback);
  else
    callback();
});
