/**
 * true - enable double click to open context menu
 * false - keep default context menu on release behaviour
 */
function isDoubleClickContextMenu() {
  if (navigator.appVersion.indexOf("Win")!=-1) return false;
  if (navigator.appVersion.indexOf("Mac")!=-1) return true;
  if (navigator.appVersion.indexOf("X11")!=-1) return true;
  if (navigator.appVersion.indexOf("Linux")!=-1) return true;
  return true;
}

// Maximum time between the double right click to open the context menu. In Linux & OSX, the context
// menu is triggered on mouse down rather than mouse up for some retarded reason, hence the only
// way to prevent the context menu is to trigger it differently, by double right click.
var DOUBLE_RIGHT_CLICK_MENU_INTERVAL = 250;

// Stupid linux and OSX chrome does this dumb thing where the context menu appears on mouse down
// instead of after mouse up. This means we need to do double right click to open the context menu
// on these platforms.
var DOUBLE_RIGHT_CLICK_FOR_CONTEXT_MENU = isDoubleClickContextMenu();

// Holding the mouse in a single place during a gesture for a long time will time it out.
var GESTURE_PAUSE_TIMEOUT = 1000;

// Mouse movements less than this threshold are not recorded. Measured in pixels.
var MOUSE_ROUNDING_TOLERANCE = 2;

// Vectors with a small relative magnitude need to be filtered out for noise. Higher means more
// aggressive optimization, lower means more noise.
var VECTOR_MAGNITUDE_TOLERANCE = 0.3;

var ERROR = 1E-5;



//

/**
 * Direction constants
 * 0 - up
 * 1 - right
 * 2 - down
 * 3 - left
 */
var DIR_UP = 0;
var DIR_RIGHT = 1;
var DIR_DOWN = 2;
var DIR_LEFT = 3;







// Common actions
var leftTab = function () {
  chrome.runtime.sendMessage({ type: "changeTab", shift: -1 }, function (response) { });
};

var rightTab = function () {
  chrome.runtime.sendMessage({ type: "changeTab", shift: 1 }, function (response) { });
};

var goForward = function () {
  history.go(1);
};

var goBack = function () {
  history.go(-1);
};

var refresh = function () {
  window.location.reload();
};

var closeTab = function () {
  chrome.runtime.sendMessage({ type: "closeTab", shift: 1 }, function (response) { });
};

var newTab = function () {
  chrome.runtime.sendMessage({ type: "newTab" }, function (response) { });
};

var goTop = function (aX, aY) {
  var scrollElem = getTopmostScrollableElement(aX, aY);
  console.log(scrollElem);
  if (scrollElem)
    scrollElem.scrollTop = 0;
  else
    window.scrollTo(window.pageXOffset, 0);
};

var goBottom = function (aX, aY) {
  var scrollElem = getTopmostScrollableElement(aX, aY);
  console.log(scrollElem);
  if (scrollElem)
    scrollElem.scrollTop = scrollElem.scrollHeight;
  else
    window.scrollTo(window.pageXOffset, document.body.clientHeight);
};

/**
 * Retrieves the topmost element that is under the given coordinates.
 */
var getTopmostScrollableElement = function (x, y) {
  var elem = document.elementFromPoint(x, y);

  var hasScrollbars = function (elem) {
    var styles = window.getComputedStyle(elem);

    if (styles.overflow === "visible" || styles.overflow === "hidden")
      return false;

    if (styles.display === "none" || styles.opacity === "0")
      return false;

    return elem.scrollWidth > elem.clientWidth || elem.scrollHeight > elem.clientHeight;
  };

  while (elem && !hasScrollbars(elem))
    elem = elem.parentElement;

  if (elem && elem.tagName.toLowerCase() === "html")
    elem = document.body;

  return elem;
};






// Maps a sequence of gestures to an action
var ACTION_MAP = [
  {
    gesture: [DIR_LEFT],
    action: goBack
  }, {
    gesture: [DIR_RIGHT],
    action: goForward
  }, {
    gesture: [DIR_LEFT, DIR_UP],
    action: goTop
  }, {
    gesture: [DIR_LEFT, DIR_DOWN],
    action: goBottom
  }, {
    gesture: [DIR_UP, DIR_LEFT],
    action: leftTab
  }, {
    gesture: [DIR_UP, DIR_RIGHT],
    action: rightTab
  }, {
    gesture: [DIR_DOWN, DIR_RIGHT],
    action: closeTab
  }, {
    gesture: [DIR_LEFT, DIR_RIGHT],
    action: newTab
  }, {
    gesture: [DIR_UP, DIR_DOWN],
    action: refresh
  }
];

function compE(v1, v2) {
  return Math.abs(v1 - v2) <= ERROR;
}

function sum(aArray) {
  return aArray.reduce(function (a, b) { return a + b; });
}
