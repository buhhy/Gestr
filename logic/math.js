function Vector(aX, aY) {
  this.x = aX;
  this.y = aY;
}

Vector.fromJson = function (json) {
  return new Vector(json.x, json.y);
}


Vector.prototype.subtract = function (aVec2) {
  return new Vector(this.x - aVec2.x, this.y - aVec2.y);
};

Vector.prototype.add = function (aVec2) {
  return new Vector(this.x + aVec2.x, this.y + aVec2.y);
};

Vector.prototype.multiply = function (aScale) {
  return new Vector(this.x * aScale, this.y * aScale);
};

Vector.prototype.flip = function () {
  return new Vector(-this.x, -this.y);
};

Vector.prototype.length2 = function () {
  return this.x * this.x + this.y * this.y;
};

Vector.prototype.copy = function () {
  return new Vector(this.x, this.y);
};

Vector.prototype.dot = function (aVec) {
  return this.x * aVec.x + this.y * aVec.y;
};

Vector.prototype.cross = function (aVec) {
  return this.x * aVec.y + this.y * aVec.x;
};

Vector.prototype.normalize = function () {
  var length = Math.sqrt(this.length2());
  return new Vector(this.x / length, this.y / length);
};

function Segment(aOrigin, aVector) {
  this.origin = aOrigin;
  this.direction = aVector;
}

Segment.prototype.addDirection = function (aDirection) {
  return new Segment(this.origin, this.direction.add(aDirection));
};

Segment.prototype.length2 = function () {
  return this.direction.length2();
};

Segment.prototype.dot = function (segment) {
  return this.direction.dot(segment.direction);
};

Segment.prototype.cross = function (segment) {
  return this.direction.cross(segment.direction);
};
