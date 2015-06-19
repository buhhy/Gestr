var gestrInit = function () {
  var _canvas = document.createElement("canvas");
  _canvas.classList.add("gestr-canvas");
  document.body.appendChild(_canvas);

  var canvas = new Canvas(_canvas);
  var gc = new GestureController(canvas);

  // canvas needs to be resized constantly...
  window.addEventListener("resize", function () {
    canvas.resize(window.innerWidth, window.innerHeight);
  });
  canvas.resize(window.innerWidth, window.innerHeight);

  document.addEventListener("mousedown", function (aEvent) {
    if (aEvent.which == 3) {
      gc.updateLastRightClickTime();

      // Start the dragging if user doesn't double click fast enough
      if (!DOUBLE_RIGHT_CLICK_FOR_CONTEXT_MENU
          || gc.lastRightClickInterval() > DOUBLE_RIGHT_CLICK_MENU_INTERVAL)
        gc.beginDrag(new Vector(aEvent.clientX, aEvent.clientY));
    }
  });

  document.addEventListener("mousemove", function (aEvent) {
    if (gc.rightMouseDown)
      gc.continueDrag(new Vector(aEvent.clientX, aEvent.clientY));
  });

  document.addEventListener("mouseup", function (aEvent) {
    if (aEvent.which == 3)
      gc.endDrag(new Vector(aEvent.clientX, aEvent.clientY), false);
  });

  document.addEventListener('contextmenu', function(aEvent) {
    if (DOUBLE_RIGHT_CLICK_FOR_CONTEXT_MENU && gc.rightMouseDown)
      // Prevent the context menu from opening if user doesn't double click fast enough
      aEvent.preventDefault();
    else if (Date.now() - gc.gestureReleaseTime <= DOUBLE_RIGHT_CLICK_MENU_INTERVAL)
      // Prevent the context menu from opening if user just released the gesture
      aEvent.preventDefault();
  });
};

gestrInit();
