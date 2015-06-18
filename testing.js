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





var testData1 = [
  new Segment(new Vector(319,545),new Vector(-22,0)),
  new Segment(new Vector(297,555),new Vector(0,2)),
  new Segment(new Vector(295,557),new Vector(-2,0)),
  new Segment(new Vector(293,557),new Vector(0,2)),
  new Segment(new Vector(291,559),new Vector(-2,0)),
  new Segment(new Vector(289,560),new Vector(0,2)),
  new Segment(new Vector(287,562),new Vector(-3,0)),
  new Segment(new Vector(284,564),new Vector(0,2)),
  new Segment(new Vector(282,566),new Vector(-2,0)),
  new Segment(new Vector(280,567),new Vector(0,4)),
  new Segment(new Vector(276,571),new Vector(-2,0)),
  new Segment(new Vector(274,572),new Vector(0,2)),
  new Segment(new Vector(272,574),new Vector(-2,0)),
  new Segment(new Vector(270,575),new Vector(0,159)),
  new Segment(new Vector(240,734),new Vector(2,0)),
  new Segment(new Vector(242,735),new Vector(0,2)),
  new Segment(new Vector(243,737),new Vector(2,0)),
  new Segment(new Vector(245,738),new Vector(0,2)),
  new Segment(new Vector(247,740),new Vector(2,0)),
  new Segment(new Vector(249,741),new Vector(0,2)),
  new Segment(new Vector(251,743),new Vector(71,0)),
  new Segment(new Vector(322,742),new Vector(0,-2)),
  new Segment(new Vector(323,740),new Vector(12,0)),
  new Segment(new Vector(335,733),new Vector(0,-2)),
  new Segment(new Vector(336,731),new Vector(5,0)),
  new Segment(new Vector(341,728),new Vector(0,-16)),
  new Segment(new Vector(353,712),new Vector(2,0)),
  new Segment(new Vector(355,711),new Vector(0,-12)),
  new Segment(new Vector(364,699),new Vector(2,0)),
  new Segment(new Vector(366,698),new Vector(0,-4)),
  new Segment(new Vector(370,694),new Vector(2,0)),
  new Segment(new Vector(372,693),new Vector(0,-2)),
  new Segment(new Vector(374,691),new Vector(57,0)),
  new Segment(new Vector(431,684),new Vector(0,2)),
  new Segment(new Vector(433,686),new Vector(2,0)),
  new Segment(new Vector(435,687),new Vector(0,89))
];