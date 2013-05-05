// See the LICENSE file for legal details.
/*jslint white: true, browser: true, sloppy: true, maxlen: 80, nomen: true*/
/*global console, gadgets, iconToAdd_: true, google, initGData, gdataId,
         updateEvent, setIcon: true, show, genImg, currentEvent_,
         allInstances_, gdataService_, makeCallback*/
/*jslint nomen: false*/
var body, width, height, title,
    customFlairs = [],
    userCustomFlairs =
     JSON.parse(localStorage["flair-extender-custom-list"] || "[]"),
    clickHandler = "setIcon('_flair_extender_', this.src)",
    lastUpdate = localStorage["flair-extender-last-update-time"],
    storedList = localStorage["flair-extender-list"];
function areFlairsShowing()
{
 var firstChild = body.children[0];
 if (firstChild && firstChild.tagName === "IMG")
 {
  return firstChild;
 }
 return null;
}
function deleteHandler(e)
{
 var index;
 if (e.which !== 2)
 {
  return;
 }
 e.preventDefault();
 e.stopImmediatePropagation();
 index = userCustomFlairs.indexOf(this.dataset.source);
 if (index !== -1 && confirm("Are you sure you want to delete this flair?"))
 {
  userCustomFlairs.splice(index, 1);
  localStorage["flair-extender-custom-list"] = JSON.stringify(userCustomFlairs);
 }
 updateFlairList();
}
function addFlairs()
{
 var i, length = body.children.length, eLabel, eFlair, event, eManageFlairs,
     eUpdateLink, eCustomLink, flairCount = customFlairs.length;

 /*jslint plusplus: true*/
 for (i = 0; i < length; i++)
 {
 /*jslint plusplus: false*/
  if (body.children[i].tagName !== "IMG")
  {
   eLabel = body.children[i];
   break;
  }
 }
 /*jslint plusplus: true*/
 for (i = 0; i < flairCount; i++)
 {
 /*jslint plusplus: false*/
  eFlair = document.createElement("img");
  eFlair.width = width;
  eFlair.height = height;
  eFlair.style.cursor = "pointer";
  eFlair.title = title;
  eFlair.className = "extension-made";
  eFlair.setAttribute("onclick", clickHandler);
  eFlair.onmousedown = deleteHandler;
  eFlair.dataset.source = customFlairs[i];
  eFlair.src = customFlairs[i];
  body.insertBefore(eFlair, eLabel);
 }
 eUpdateLink = document.createElement("a");
 eUpdateLink.href = "#";
 /*jslint undef: true*/
 eUpdateLink.onclick = updateFlairList;
 /*jslint undef: false*/
 eUpdateLink.appendChild(document.createTextNode("Update list"));
 eCustomLink = document.createElement("a");
 eCustomLink.href = "#";
 eCustomLink.onclick = addCustomFlair;
 eCustomLink.appendChild(document.createTextNode("Custom..."));
 eManageFlairs = document.createElement("div");
 eManageFlairs.className = "extension-made";
 eManageFlairs.appendChild(eUpdateLink);
 eManageFlairs.appendChild(document.createTextNode(" | "));
 eManageFlairs.appendChild(eCustomLink);
 body.insertBefore(eManageFlairs, eLabel);
 event = document.createEvent("Event");
 event.initEvent("FlairExtender.AdjustHeight", true, true);
 window.dispatchEvent(event);  
}
function removeExistingFlairs()
{
 var elements = body.getElementsByClassName("extension-made");
 while (elements.length)
 {
  body.removeChild(elements[0]);
 }
}
function updateFlairList(e)
{
 var request;
 if (e)
 {
  e.preventDefault();
 }
 request = new XMLHttpRequest();
 request.open(
  "get",
  "//phistuck-app.appspot.com/flair-list?tmp=" + (new Date().getTime()),
  true);
 //request.responseType = "json";
 request.onload =
  function ()
  {
   var oldCustomFlairs;
   if (request.status === 200)
   {
    localStorage["flair-extender-last-update-time"] = new Date().getTime();
    /*jslint sub: true*/
    //if (typeof request.response === "object")
    //{
     //customFlairs = request.response["list"];
    //}
    //else
    //{
     oldCustomFlairs = customFlairs;
     customFlairs = JSON.parse(request.response)["list"];
     localStorage["flair-extender-list"] = JSON.stringify(customFlairs);
     customFlairs = customFlairs.concat(userCustomFlairs);
    //}
    if (JSON.stringify(oldCustomFlairs) !== JSON.stringify(customFlairs) &&
        body && areFlairsShowing())
    {
     removeExistingFlairs();
     addFlairs();
    }
    /*jslint sub: false*/
   }
  };
 request.send();
 return false;
}
function addCustomFlair(e)
{
 var src;
 e.preventDefault();
 src =
  window.prompt(
   "Enter the URL of your custom image (will be resized to 16x16).\n" +
   "Middle click on a flair from the list to remove it.\n" +
   "Note - your custom flairs will only be stored in this computer.");
 if (!src)
 {
  return;
 }
 userCustomFlairs.push(src);
 localStorage["flair-extender-custom-list"] = JSON.stringify(userCustomFlairs);
 updateFlairList();
}
function getBody()
{
 if (!body)
 {
  body = document.getElementById("out");
 }
 return body;
}
function inject()
{
 var script;
 function run()
 {
  window.addEventListener(
   "FlairExtender.AdjustHeight",
   function ()
   {
    gadgets.window.adjustHeight();
   },
   false);
  /*jslint nomen: true*/
  setIcon =
   // This is the modified code of the setIcon function
   // from the flair gadget, from Google Inc.
   function (name, url)
   {
    var gdataCallback, gdataId;
    if (name)
    {
     iconToAdd_ =
      url ||
      ('https://www.google.com/googlecalendar/icons/' + name + '.png');
    }
    else
    {
     iconToAdd_ = null;
    }
    show(
     '<span style="padding-left:5px">' + genImg() +
     "Updating the event.</span>");
    initGData();
    if (allInstances_)
    {
     gdataId = google.calendar.read.getRecurringGDataId(currentEvent_);
    }
    else
    {
     gdataId = google.calendar.read.getGDataId(currentEvent_);
    }
    gdataCallback = makeCallback(updateEvent, arguments.callee);
    gdataService_.getCalendarEventEntry(gdataId, gdataCallback);
   };
   /*jslint nomen: false*/
   // End of modified code from the flair gadget.
 }
 script = document.createElement("script");
 script.text = "(" + run.toString() + "())";
 document.documentElement.appendChild(script);
}
window.onmessage =
 function ()
 {
  var firstChild;

  getBody();
  
  if (body.getElementsByClassName("extension-made").length)
  {
   console.log("No need to re-inject! Yeah!!!");
   return;
  }

  firstChild = areFlairsShowing();
  if (firstChild)
  {
   if (!title)
   {
    title = firstChild.title;
    width = firstChild.width;
    height = firstChild.height;
    inject();
   }
   addFlairs();
  }
 };
// We only update the flair list once a day automatically and
// keep it within the localStorage store.
if (!storedList ||
    (lastUpdate &&
     ((new Date()).getTime() -
      (new Date(parseInt(lastUpdate, 10))).getTime()) > 1000 * 60 * 60 * 24))
{
 updateFlairList();
}
else
{
 customFlairs = JSON.parse(storedList);
 customFlairs = customFlairs.concat(userCustomFlairs);
}