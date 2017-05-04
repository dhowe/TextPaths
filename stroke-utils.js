var doBestPairings = 1;

function Point(x,y) {
  this.x = x;
  this.y = y;
}

function pathToVrokes(path) {

  var qpts = [], strokes = [], last;

  for (var i = 0; i < path.length; i++) {

    var cmd = path[i];

    if (cmd.type === 'M') {

      if (last && last.type === 'Q' && qpts.length) {
        strokes.push(new Vroke(last.type, qpts));
        qpts = [];
      }
    }
    else if (cmd.type === 'L') {

      // case: end quad (last=Q)
      if (last.type === 'Q' && qpts.length) {
        strokes.push(new Vroke(last.type, qpts));
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
      this.vehicles.push(new Vehicle(dotSize, target, position, acceleration, velocity));
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

        while (this.vehicles.length > 2) {
          this.vehicles.splice(2, 1);
        }

        if (this.vehicles.length != 2)
          throw Error('bad count');
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

      pairings = bestPairing(a, b);

      if (pairings.length !== points.length)
        throw Error('Bad pairings');

      console.log('ok pairings', pairings);
    }

    // now set the targets
    for (var i = 0; i < points.length; i++) {
      var p = pairings[i];
      console.log(i, pairings[i], points[i]);
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
