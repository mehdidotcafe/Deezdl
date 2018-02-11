const ALBUM_ELEMENT_CLASS = "thumbnail-col";
const CATALOG_ELEMENT_CLASS = "catalog-header";
const PAGE_CLASS = "page-content";
const DEEZER_HOST = "www.deezer.com";
const CURRENT_SITE_KEY = "CurrentSite";
const SITES_KEY = "SitesKey";
const ACTIVATION_KEY = "ActivationKey";
const ALBUM_PATH = "/album/"
const host = window.location.host;
const href = window.location.href.replace("http://", "").replace("https://", "");

var currentSite;
var lastUrl = undefined;
var lang

setInterval(watchUrl, 1000 / 30);

(function getLang()
{
  var xhr = new XMLHttpRequest();
  var userLang = navigator.language || navigator.userLanguage;

  function handleStateChange()
  {
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status >= 200 && xhr.status < 400)
    {
      lang = JSON.parse(xhr.responseText);
    }
  }

  if (userLang != "en" && userLang != "fr")
    userLang = "en";
  xhr.onreadystatechange = handleStateChange; // Implemented elsewhere.
  xhr.open("GET", chrome.extension.getURL('/lang/content_' + userLang + ".json"), true);
  xhr.send();
})()

function createDeezdlPopup(txt)
{
  var div = document.createElement('div');
  var img = document.createElement('img');
  var wtxt = document.createElement("span")

  div.style.marginTop = "2vh";
  div.style.marginRight = "2vw";
  div.style.zIndex = "9999";
  div.style.transition = "1s";
  div.style.width = "350px";
  div.style.height = "100px";
  div.style.display = "flex";
  div.style.alignContent = "space-between";
  div.style.justifyContent = "flex-start";
  div.style.border = "1px solid #eee";
  div.style.backgroundColor = "#f8f8f9";
  div.style.position = "absolute";
  div.style.top = "0";
  div.style.right = "0";
  img.style.alignSelf = "center";
  img.src = chrome.extension.getURL("img/logo.png");
  img.width = "50";
  img.height = "50";
  img.style.marginLeft = "20px";

  wtxt.style.fontSize = "20px";
  wtxt.style.fontWeight = "bold";
  wtxt.style.marginLeft = "30px";
  wtxt.style.alignSelf = "center";
  wtxt.style.width = "60%";
  wtxt.style.color = "black";
  wtxt.style.fontFamily = "arial,sans-serif";
  wtxt.textContent = txt;
  div.append(img);
  div.append(wtxt);
  document.getElementsByTagName("body")[0].append(div);

  setTimeout(function()
  {
    div.style.opacity = "0";
  }, 1800)

  setTimeout(function()
  {
    div.remove();
  }, (1800 + 1000));
}

function watchUrl()
{
  if (location.hostname == DEEZER_HOST)
  {
    watchAlbumElement(location.pathname);
  }
}

function watchAlbumElement(currUrl)
{
  var div = document.createElement("div");
  var subdiv = document.createElement("div");
  var subsubdiv = document.createElement("div");
  var btn = document.createElement("button");
  var img = document.createElement("img");

  var container = document.getElementsByClassName("datagrid-toolbar")[0];

  div.classList.add("toolbar-item");
  subdiv.classList.add("tooltip-wrapper");
  btn.classList.add("btn-icon");
  btn.classList.add("btn");
  btn.classList.add("btn-default");
  if (currUrl.indexOf(ALBUM_PATH) != -1)
  {
    if (!document.getElementById("deezdl-button") && document.getElementsByClassName("heading-1").length > 0)
    {
      lastUrl = currUrl;
      img.src = chrome.extension.getURL("img/logo.png");
      img.id = "deezdl-button";
      img.height = 16;
      img.width = 16;
      div.setAttribute("title", lang.download);
      div.addEventListener("click", function(e)
      {
        getAlbumInfo(e, true);
      });
      btn.append(img);
      subsubdiv.append(btn);
      subdiv.append(subsubdiv);
      div.append(subdiv);
      container.append(div);
    }
    else
      lastUrl = undefined;
  }
}

function addEventListeners()
{
  if (host == DEEZER_HOST)
    document.getElementsByClassName(PAGE_CLASS)[0].addEventListener("click", getAlbumInfo);
  else
    document.getElementsByTagName("body")[0].addEventListener("click", setInput);

}

function removeEventListeners()
{
  if (host == DEEZER_HOST)
    document.getElementsByClassName(PAGE_CLASS)[0].removeEventListener("click", getAlbumInfo);
  else
    document.getElementsByTagName("body")[0].removeEventListener("click", setInput);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
{
  if (request.type == "UpdateCurrentSite")
  {
    currentSite = request.currentSite;
  }
  else if (request.type == "Inner")
  {
    fillInput(request);
  }
  else if (request.type == "ChangeStatus")
    changeStatus(request.state);
  return (true);
});

chrome.storage.sync.get(CURRENT_SITE_KEY, function(value)
{
  currentSite = value[CURRENT_SITE_KEY];
});

function changeStatus(state)
{
  if (state[ACTIVATION_KEY] == false)
    removeEventListeners();
  else
    addEventListeners();
}

chrome.storage.sync.get(ACTIVATION_KEY, function(state)
{
  if (state[ACTIVATION_KEY] != false)
  {
    if (host == DEEZER_HOST)
      window.addEventListener("load", watchDeezerDom);
    else if (document.readyState != 'complete')
      window.addEventListener("load", getInput);
    else
      getInput();
  }
});

function saveInput(input)
{
  var savedInput;
  var arr = [];
  var inputs = document.getElementsByTagName("input");
  var nhref = href.replace("https://", "").replace("http://", "");

  for (var i = 0; i < inputs.length; i++)
  {
    if (inputs[i] == input)
      break ;
  }

  savedInput = {
    href: nhref,
    input: i
  };

  chrome.storage.sync.get(SITES_KEY, function(sites)
  {
    if (!sites[SITES_KEY])
      sites[SITES_KEY] = [];
    sites[SITES_KEY].push(savedInput);
    chrome.storage.sync.set(sites);
    chrome.runtime.sendMessage({type: "SavedInput", currentSite: nhref});
    createDeezdlPopup(lang.inputSaved +  " :)");
  });
}

function getParentNodeByTagName(element, tagName)
{
  var node = element;

  while (node && node.tagName != tagName)
    node = node.parentNode;
  return (node);
}

function submitInput(element)
{
  function createEventKeyboard(key, keyCode)
  {
    var e = new Event("keydown");
    var form;
    var changeEvent = new Event('change');

    e.key = key;
    e.keyCode = keyCode;
    e.which = e.keyCode;
    e.altKey = false;
    e.ctrlKey = true;
    e.shiftKey = false;
    e.metaKey = false;
    e.bubbles = true;
    element.dispatchEvent(e);
    element.dispatchEvent(changeEvent);
  }

  element.focus();
  if ((form = getParentNodeByTagName(element, "FORM")))
    form.submit();
  else
    createEventKeyboard('\n', 13);
}

function innerValue(value, albumName, albumArtist)
{
  var inputs = document.getElementsByTagName("input");

  if (value <= inputs.length)
  {
    inputs[value].focus();
    inputs[value].value = albumName + " " + albumArtist;
    submitInput(inputs[value]);
  }
}

function fillInput(request)
{
  var nhref = href.replace("https://", "").replace("http://", "");

  chrome.storage.sync.get(SITES_KEY, function(sites)
  {
    var site;

    for (var i = 0; sites[SITES_KEY].length; i++)
    {
      site = sites[SITES_KEY][i];
      if (site.href == nhref)
      {
        innerValue(site.input, request.albumName, request.albumArtist);
        break ;
      }
    }
  });
}

function getInput()
{
  document.getElementsByTagName("body")[0].addEventListener("click", setInput);
}

function setInput()
{
  var input;
  var children;

  if (event.ctrlKey)
  {
    input = event.target || event.srcElement;
    if (input.tagName == "INPUT")
      saveInput(input);
    else
    {
      children = input.getElementsByTagName("input");
      if (!children || !children.length)
        {
          input = getParentNodeByTagName(input, "INPUT");
          if (input)
            saveInput(input);
          else
            createDeezdlPopup(lang.noInputFound + " :(")
        }
      else
          saveInput(children[0]);
    }
  }
}

function getAlbumInfo(event, forced)
{
   var   currAlbum;
   var   album = {
     type: "NewWindow",
     url: currentSite,
     albumName: "",
     albumArtist: "",
     cover: ""
   };

   function setAlbumFromAlbumElement()
   {
     album.albumName = currAlbum.getElementsByTagName('a')[0].textContent;
     album.albumArtist = currAlbum.getElementsByTagName('a')[1].textContent;
     album.cover = currAlbum.getElementsByTagName('img')[0].src;
   }

   function setAlbumFromCatalogElement()
   {
     album.albumName = currAlbum.getElementsByTagName('h1')[0].textContent;
     album.albumArtist = currAlbum.getElementsByTagName('h2')[0].getElementsByTagName('a')[0].textContent;
     album.cover = currAlbum.getElementsByTagName('img')[0].src;
   }

   if (event.ctrlKey || forced == true)
   {
      currAlbum = event.target || event.srcElement;
      if (forced)
        currAlbum = document.getElementsByClassName(CATALOG_ELEMENT_CLASS)[0];
      else
        while (currAlbum && !currAlbum.classList.contains(ALBUM_ELEMENT_CLASS) && !currAlbum.classList.contains(CATALOG_ELEMENT_CLASS))
          currAlbum = currAlbum.parentNode;
      if (!currAlbum)
        return ;
      else if (!currentSite)
      {
        createDeezdlPopup(lang.noInput + " :(");
        return ;
      }
      else if (currAlbum.classList.contains(ALBUM_ELEMENT_CLASS))
        setAlbumFromAlbumElement();
      else if (currAlbum.classList.contains(CATALOG_ELEMENT_CLASS))
        setAlbumFromCatalogElement();
      chrome.runtime.sendMessage(album);
   }
}

function watchDeezerDom()
{
  var page = document.getElementsByClassName(PAGE_CLASS)[0];

  if (page)
    page.addEventListener("click", getAlbumInfo);
}
