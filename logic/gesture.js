function RoughGesture(aOrigin) {
  this.origin = aOrigin;
  this.points = [];
}


RoughGesture.prototype.addPoint = function (aPoint) {
  // Don't add a point if it is really close to the most recent point
  if (this.points.length > 0
      && aPoint.subtract(this.points[this.points.length - 1]).length2() <= MOUSE_ROUNDING_TOLERANCE)
    return false;

  this.points.push(aPoint.copy());
  return true;
}

RoughGesture.prototype.render = function (aCanvas) {
  for (var i = 1; i < this.points.length; i++) {
    aCanvas.drawline(
        this.points[i - 1], this.points[i], "#ff0000");
  }
}

RoughGesture.prototype.build = function () {
  var segments = [];

  // Get vectors and initial points from the rough gesture
  for (var i = 0; i < this.points.length - 1; i++) {
    segments.push(new Segment(
        this.points[i].copy(),
        this.points[i + 1].subtract(this.points[i])));
  }

  return segments;
};




function RefinedGesture(roughGesture, debugPanel) {
  this.parallelThreshold = Math.cos(50.0/180.0 * Math.PI);
  this.vectors = [];
  this.origin = roughGesture.origin.copy();
  this.debugPanel = debugPanel;

  var segments = roughGesture.build();
  if (this.debugPanel)
    this.debugPanel.addStackItem(segments, 0, "Original Points");

  segments = this.mergeParallelVectors(segments, this.parallelThreshold);
  if (this.debugPanel)
    this.debugPanel.addStackItem(segments, 1, "Preliminary Merge");

  segments = this.snapVectorsToDirections(segments);
  if (this.debugPanel)
    this.debugPanel.addStackItem(segments, 1, "Segment Snap");

  segments = this.mergeParallelVectors(segments);
  if (this.debugPanel)
    this.debugPanel.addStackItem(segments, 1, "Secondary Merge");

  segments = this.removeInsignificantVectors(segments);
  if (this.debugPanel)
    this.debugPanel.addStackItem(segments, 2, "Post Significance Merge");

  segments = this.fixSegmentOrigins(segments);
  if (this.debugPanel)
    this.debugPanel.addStackItem(segments, 3, "Final Result");

  this.vectors = segments;
}

/**
 * Converts all vectors into one of [ up, down, left, right ] based on their highest component.
 * Immutable
 *
 * @param  {[type]}
 * @return {[type]}
 */
RefinedGesture.prototype.snapVectorsToDirections = function (aVecs) {
  return aVecs.map(function (aCur) {
    var dir;
    if (aCur.direction.x * aCur.direction.x > aCur.direction.y * aCur.direction.y) {
      // Vector points more horizontally, hence remove vertical component
      dir = new Vector(aCur.direction.x, 0);
    } else {
      // Vector points more vertically, hence remove horizontal component
      dir = new Vector(0, aCur.direction.y);
    }

    return new Segment(aCur.origin.copy(), dir);
  });
}

/**
 * Merge all parallel vectors into a single continuous vector.
 * Immutable
 *
 * @param  {[type]}
 * @return {[type]}
 */
RefinedGesture.prototype.mergeParallelVectors = function (segments, threshold) {

  var threshold = threshold || 1;

  if (segments.length === 0)
    return [];

  var processedArray = [ segments[0] ];

  // Merge all parallel vectors
  for (var i = 1; i < segments.length; i++) {
    var last = processedArray.pop();
    var cur = segments[i];

    // If cross product is 0, then parallel
    var cos = cur.dot(last) / Math.sqrt(cur.length2() * last.length2());

    if (compLt(cos, threshold)) {
      processedArray.push(last);
      processedArray.push(cur);
    } else if (compE(cos, 1.0)) {
      processedArray.push(new Segment(last.origin, last.direction.add(cur.direction)));
    } else {
      processedArray.push(
          new Segment(
              last.origin,
              last.direction.add(cur.direction.projectOnto(last.direction))));
    }
  }

  return processedArray;
};

/**
 * Remove all vectors that are insignificant compared to the average vector magnitude.
 * Immutable
 */
RefinedGesture.prototype.removeInsignificantVectors = function (segments) {
  if (segments.length === 0)
    return [];

  /**
   * A vector is considered insignificant if its length is shorter than a percentage of the average
   * length of all significant vectors. The percentage is a constant: VECTOR_MAGNITUDE_TOLERANCE.
   * The number of significant vectors is unknown, and must be calculated. All insignificant vectors
   * are culled.
   */

  // Build list of indices pointing to a vector in the input array.
  var vectorIndices = [];
  for (var i = 0; i < segments.length; i++)
    vectorIndices.push(i);

  // Sort the list of indices based on the magnitude of the vector.
  vectorIndices.sort(function (i1, i2) {
    return segments[i2].direction.length2() - segments[i1].direction.length2();
  });

  var tolerance2 = VECTOR_MAGNITUDE_TOLERANCE * VECTOR_MAGNITUDE_TOLERANCE;
  var sigVecCount = 0;
  var totalSize2 = 0;
  var threshold = 0;

  // Since the list of input vectors are sorted longest first, for any sigVecCount, all vectors
  // before the sigVecCount index must be significant. Keep checking until a vector is counted as
  // insignificant. This indicates any following vectors will be insignificant as well.
  do {
    totalSize2 += segments[vectorIndices[sigVecCount]].direction.length2();
    sigVecCount ++;
    if (sigVecCount >= vectorIndices.length)
      break;
    threshold = tolerance2 * (totalSize2 / (sigVecCount * sigVecCount));
    if (segments[vectorIndices[sigVecCount]].direction.length2() < threshold)
      break;
  } while (1);

  // Copy array for manipulation
  var swappedArray = segments.slice(0);
  var swapsDone = false;
  var maxCount = 0;   // Just so any bugs won't freeze the browser

  // Run a simple forward merge algorithm
  do {
    swapsDone = false;

    // Do swaps of insignificant vectors
    for (var i = 0; i < swappedArray.length - 1; i++) {
      var item = swappedArray[i];
      // If insignificant, swap with next vector
      if (item.length2()  <= threshold) {
        swappedArray[i] = swappedArray[i + 1];
        swappedArray[i + 1] = item;

        // Skip the next 2 because for sure the next two elements in the array will be parallel and
        // be merged eventually.
        i += 2;
        swapsDone = true;
      }
    }

    maxCount ++;
    swappedArray = this.mergeParallelVectors(swappedArray, 1);

    if (this.debugPanel)
      this.debugPanel.addStackItem(swappedArray, -1, "Merge Algorithm");
  } while (swapsDone && maxCount <= 20);

  // The last segment can't be swapped, so needs to be removed if it is insignificant
  var lastElem = swappedArray.pop();
  if (lastElem.length2() > threshold)
    swappedArray.push(lastElem);

  return swappedArray;
};

RefinedGesture.prototype.fixSegmentOrigins = function (segments) {
  if (segments.length === 0)
    return [];

  var realOrigin = segments[0].origin;
  return segments.map(function (segment) {
    var newSegment = new Segment(realOrigin, segment.direction);
    realOrigin = realOrigin.add(segment.direction);
    return newSegment;
  });
};

RefinedGesture.prototype.render = function (aCanvas) {
  for (var i = 0; i < this.vectors.length; i++) {
    var cur = this.vectors[i];
    aCanvas.drawline(cur.origin, cur.origin.add(cur.direction), "#0000ff");
  }
};






function TranslatedGesture(aRefinedGesture) {
  this.directions = [];
  this.origin = aRefinedGesture.origin.copy();

  for (var i = 0; i < aRefinedGesture.vectors.length; i++)
    this.directions.push(this.vectorToDirection(aRefinedGesture.vectors[i].direction));
}

TranslatedGesture.prototype.render = function (aCanvas) {
  var dirStrs = [];
  for (var i = 0; i < this.directions.length; i++) {
    switch (this.directions[i]) {
      case DIR_UP:
        dirStrs.push("UP");
        break;
      case DIR_DOWN:
        dirStrs.push("DOWN");
        break;
      case DIR_LEFT:
        dirStrs.push("LEFT");
        break;
      case DIR_RIGHT:
        dirStrs.push("RIGHT");
        break;
    }
    dirStrs.push();
  }
  console.log(dirStrs.join(", "));
};

TranslatedGesture.prototype.vectorToDirection = function (aVec) {
  if (aVec.x * aVec.x > aVec.y * aVec.y) {
    // X dimension bigger than Y
    return aVec.x > 0 ? DIR_RIGHT : DIR_LEFT;
  } else {
    // Y dimension bigger than X
    return aVec.y > 0 ? DIR_DOWN : DIR_UP;
  }
};

TranslatedGesture.prototype.parseAction = function (aGestureMap) {
  for (var i = 0; i < aGestureMap.length; i++) {
    if (aGestureMap[i].gesture.length !== this.directions.length)
      continue;

    var match = true;
    for (var j = 0; j < aGestureMap[i].gesture.length; j++) {
      if (this.directions[j] !== aGestureMap[i].gesture[j]) {
        match = false;
        break;
      }
    }
    if (match)
      return aGestureMap[i].action;
  }
};

TranslatedGesture.prototype.hasActions = function () {
  return this.directions.length > 0;
};
