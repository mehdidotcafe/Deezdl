function Translation(param)
{
  var path = param;

  this.translate = function(callback)
  {
    var xhr = new XMLHttpRequest();
    var obj;

    xhr.open("GET", path, true);
    xhr.onload = function(event)
    {
      if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status < 400)
        {
          obj = JSON.parse(xhr.responseText);
          for (var field in obj)
          {
            document.getElementById(obj[field].id).textContent = obj[field].content;
            callback();
          }
        }
    }
    xhr.send();
  }
}
