function GestureDebugger(canvas, _forwardBtn, _backBtn) {
  var self = this;

  self.canvas = canvas;
  self._forwardBtn = _forwardBtn;
  self._backBtn = _backBtn;

  self._backBtn.addEventListener("click", function (evt) {
    if (self.hasItems && self.currentPosition > 0) {
      self.newPosition(self.currentPosition - 1);
    }
  });

  self._forwardBtn.addEventListener("click", function (evt) {
    if (self.hasItems && self.currentPosition < self.drawStack.length - 1) {
      self.newPosition(self.currentPosition + 1);
    }
  });

  self.clearStackItems();
  self.levelColors = [
    "315DC4",
    "A85400",
    "35BA30",
    "9C30BA"
  ];
}

GestureDebugger.prototype.clearStackItems = function () {
  this.drawStack = [];
  this.hasItems = false;
  this.currentPosition = -1;

  this._backBtn.disabled = true;
  this._forwardBtn.disabled = true;
};

GestureDebugger.prototype.setButtonStatus = function () {
    this._backBtn.disabled = this.currentPosition === 0;
    this._forwardBtn.disabled = this.currentPosition === this.drawStack.length - 1;
};

GestureDebugger.prototype.addStackItem = function (vectors, level) {
  this.drawStack.push({
    lines: vectors,
    level: level || 0
  });

  if (!this.hasItems) {
    this.hasItems = true;
    this.newPosition(0);
  }

  this.setButtonStatus();

  return vectors;
};

GestureDebugger.prototype.newPosition = function (index) {
  if (index >= 0 && index <= this.drawStack.length - 1
      && index != this.currentPosition) {
    var self = this;
    var curItem = self.drawStack[index];
    var curColor = "444";

    if (curItem.level >= 0 && curItem.level < self.levelColors.length)
      curColor = self.levelColors[curItem.level];

    self.canvas.clearCanvas();
    curItem.lines.forEach(function (cur) {
      self.canvas.drawCircle(cur.start, 3, "#" + curColor);
      self.canvas.drawline(cur.start, cur.end, "#" + curColor);
    });
    self.currentPosition = index;
    this.setButtonStatus();
  }
};
