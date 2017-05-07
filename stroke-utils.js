var doBestPairings = 0;

function lineEquation(point1, point2) {

	var lineObj = {
		slope: (point1.y - point2.y) / (point1.x - point2.x)
	}, parts;

	lineObj.yIntercept = point1.y - lineObj.slope * point1.x;

	lineObj.toString = function() {

		if (Math.abs(lineObj.slope) === Infinity) {
			return 'x = ' + point1.x;
		}
		else {
			parts = [];

			if (lineObj.slope !== 0) {
				parts.push(lineObj.slope + 'x');
			}

			if (lineObj.yIntercept !== 0) {
				parts.push(lineObj.yIntercept);
			}

			return 'y = ' + parts.join(' + ');
		}
	};

	return lineObj;
}

function Point(x,y) {
  this.x = x;
  this.y = y;
}

function distance(p1, p2) {
  var a = p1.x - p2.x;
  var b = p1.y - p2.y;
  return Math.sqrt(a * a + b * b);
}

function curveToLineAsCurve(type, pts, vroke) { // take 2

  if (vroke.type != 'Q' || pts.length != 2)
    throw Error('bad input'+vroke.type+ pts.length);

  // var startIdx = minDist(vehicles, start);
  // var endIdx = minDist(vehicles, end);
  type = 'Q';

  var vehicles = vroke.vehicles;
  var start = pts[0];
  var end = pts[1];
  var dst = distance(start, end);
  var numToAssign = vehicles.length - 2;
  var interval = dst / (numToAssign + 1); // interval

  //var lineEq = lineEquation(start, end);
  vehicles[0].target.x = start.x;
  vehicles[0].target.y = start.y;
  vehicles[vehicles.length-1].target.x = end.x;
  vehicles[vehicles.length-1].target.y = end.y;

  // Determine line lengths
  var xlen = end.x - start.x;
  var ylen = end.y - start.y;

  dbgs = [start];

  // Determine hypotenuse length
  var hlen = Math.sqrt(Math.pow(xlen,2) + Math.pow(ylen,2));

  for (var i = 1; i < vehicles.length-1; i++) {

    var smallerLen = interval * i;

    // Determine the ratio between they shortened value and the full hypotenuse.
    var ratio = smallerLen / hlen;

    var smallerXLen = xlen * ratio;
    var smallerYLen = ylen * ratio;

    // The new X point is the starting x plus the smaller x length.
    var smallerX = start.x + smallerXLen;

    // Same goes for the new Y.
    var smallerY = start.y + smallerYLen;

    vehicles[i].target.x = smallerX;
    vehicles[i].target.y = smallerY;

    dbgs.push(new Point(smallerX, smallerY));
  }

  dbgs.push(end);
}

function maxDistIdx(pts, target) {
  var idx = -1, maxDist = 0;
  for (var i = 0; i < pts.length; i++) {
    var d = distance(pts[i], target);
    if (d > maxDist) {
      maxDist = d;
      idx = i;
    }
  }
  return idx;
}

function minDistIdx(pts, target) {
  var idx = -1, minDist = Number.MAX_VALUE;
  for (var i = 0; i < pts.length; i++) {
    var d = distance(pts[i], target);
    if (d < minDist) {
      minDist = d;
      idx = i;
    }
  }
  return idx;
}


function curveToLine(vroke) { // take 1
  var maxDist = 0, maxI = -1, maxJ = -1, vehicles = vroke.vehicles;
  for (var i = 0; i < vehicles.length; i++) {
    for (var j = i+1; j < vehicles.length; j++) {
      var d = distance(vehicles[i].target, vehicles[j].target);
      if (d > maxDist) {
        maxDist = d;
        maxI = i;
        maxJ = j;
      }
    }
  }

  for (var i = vehicles.length; i > -1; i--) {
    if (i != maxI && i != maxJ)
      vehicles.splice(i, 1);
  }

  if (this.vehicles.length != 2)
    throw Error('bad count='+this.vehicles.length);
}

function pathToVrokes(path) {

  var qpts = [], strokes = [], last;

  for (var i = 0; i < path.length; i++) {

    var cmd = path[i];

    if (cmd.type === 'M') {

      if (last && last.type === 'Q' && qpts.length) {
        strokes.push(new Vroke(last.type, qpts));
        //console.log(qpts);
        qpts = [];
      }
    }
    else if (cmd.type === 'L') {

      // case: end quad (last=Q)
      if (last.type === 'Q' && qpts.length) {
        strokes.push(new Vroke(last.type, qpts));
        //console.log(qpts);
        qpts = [];
      }

      // case: end line (last=M)
      //strokes.push( addLine( [last.x,last.y,cmd.x,cmd.y] ));
      strokes.push(new Vroke(cmd.type, [last.x,last.y,cmd.x,cmd.y]));
    }
    else if (cmd.type === 'Q') {

      if (!qpts.length)//last.type === 'M')
        qpts.push(last.x, last.y);

      // add to quad-list
      qpts.push(cmd.x1, cmd.y1, cmd.x, cmd.y);
    }
    else if (cmd.type === 'Z') {

      if (last.type === 'Q' && qpts.length) {
        strokes.push(new Vroke(last.type, qpts));
        //console.log(qpts);
        qpts = [];
      }
    }
    else
     throw Error('Unexpected type: '+cmd.type, path);

    last = cmd;
  }

  return strokes;
}

function pathToStrokes(path) {

  //logPath(path);

  var qpts = [], strokes = [], last;

  for (var i = 0; i < path.length; i++) {

    var cmd = path[i];

    if (cmd.type === 'M') {

      if (last && last.type === 'Q' && qpts.length) {
        strokes.push(new Stroke(last.type, qpts));
        qpts = [];
      }
    }
    else if (cmd.type === 'L') {

      // case: end quad (last=Q)
      if (last.type === 'Q' && qpts.length) {
        strokes.push(new Stroke(last.type, qpts));
        qpts = [];
      }

      // case: end line (last=M)
      strokes.push(new Stroke(cmd.type, [last.x,last.y,cmd.x,cmd.y]));
    }
    else if (cmd.type === 'Q') {

      if (!qpts.length)
        qpts.push(last.x, last.y);

      // add to quad-list
      qpts.push(cmd.x1, cmd.y1, cmd.x, cmd.y);
    }
    else if (cmd.type === 'Z') {

      if (last.type === 'Q' && qpts.length) {
        strokes.push(new Stroke(last.type, qpts));
        qpts = [];
      }
    }
    else
      throw Error('Unexpected type: '+cmd.type, path);

    last = cmd;
  }

  return strokes;
}


function Vroke(t, points) {

  this.type = t;
  this.vehicles = [];
  this.stroke = '#f00;';

  if (points) {

    for (var i = 0; i < points.length; i+=2) {
      var target = createVector(points[i], points[i+1]);
      var position = createVector(random(0, width), random(0, height));
      var acceleration = createVector();
      var velocity = p5.Vector.random2D();
      this.vehicles.push(new Vehicle(3, target, position, acceleration, velocity));
    }
  }

  this.reset = function(type, points) {

    var difference = points.length - this.vehicles.length;

    if (this.type === type) {

      if (type ==='Q') { // both quads, adjust num vehicles

        if (difference > 0) {

          for (var i = 0; i < difference; i++) {
            var randomIndex = floor(random(this.vehicles.length));
            var v = this.vehicles[randomIndex].copy();
            this.vehicles.splice(randomIndex, 0, v);
          }

        } else if (difference < 0) {

          for (var i = 0; i < difference * -1; i++) {
            var randomIndex = floor(random(this.vehicles.length));
            this.vehicles.splice(randomIndex, 1);
          }
        }
      }
    }
    else {

      if (type ==='Q') { // new one is a quad, add extras

        for (var i = 0; i < difference; i++) {
          var randomIndex = floor(random(this.vehicles.length));
          var v = this.vehicles[randomIndex].copy();
          this.vehicles.splice(randomIndex, 0, v);
        }

      }
      else { // new one is a line, remove extras
        //console.log('q -> l',this.vehicles);
        curveToLineAsCurve(type, points, this);
        type = 'Q';
        //console.log('q -> l',type, this.vehicles);
      }

      this.type = type; // change type
    }

    var pairings = [];
    for (var i = 0; i < points.length; i++) {
      pairings[i] = i;
    }

    if (doBestPairings) {

      var a = [], b = [];
      for (var i = 0; i < points.length; i++) {
        a.push(this.vehicles[i].target.x, this.vehicles[i].target.y);
        b.push(points[i].x, points[i].y);
      }

      pairings = bestPairings(a, b);

      if (pairings.length !== points.length)
        throw Error('Bad pairings');

      //console.log('ok pairings', pairings);
    }

    // now set the targets
    for (var i = 0; i < points.length; i++) {
      var p = pairings[i];
      //console.log(i, pairings[i], points[i]);
      this.vehicles[i].target.x = points[pairings[i]].x;
      this.vehicles[i].target.y = points[pairings[i]].y;
    }
  }

  this.resetTargets = function(stroke) {

    function toArray(stroke) {
      var points = [];
      for (var i = 0; i < stroke.vehicles.length; i++) {
        points.push(stroke.vehicles[i].target);
      }
      return points;
    }

    this.reset(stroke.type, toArray(stroke));
  }

  //////////////////////////////////////////////////////////////////////////////

  this.copy = function() {
    var s = new Vroke(this.type);
    for (var i = 0; i < this.vehicles.length; i++)
      s.vehicles.push(this.vehicles[i].copy());
    return s;
  }

  this.render = function() {

    noFill();
    stroke(this.stroke);

    // update/draw vehicles
    for (var i = 0; i < this.vehicles.length; i++) {
      this.vehicles[i].update();//draw();
    }

    // draw connections
    if (this.type == 'L') {
      var p1 = this.vehicles[0].pos;
      var p2 = this.vehicles[1].pos;
      line(p1.x, p1.y, p2.x, p2.y);
    }
    else {

      beginShape();
      var p0 = this.vehicles[0].pos;
      vertex(p0.x, p0.y);
      for (var j = 1; j < this.vehicles.length; j+=2) {
        var p1 = this.vehicles[j].pos;
        var p2 = this.vehicles[j+1].pos;
        quadraticVertex(p1.x, p1.y, p2.x, p2.y);
      }
      endShape();
    }
  }
}

function Stroke(t, pts) {

  this.type = t;
  this.points = pts;
  this.vehicles = [];
  this.stroke = '#f00;';

  this.toString = function() {
    var s = this.type+'[';
    for (var i = 0; i < this.points.length; i+=2) {
      s += this.points[i] + ',' + this.points[i+1];
    }
    return s + ']';
  }

  this.copy = function() {
    return new Stroke(this.type, this.points);
  }

  this.render = function() {

    var l = this;
    stroke(this.stroke);

    if (this.type == 'L') {
      line(l.points[0], l.points[1], l.points[2], l.points[3]);
      ellipse(l.points[0], l.points[1], 3, 3);
      ellipse(l.points[2], l.points[3], 3, 3);
    }
    else if (this.type == 'Q') {
      beginShape();
      vertex(l.points[0], l.points[1]);
      for (var j = 2; j < l.points.length; j+=4) {
        quadraticVertex(l.points[j], l.points[j+1], l.points[j+2], l.points[j+3]);
      }
      endShape();
    }
  }
}

function logPath(path) {
  var s = '';
  for (var i = 0; i < path.length; i++) {
    if (path[i].type === 'Q') {
      s += path[i].type+"("+round(path[i].x1)+','+round(path[i].y1)+","+round(path[i].x)+','+round(path[i].y)+") ";
    }
    else {
      s += path[i].type+"("+round(path[i].x)+','+round(path[i].y)+") ";
    }
  }
  console.log(s);
}
