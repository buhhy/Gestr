function GestureDebugger(canvas, _forwardBtn, _backBtn, _recalcBtn, _title) {
  var self = this;

  self.canvas = canvas;
  self._forwardBtn = _forwardBtn;
  self._backBtn = _backBtn;
  self._recalcBtn = _recalcBtn;
  self._title = _title;

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

  self._recalcBtn.addEventListener("click", function (evt) {
    if (self.currentData !== undefined)
      self.setPointData(self.currentData.origin, self.currentData.points);
  });

  self.clearStackItems();
  self.levelColors = [
    "315DC4",
    "A85400",
    "35BA30",
    "9C30BA"
  ];
}

GestureDebugger.prototype.setPointData = function (origin, points) {
  this.clearStackItems();
  this.currentData = {
    origin: origin,
    points: points
  };

  rough = new RoughGesture(origin);
  points.forEach(function (point) {
    rough.addPoint(point);
  });

  var refined = new RefinedGesture(rough, this);
};

GestureDebugger.prototype.clearStackItems = function () {
  this.drawStack = [];
  this.hasItems = false;
  this.currentPosition = -1;
  this.canvas.clearCanvas();

  this._backBtn.disabled = true;
  this._forwardBtn.disabled = true;
};

GestureDebugger.prototype.setButtonStatus = function () {
    this._backBtn.disabled = this.currentPosition === 0;
    this._forwardBtn.disabled = this.currentPosition === this.drawStack.length - 1;
};

GestureDebugger.prototype.addStackItem = function (segments, level, title) {
  this.drawStack.push({
    lines: segments,
    level: level || 0,
    title: title || "----"
  });

  if (!this.hasItems) {
    this.hasItems = true;
    this.newPosition(0);
  }

  this.setButtonStatus();

  return segments;
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
      self.canvas.drawCircle(cur.origin, 3, "#" + curColor);
      self.canvas.drawline(cur.origin, cur.origin.add(cur.direction), "#" + curColor);
    });
    self._title.innerText = curItem.title;
    self.currentPosition = index;
    this.setButtonStatus();
  }
};
