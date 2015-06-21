var printGesture = function (seglist) {
  return "[\n"
    + seglist.map(function (seg) {
      return "  new Segment("
          + "new Vector(" + seg.origin.x + "," + seg.origin.y + "),"
          + "new Vector(" + seg.direction.x + "," + seg.direction.y + ")"
          + ")";
    }).join(",\n")
    + "\n]";
};

var offsetAndScaleGesture = function (points, size, offset)  {
  var minPoint = Vector.fromJson(points.reduce(function (min, point) {
    if (min === null)
      return { x: point.x, y: point.y };
    return {
      x: Math.min(min.x, point.x),
      y: Math.min(min.y, point.y)
    };
  }, null));

  var maxPoint = Vector.fromJson(points.reduce(function (max, point) {
    if (max === null)
      return { x: point.x, y: point.y };
    return {
      x: Math.max(max.x, point.x),
      y: Math.max(max.y, point.y)
    };
  }, null));

  var canvasSize = size.subtract(offset.multiply(2));
  var boundingSize = maxPoint.subtract(minPoint);

  var scale = Math.min(
      canvasSize.x / boundingSize.x, canvasSize.y / boundingSize.y);
  var newBoundingSize = boundingSize.multiply(scale);
  var shiftOffset = size
      .subtract(newBoundingSize)
      .multiply(0.5);

  return points.map(function (point) {
    return point.subtract(minPoint).multiply(scale).add(shiftOffset);
  });
};

var testData1 = [
  new Vector(319,545),
  new Vector(297,555),
  new Vector(295,557),
  new Vector(293,557),
  new Vector(291,559),
  new Vector(289,560),
  new Vector(287,562),
  new Vector(284,564),
  new Vector(282,566),
  new Vector(280,567),
  new Vector(276,571),
  new Vector(274,572),
  new Vector(272,574),
  new Vector(270,575),
  new Vector(240,734),
  new Vector(242,735),
  new Vector(243,737),
  new Vector(245,738),
  new Vector(247,740),
  new Vector(249,741),
  new Vector(251,743),
  new Vector(322,742),
  new Vector(323,740),
  new Vector(335,733),
  new Vector(336,731),
  new Vector(341,728),
  new Vector(353,712),
  new Vector(355,711),
  new Vector(364,699),
  new Vector(366,698),
  new Vector(370,694),
  new Vector(372,693),
  new Vector(374,691),
  new Vector(431,684),
  new Vector(433,686),
  new Vector(435,687)
];

var initPage = function () {
  var canvas = new Canvas(document.getElementById("debugCanvas"));
  var _nextBtn = document.getElementById("btnBack");
  var _backBtn = document.getElementById("btnNext");
  var _recalcBtn = document.getElementById("btnRecalculate");
  var _title = document.getElementById("title");

  var size = canvas.size();
  var offset = new Vector(75, 75);

  var debugPanel = new GestureDebugger(canvas, _backBtn, _nextBtn, _recalcBtn, _title);

  chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.action === "setGestureData") {
      var origin = new Vector(msg.origin.x, msg.origin.y);
      var points = msg.points.map(function (point) {
        return new Vector(point.x, point.y);
      });
      debugPanel.setPointData(origin, offsetAndScaleGesture(points, size, offset));
    }
  });
};

document.addEventListener('DOMContentLoaded', initPage);
