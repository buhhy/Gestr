function Canvas(_canvas) {
  this._canvas = _canvas;
  this.drawCtx = this._canvas.getContext("2d");

  var size = this.size();
  this.resize(size.x, size.y);
}


Canvas.prototype.size = function () {
  return new Vector(this._canvas.clientHeight, this._canvas.clientWidth);
};

Canvas.prototype.resize = function (x, y) {
  this._canvas.width = x;
  this._canvas.height = y;
};

Canvas.prototype.clearCanvas = function () {
  this.drawCtx.clearRect(0, 0, this._canvas.width, this._canvas.height);
};

Canvas.prototype.drawline = function (p1, p2, aColor) {
  // Default black line color
  var color = aColor || "#000";

  this.drawCtx.beginPath();
  this.drawCtx.moveTo(p1.x, p1.y);
  this.drawCtx.lineTo(p2.x, p2.y);
  this.drawCtx.lineWidth = 1;
  this.drawCtx.strokeStyle = color;
  this.drawCtx.stroke();
};
