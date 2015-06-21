function GestureController(aCanvas) {
  this.canvas = aCanvas;
  this.mousePos = new Vector(0, 0);
  this.lastRightClickTime = 0;
  this.currentRightClickTime = 0;
  this.gestureReleaseTime = 0;

  this.rightMouseDown = false;
  this.timeoutHandler = undefined;
  this.currentGesture = undefined;
}


GestureController.prototype.startGestureTimeout = function () {
  var self = this;
  self.timeoutHandler = setTimeout(function () {
    self.endDrag(self.mousePos, true);
  }, GESTURE_PAUSE_TIMEOUT);
};

GestureController.prototype.cancelGestureTimeout = function () {
  clearTimeout(this.timeoutHandler);
  this.timeoutHandler = undefined;
};


GestureController.prototype.beginDrag = function (aMousePos) {
  this.canvas.clearCanvas();
  this.mousePos = aMousePos;
  this.rightMouseDown = true;
  this.currentGesture = new RoughGesture(aMousePos.copy());

  this.cancelGestureTimeout();
  this.startGestureTimeout();
};

GestureController.prototype.endDrag = function (aMousePos, aIsCancelled) {
  // this.canvas.clearCanvas();
  this.rightMouseDown = false;

  this.cancelGestureTimeout();

  if (!aIsCancelled) {
    this.currentGesture.render(this.canvas);
    var refined = new RefinedGesture(this.currentGesture);
    var translated = new TranslatedGesture(refined);

    refined.render(this.canvas);
    translated.render(this.canvas);
    var action = translated.parseAction(ACTION_MAP)

    if (action) {
      console.log(action);
      action(translated.origin.x, translated.origin.y);
    }
    if (translated.hasActions())
      this.gestureReleaseTime = Date.now();
  }
};

GestureController.prototype.continueDrag = function (aMousePos) {
  var curTime = Date.now();

  if (aMousePos.subtract(this.mousePos).length2() >= MOUSE_ROUNDING_TOLERANCE) {
    // If outside the stationary threshold, break the gesture timeout
    this.cancelGestureTimeout();
  }

  this.canvas.drawline(this.mousePos, aMousePos);
  this.mousePos = aMousePos;
  this.currentGesture.addPoint(aMousePos);

  // TODO: might be inefficient
  if (!this.timeoutHandler)
    this.startGestureTimeout();
};


GestureController.prototype.updateLastRightClickTime = function () {
  this.lastRightClickTime = this.currentRightClickTime;
  this.currentRightClickTime = Date.now();
};

GestureController.prototype.lastRightClickInterval = function () {
  return this.currentRightClickTime - this.lastRightClickTime;
};

GestureController.prototype.getLastGesture = function () {
  return this.currentGesture;
};
