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




function RefinedGesture(aRoughGesture) {
  this.vectors = [];
  this.origin = aRoughGesture.origin.copy();


  var allvectors = [];

  // Get vectors and initial points from the rough gesture
  for (var i = 0; i < aRoughGesture.points.length - 1; i++) {
    allvectors.push(new Segment(
        aRoughGesture.points[i].copy(),
        aRoughGesture.points[i + 1].subtract(aRoughGesture.points[i])));
  }

  this.vectors =
    // this.mergeParallelVectors(
      this.removeInsignificantVectors(
        this.mergeParallelVectors(
          this.snapVectorsToDirections(allvectors)
        )
      )
    // );
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
RefinedGesture.prototype.mergeParallelVectors = function (aVecs) {
  var newVec = [];
  var lastPos = undefined;
  var lastDir = new Vector(0, 0);

  // Simplify vectors to one of 4 directions, then combine all parallel vectors
  for (var i = 0; i < aVecs.length; i++) {
    var cur = aVecs[i];
    var curDir = cur.direction;

    var dot = lastDir.dot(curDir);

    if (dot > 0 && compE(dot * dot, lastDir.length2() * curDir.length2())) {
      // Same direction, just append to current direction
      lastDir.x += curDir.x;
      lastDir.y += curDir.y;
    } else {
      // Change in direction, create new vector
      if (lastDir.length2() > 0)
        newVec.push(new Segment(lastPos, lastDir.copy()));

      lastPos = cur.origin.copy();
      lastDir.x = curDir.x;
      lastDir.y = curDir.y;
    }
  }

  // The above loop doesn't account for the last line segment
  if (lastPos !== undefined)
    newVec.push(new Segment(lastPos.copy(), lastDir.copy()));

  return newVec;
};

/**
 * Remove all vectors that are insignificant compared to the average vector magnitude.
 * Immutable
 */
RefinedGesture.prototype.removeInsignificantVectors = function (aVecs) {
  if (aVecs.length === 0)
    return [];

  /**
   * A vector is considered insignificant if its length is shorter than a percentage of the average
   * length of all significant vectors. The percentage is a constant: VECTOR_MAGNITUDE_TOLERANCE.
   * The number of significant vectors is unknown, and must be calculated. All insignificant vectors
   * are culled.
   */

  // Build list of indices pointing to a vector in the input array.
  var vectorIndices = [];
  for (var i = 0; i < aVecs.length; i++)
    vectorIndices.push(i);

  // Sort the list of indices based on the magnitude of the vector.
  vectorIndices.sort(function (i1, i2) {
    return aVecs[i2].direction.length2() - aVecs[i1].direction.length2();
  });

  var tolerance2 = VECTOR_MAGNITUDE_TOLERANCE * VECTOR_MAGNITUDE_TOLERANCE;
  var sigVecCount = 0;
  var totalSize2 = 0;

  // Since the list of input vectors are sorted longest first, for any sigVecCount, all vectors
  // before the sigVecCount index must be significant. Keep checking until a vector is counted as
  // insignificant. This indicates any following vectors will be insignificant as well.
  do {
    totalSize2 += aVecs[vectorIndices[sigVecCount]].direction.length2();
    sigVecCount ++;
    if (sigVecCount >= vectorIndices.length)
      break;
    var threshold = tolerance2 * (totalSize2 / (sigVecCount * sigVecCount));
    if (aVecs[vectorIndices[sigVecCount]].direction.length2() < threshold)
      break;
  } while (1);

  var swappedArray = aVecs.map(function (vec, index) {
    return {
      id: index,
      vec: vec
    };
  });
  // Run a merging algorithm on the insignificant vectors
  var insignificantVectorIds = {};

  vectorIndices.slice(sigVecCount).map(function (index) {
    return swappedArray[index].id;
  }).forEach(function (id) {
    insignificantVectorIds[id] = true;
  });

  var acceptedVectors = [];

  if (swappedArray.length > 1) {
    if (!insignificantVectorIds[swappedArray[0].id])
      acceptedVectors.push(swappedArray[0].vec);
    if (!insignificantVectorIds[swappedArray[swappedArray.length - 1].id])
      acceptedVectors.push(swappedArray[swappedArray.length - 1].vec);

    for (var i = 1; i < swappedArray.length - 1; i++) {
      var elem = swappedArray[i];
      if (insignificantVectorIds[elem.id]) {
        var prevElem = swappedArray[i - 1];
        var nextElem = swappedArray[i + 1];

        if (insignificantVectorIds[prevElem.id] && insignificantVectorIds[nextElem.id]) {
          acceptedVectors.push(prevElem.vec.addDirection(nextElem.vec.direction));
        } else if (insignificantVectorIds[prevElem.id]) {
          acceptedVectors.push(prevElem.vec.addDirection(nextElem.vec.direction));
          acceptedVectors.push(elem.vec);
        } else if (insignificantVectorIds[nextElem.id]) {
          acceptedVectors.push(elem.vec);
          acceptedVectors.push(prevElem.vec.addDirection(nextElem.vec.direction));
        } else {
          acceptedVectors.push(prevElem.vec.addDirection(nextElem.vec.direction));
          acceptedVectors.push(elem.vec);
        }
      } else {
        acceptedVectors.push(elem.vec);
      }
    }
  } else {
    acceptedVectors = swappedArray[0].vec;
  }

  return acceptedVectors;

  // // Convert the vector indices back to actual vectors
  // var significantVectors = vectorIndices
  //     .slice(0, sigVecCount)
  //     .sort(function (i1, i2) {
  //       // Sort by index ascending
  //       return i1 - i2;
  //     })
  //     .map(function (aElem) {
  //       // Convert index back to vector
  //       return aVecs[aElem];
  //     });

  // console.log("all: " + aVecs.length + ", significant: " + significantVectors.length);

  // /**
  //  * Do some form of merging algorithm in the future.
  //  */

  // return significantVectors;
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






function Canvas() {
  this.canvasEl = document.createElement("canvas");
  this.drawCtx = this.canvasEl.getContext("2d");
  this.canvasEl.classList.add("gestr-canvas");
  document.body.appendChild(this.canvasEl);

  // canvas needs to be resized constantly...
  window.addEventListener("resize", this.resize.bind(this));
  this.resize();
}


Canvas.prototype.resize = function () {
  this.canvasEl.width = window.innerWidth;
  this.canvasEl.height = window.innerHeight;
};

Canvas.prototype.clearCanvas = function () {
  this.drawCtx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
};

Canvas.prototype.drawline = function (p1, p2, aColor) {
  // Default black line color
  var color = aColor || "#000";

  this.drawCtx.beginPath();
  this.drawCtx.moveTo(p1.x, p1.y);
  this.drawCtx.lineTo(p2.x, p2.y);
  this.drawCtx.lineWidth = 2;
  this.drawCtx.strokeStyle = color;
  this.drawCtx.stroke();
};






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
    if (action)
      console.log(action);
      // action(translated.origin.x, translated.origin.y);
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







var canvas = new Canvas();
var gc = new GestureController(canvas);





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