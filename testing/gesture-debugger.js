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

GestureDebugger.prototype.addStackItem = function (vectors) {
  this.drawStack.push(vectors);

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
    self.canvas.clearCanvas();
    self.drawStack[index].forEach(function (cur) {
      self.canvas.drawline(cur.start, cur.end, "#0000ff");
    });
    self.currentPosition = index;
    this.setButtonStatus();
  }
};
