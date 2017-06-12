
function Letter(font, glyph, x, y, fsize, ignoreAlignment) {

  this.init = function(font, glyph, x, y, fsize, ignoreAlignment) {

    this.x = x;
    this.y = y;
    this.fontSize = fsize || textSize();
    this.font = validateFont(font || textFont());
    this.ctx = this.font.parent._renderer.drawingContext;
    //var p = this.font.parent, pg = p., ctx = pg.drawingContext;
    this.vehicles = []; // 2d array: [paths][vehicles]
    this.glyph = (typeof glyph === 'object') ? glyph : this.font._getGlyphs(glyph)[0];
    console.log(this.glyph);
    this.char = String.fromCharCode(this.glyph.unicode);
    ignoreAlignment || this._doAlignment();
    this.createPath();
    //this.createPaths();
    //this.initVehicles();
  }

  this.createPath = function() {
    this.path = this.glyph.getPath(this.x, this.y, this.fontSize);
    console.log(this.path);
    var bbox = this.path.getBoundingBox();
    this.bounds = { x:box.x1, y:box.y1, w:box.x2-box.x1, h:box.y2-box.y1 }; // x,y,w,h
    var scale = 1 / this.glyph.path.unitsPerEm * this.fontSize, path = this.glyph.path;

    this.points = [];
    for (var i = 0; i < this.glyph.points.length; i++) {
      this.points[i] =  {x: this.x + (this.glyph.points[i].x*scale), y:  this.y - (this.glyph.points[i].y*scale)};
    }
    //this.points = getPoints();
    /*for (var i = 0; i < path.commands.length; i++) {
      console.log(path.commands[i].type);
      var cmd = this.paths[j][i], type = cmd.shift();

      if (type === 'Z') continue;

      var veh = this._createVehicle(cmd[0], cmd[1], type);
      this.vehicles[j].push(veh);

      if (veh.type === 'L') { // convert lines to quads
        veh.type = 'Q';
        var lastX = last[last.length-2];
        var lastY = last[last.length-1];
        var midX = cmd[0] - ((cmd[0] - lastX) / 2);
        var midY = cmd[1] - ((cmd[1] - lastY) / 2);
        cmd = [ midX, midY, cmd[0], cmd[1] ];
      }

      if (veh.type === 'Q') { // add a control point vehicle (TODO: multiple)
        veh.target = createVector(cmd[2], cmd[3]);
        veh.control = this._createVehicle(cmd[0], cmd[1], 'C');
        this.vehicles[j].push(veh.control);
      }
      last = cmd;
    }*/
  }

  this.createPaths = function() {

    function getBoundingBox(path) {
      var box = new BoundingBox(); // opentype BoundingBox
      var startX = 0,startY = 0, prevX = 0, prevY = 0;
      for (var i = 0; i < path.commands.length; i++) {
        var cmd = path.commands[i];
        switch (cmd.type) {
          case 'M':
              box.addPoint(cmd.x, cmd.y);
              startX = prevX = cmd.x;
              startY = prevY = cmd.y;
              break;
          case 'L':
              box.addPoint(cmd.x, cmd.y);
              prevX = cmd.x;
              prevY = cmd.y;
              break;
          case 'Q':
              box.addQuad(prevX, prevY, cmd.x1, cmd.y1, cmd.x, cmd.y);
              prevX = cmd.x;
              prevY = cmd.y;
              break;
          case 'C':
              box.addBezier(prevX, prevY, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
              prevX = cmd.x;
              prevY = cmd.y;
              break;
          case 'Z':
              prevX = startX;
              prevY = startY;
              break;
          default:
              throw new Error('Unexpected path commmand ' + cmd.type);
        }
      }

      if (box.isEmpty()) {
        box.addPoint(0, 0);
      }

      return { x:box.x1, y:box.y1, w:box.x2-box.x1, h:box.y2-box.y1 }; // x,y,w,h
    }

    if (this.char !== ' ') {
      var path = this.glyph.getPath(this.x, this.y, this.fontSize);
      this.bounds = getBoundingBox(path);
      this.paths = splitPaths(path.commands);
    }
    else {
      this.paths = [];
    }
  }

  this._doAlignment = function() {

    var p = this.font.parent, ctx = p._renderer.drawingContext;
    if (p && ctx) {

      var fontSize = this.fontSize, x = this.x, y = this.y,
        textAscent = this.font._textAscent(fontSize),
        textDescent = this.font._textDescent(fontSize),
        textWidth = this.font._textWidth(this.char, fontSize);
      if (ctx.textAlign === p.CENTER) {
        this.x -= textWidth / 2;
      } else if (ctx.textAlign === p.RIGHT) {
        this.x -= textWidth;
      }
      if (ctx.textBaseline === p.TOP) {
        this.y += textAscent;
      } else if (ctx.textBaseline === p._CTX_MIDDLE) {
        this.y += textAscent / 2;
      } else if (ctx.textBaseline === p.BOTTOM) {
        this.y -= textDescent;
      }
    }
  };

  this.copy = function() {

    var l = new Letter(this.font, this.glyph, this.x, this.y, this.fontSize);

    // now update the current positions
    for (var j = 0; j < l.vehicles.length; j++) {
      for (var i = 0; i < l.vehicles[j].length; i++) {
        l.vehicles[j][i].pos = this.vehicles[j][i].pos.copy();
      }
    }

    return l;
  }

  this.destroy = function(x, y) {

    for (var j = 0; j < this.vehicles.length; j++) {
      this.vehicles[j] = [];
    }
    this.vehicles = [];

    for (var j = 0; j < this.paths.length; j++) {
      this.paths[j] = [];
    }
    this.paths = [];

    delete this.glyph;
  }

  this.position = function(x, y) {

    if (!arguments.length) {
      return {x: this.x, y: this.y };
    }

    //var xOff = x - this.x, yOff = y - this.y;
    this.x = x;
    this.y = y;

    this.createPaths();
    for (var i = 0; i < this.paths.length; i++) {
      this.resetVehicles(i);
    }
  }

  this.pathCount = function() {
    return this.paths.length;
  }

  this.morph = function(letter, x, y, fs) {

    //console.log('morph', letter, x, y, fs);

    function copyVehicleArray(v) {
      var result = [];
      for (var i = 0; i < v.length; i++) {
        result.push(v[i].copy());
      }
      return result;
    }

    if (arguments.length > 1) { // set position as well
      this.x = x;
      this.y = y;
      this.fontSize = fs || this.fontSize;
    }

    var current = this.vehicles.length;
    this.glyph = font._getGlyphs(letter)[0];
    this.createPaths();
    var difference = this.paths.length - current;

    // TODO: smarter/smoother adding/deleting of vehicle arrays

    if (difference > 0) { // fewer, add some

      //console.log('adding');
      for (var i = 0; i < difference; i++) {
        var randomIndex = floor(random(this.vehicles.length));
        var v = copyVehicleArray(this.vehicles[randomIndex]);
        this.vehicles.splice(randomIndex, 0, v);
      }

    } else if (difference < 0) { // more, remove some

      //console.log('removing ',-difference);
      for (var i = 0; i < -difference; i++) {
        var randomIndex = floor(random(this.vehicles.length));
        var toRemove = this.vehicles[randomIndex];
        this.vehicles.splice(randomIndex, 1);
        //for (var j = 0; j < toRemove.length; j++)
          //toRemove[j].destroy();
        toRemove = [];
      }
    }

    if (this.paths.length != this.vehicles.length)
      throw Error('1. invalid state: letter='+letter+
      ' ('+this.paths.length+') '+this.vehicles.length);

    // We now have an equal # of paths, now handle vehicles
    for (var i = 0; i < this.paths.length; i++) {
      this.resetVehicles(i);
    }
  }

  this.resetVehicles = function(idx) {

    var points = this.paths[idx]; // points for this path
    var vehicles = this.vehicles[idx]; // vehicles for the last path

    // total count of points for this path, including control points
    var totalPts = this.countPoints(points);

    // detach the control points
    for (var i = 0; i < vehicles.length; i++) {
      vehicles[i].control = undefined;
    }

    var difference = totalPts - vehicles.length;

    // add or remove vehicles to match the total point counts
    // then loop through, assigning data and control points
    if (difference > 0) { // add

      for (var i = 0; i < difference; i++) {
        var randomIndex = floor(random(vehicles.length));
        var v = vehicles[randomIndex].copy();
        vehicles.splice(randomIndex, 0, v);
      }

    } else if (difference < 0) {

      for (var i = 0; i < difference * -1; i++) {
        var randomIndex = floor(random(vehicles.length));
        vehicles.splice(randomIndex, 1);
      }
    }

    if (totalPts != vehicles.length)
      throw Error('2. invalid state: letter='+letter+' ('+totalPts+') '+vehicles.length);

    var last, vIdx = 0;
    for (var i = 0; i < points.length; i++) {

      var cmd = points[i], type = cmd.shift();

      if (type === 'Z') continue;

      var veh = vehicles[vIdx++]; // set the data point vehicle's target
      veh.target = createVector(cmd[0], cmd[1]);
      veh.type = type;

      if (veh.type === 'L') { // convert lines to quads
        veh.type = 'Q';
        var lastX = last[last.length-2];
        var lastY = last[last.length-1];
        var midX = cmd[0] - ((cmd[0] - lastX) / 2);
        var midY = cmd[1] - ((cmd[1] - lastY) / 2);
        cmd = [ midX, midY, cmd[0], cmd[1] ];
      }

      if (veh.type === 'Q') { // add the control point vehicle's target

        veh.target = createVector(cmd[2], cmd[3]);
        veh.control = vehicles[vIdx++];
        veh.control.target =  createVector(cmd[0], cmd[1]);
        veh.control.type = 'C';
      }

      last = cmd;
    }
  }

  this.countPoints = function(path) {
    var total = 0;
    for (var i = 0; i < path.length; i++) {
      var type = path[i][0];
      if (path[i][0] !== 'Z') { // M = 1, L/Q = 2, Z = 0
        total += (type === 'M') ? 1 : 2;
      }
    }
    //console.log('path has '+total + ' total pts);
    return total;
  }

  this._createVehicle = function(vx, vy, type) {
    var startInPosition = true;
    var xOff = this.bounds ? this.bounds.w / 2 : 0;
    var yOff = this.bounds ? this.bounds.h / -2 : 0;
    var target = createVector(vx, vy);
    //var position = createVector(random(0, width), random(0, height));
    var position = startInPosition ? target.copy() : createVector(this.x+xOff, this.y+yOff);
    var acceleration = createVector();
    var velocity = p5.Vector.random2D();
    var veh = new Vehicle(3, target, position, acceleration, velocity);
    veh.type = type;
    return veh;
  }

  this.center = function() {

    var b = this.bounds;
    return { x: b.x + b.w/2, y: b.y + b.h/2 };
  }

  function getPoints() {

    var x = this.x, y = this.y, fontSize = this.fontSize;
    var scale = 1 / this.glyph.path.unitsPerEm * fontSize, path = this.glyph.path;
    var points = [];

    function drawCircles(l, x, y, scale) {
        var PI_SQ = Math.PI * 2;
        //ctx.beginPath();
        for (var j = 0; j < l.length; j += 1) {
            var pt = { 'x': x + (l[j].x * scale), 'y': y + (l[j].y * scale) }
            points.push(pt);
            //ctx.moveTo(x + (l[j].x * scale), y + (l[j].y * scale));
            //ctx.arc(x + (l[j].x * scale), y + (l[j].y * scale), 2, 0, PI_SQ, false);
        }
        //ctx.closePath();
        //ctx.fill();
    }

    for (var i = 0; i < path.commands.length; i += 1) {
        var cmd = path.commands[i];
        if (cmd.x !== undefined) {
            blueCircles.push({x: cmd.x, y: -cmd.y});
        }

        if (cmd.x1 !== undefined) {
            redCircles.push({x: cmd.x1, y: -cmd.y1});
        }

        if (cmd.x2 !== undefined) {
            redCircles.push({x: cmd.x2, y: -cmd.y2});
        }
    }

    drawCircles(blueCircles, x, y, scale);
    drawCircles(redCircles, x, y, scale);

    return points;
  }

  this.initVehicles = function() {

    var last;
    for (var j = 0; j < this.paths.length; j++) {

      this.vehicles[j] = [];
      for (var i = 0; i < this.paths[j].length; i++) {

        var cmd = this.paths[j][i], type = cmd.shift();

        if (type === 'Z') continue;

        var veh = this._createVehicle(cmd[0], cmd[1], type);
        this.vehicles[j].push(veh);

        if (veh.type === 'L') { // convert lines to quads
          veh.type = 'Q';
          var lastX = last[last.length-2];
          var lastY = last[last.length-1];
          var midX = cmd[0] - ((cmd[0] - lastX) / 2);
          var midY = cmd[1] - ((cmd[1] - lastY) / 2);
          cmd = [ midX, midY, cmd[0], cmd[1] ];
        }

        if (veh.type === 'Q') { // add a control point vehicle (TODO: multiple)
          veh.target = createVector(cmd[2], cmd[3]);
          veh.control = this._createVehicle(cmd[0], cmd[1], 'C');
          this.vehicles[j].push(veh.control);
        }
        last = cmd;
      }
    }
    //logV(this.vehicles[0]);
  }

  this.draw = function(mx, my, drawBounds) {

    function circle(ctx, cx, cy, rad) {
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, 2 * Math.PI, false);
      //ctx.fillStyle = 'green';
      //ctx.fill();
      ctx.lineWidth = .3;
      ctx.strokeStyle = '#00ff00';
      ctx.stroke();
    }
    function rect(ctx, cx, cy, sz) {
      ctx.rect(cx-sz/2,cy-sz/2,sz,sz);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    //this.update(mx, my).render(drawBounds);
    this.glyph.drawPoints(this.ctx, this.x, this.y, this.fontSize);

    for (var i = 0; i < this.points.length; i++) {
      //console.log( this.points[i].x, this.points[i].y);
      circle(this.ctx, this.points[i].x, this.points[i].y, 3);
    }

    this.drawGlyph('white');
  }

  this.drawGlyph = function (stroke, fill) {
    stroke = stroke || 'white';
    var ctx = this.ctx;
    ctx.beginPath();
    for (var i = 0; i < this.path.commands.length; i += 1) {
      var cmd = this.path.commands[i];
      if (cmd.type === 'M') {
          ctx.moveTo(cmd.x, cmd.y);
      } else if (cmd.type === 'L') {
          ctx.lineTo(cmd.x, cmd.y);
      } else if (cmd.type === 'C') {
          ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
      } else if (cmd.type === 'Q') {
          ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
      } else if (cmd.type === 'Z') {
          ctx.closePath();
      }
    }

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  this.update = function(mx, my) {

    for (var j = 0; j < this.vehicles.length; j++) {
      for (var i = 0; i < this.vehicles[j].length; i++) {
        this.vehicles[j][i].update(mx, my);
      }
    }
    return this;
  }

  this.render = function(drawBounds) {

    var p = this.font.parent, pg = p._renderer, ctx = pg.drawingContext;

    ctx.save();
    //ctx.lineWidth = 1;
    //ctx.fillStyle = '#444';
    //ctx.strokeStyle = '#fff';
    for (var j = 0; j < this.vehicles.length; j++) {
      ctx.beginPath();

      for (var i = 0; i < this.vehicles[j].length; i++) {
        var vehicle = this.vehicles[j][i];
        var x = vehicle.pos.x, y = vehicle.pos.y;
        if (vehicle.type === 'M') {
          ctx.moveTo(x,y);
        } else if (vehicle.type === 'L') {
          ctx.lineTo(x,y);
        } else if (vehicle.type === 'Q') {
          ctx.quadraticCurveTo(vehicle.control.pos.x, vehicle.control.pos.y, x, y);
        } else if (vehicle.type === 'Z') {
          ctx.closePath();
        }
      }
      if (pg._doStroke && pg._strokeSet) {
        ctx.stroke();
      }
      if (pg._doFill) {
        ctx.fillStyle = pg._fillSet ? ctx.fillStyle : p._DEFAULT_TEXT_FILL;
        ctx.fill();
      }
      ctx.closePath();
    }

    if (drawBounds) {
      noFill();
      stroke(100);
      rect(this.bounds.x,this.bounds.y,this.bounds.w,this.bounds.h);
    }

    ctx.restore();
  }

  function validateFont(f) {
    if (!(typeof f === 'object' && f.font && f.font.supported)) {
      console.error("Font: ", f);
      throw Error("Not an opentype-compatible font");
    }
    return f;
  }

  this.init.apply(this, arguments);
}

Letter.random = function() {
  return Math.random() < .5 ?
    String.fromCharCode(floor(random(65, 90))) :
    String.fromCharCode(floor(random(97, 122)));
}

function splitPaths(cmds) {

  function cmdToArr(cmd) {
    var arr = [ cmd.type ];
    if (cmd.type === 'M' || cmd.type === 'L') { // moveto or lineto
      arr.push(cmd.x, cmd.y);
    } else if (cmd.type === 'C') {
      arr.push(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    } else if (cmd.type === 'Q') {
      arr.push(cmd.x1, cmd.y1, cmd.x, cmd.y);
    }
    return arr;
  }

  var paths = [], current;
  for (var i = 0; i < cmds.length; i++) {

    if (cmds[i].type === 'M') {
      if (current) {
        paths.push(current);
      }
      current = [];
    }
    current.push(cmdToArr(cmds[i]));
  }

  paths.push(current);

  return paths;
}

function logV(v) {
  setTimeout(function() {
    var s = '';
    for (var i = 0; i < v.length; i++)
      s += "("+round(v[i].pos.x)+','+round(v[i].pos.y)+") ";
    console.log(s);
  }, 1500);
}




// The Bounding Box object

function derive(v0, v1, v2, v3, t) {
    return Math.pow(1 - t, 3) * v0 +
        3 * Math.pow(1 - t, 2) * t * v1 +
        3 * (1 - t) * Math.pow(t, 2) * v2 +
        Math.pow(t, 3) * v3;
}

/**
 * A bounding box is an enclosing box that describes the smallest measure within which all the points lie.
 * It is used to calculate the bounding box of a glyph or text path.
 *
 * On initialization, x1/y1/x2/y2 will be NaN. Check if the bounding box is empty using `isEmpty()`.
 *
 * @exports opentype.BoundingBox
 * @class
 * @constructor
 */
function BoundingBox() {
    this.x1 = Number.NaN;
    this.y1 = Number.NaN;
    this.x2 = Number.NaN;
    this.y2 = Number.NaN;
}

/**
 * Returns true if the bounding box is empty, that is, no points have been added to the box yet.
 */
BoundingBox.prototype.isEmpty = function() {
    return isNaN(this.x1) || isNaN(this.y1) || isNaN(this.x2) || isNaN(this.y2);
};

/**
 * Add the point to the bounding box.
 * The x1/y1/x2/y2 coordinates of the bounding box will now encompass the given point.
 * @param {number} x - The X coordinate of the point.
 * @param {number} y - The Y coordinate of the point.
 */
BoundingBox.prototype.addPoint = function(x, y) {
    if (typeof x === 'number') {
        if (isNaN(this.x1) || isNaN(this.x2)) {
            this.x1 = x;
            this.x2 = x;
        }
        if (x < this.x1) {
            this.x1 = x;
        }
        if (x > this.x2) {
            this.x2 = x;
        }
    }
    if (typeof y === 'number') {
        if (isNaN(this.y1) || isNaN(this.y2)) {
            this.y1 = y;
            this.y2 = y;
        }
        if (y < this.y1) {
            this.y1 = y;
        }
        if (y > this.y2) {
            this.y2 = y;
        }
    }
};

/**
 * Add a X coordinate to the bounding box.
 * This extends the bounding box to include the X coordinate.
 * This function is used internally inside of addBezier.
 * @param {number} x - The X coordinate of the point.
 */
BoundingBox.prototype.addX = function(x) {
    this.addPoint(x, null);
};

/**
 * Add a Y coordinate to the bounding box.
 * This extends the bounding box to include the Y coordinate.
 * This function is used internally inside of addBezier.
 * @param {number} y - The Y coordinate of the point.
 */
BoundingBox.prototype.addY = function(y) {
    this.addPoint(null, y);
};

/**
 * Add a Bézier curve to the bounding box.
 * This extends the bounding box to include the entire Bézier.
 * @param {number} x0 - The starting X coordinate.
 * @param {number} y0 - The starting Y coordinate.
 * @param {number} x1 - The X coordinate of the first control point.
 * @param {number} y1 - The Y coordinate of the first control point.
 * @param {number} x2 - The X coordinate of the second control point.
 * @param {number} y2 - The Y coordinate of the second control point.
 * @param {number} x - The ending X coordinate.
 * @param {number} y - The ending Y coordinate.
 */
BoundingBox.prototype.addBezier = function(x0, y0, x1, y1, x2, y2, x, y) {
    // This code is based on http://nishiohirokazu.blogspot.com/2009/06/how-to-calculate-bezier-curves-bounding.html
    // and https://github.com/icons8/svg-path-bounding-box

    const p0 = [x0, y0];
    const p1 = [x1, y1];
    const p2 = [x2, y2];
    const p3 = [x, y];

    this.addPoint(x0, y0);
    this.addPoint(x, y);

    for (let i = 0; i <= 1; i++) {
        const b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i];
        const a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i];
        const c = 3 * p1[i] - 3 * p0[i];

        if (a === 0) {
            if (b === 0) continue;
            const t = -c / b;
            if (0 < t && t < 1) {
                if (i === 0) this.addX(derive(p0[i], p1[i], p2[i], p3[i], t));
                if (i === 1) this.addY(derive(p0[i], p1[i], p2[i], p3[i], t));
            }
            continue;
        }

        const b2ac = Math.pow(b, 2) - 4 * c * a;
        if (b2ac < 0) continue;
        const t1 = (-b + Math.sqrt(b2ac)) / (2 * a);
        if (0 < t1 && t1 < 1) {
            if (i === 0) this.addX(derive(p0[i], p1[i], p2[i], p3[i], t1));
            if (i === 1) this.addY(derive(p0[i], p1[i], p2[i], p3[i], t1));
        }
        const t2 = (-b - Math.sqrt(b2ac)) / (2 * a);
        if (0 < t2 && t2 < 1) {
            if (i === 0) this.addX(derive(p0[i], p1[i], p2[i], p3[i], t2));
            if (i === 1) this.addY(derive(p0[i], p1[i], p2[i], p3[i], t2));
        }
    }
};

/**
 * Add a quadratic curve to the bounding box.
 * This extends the bounding box to include the entire quadratic curve.
 * @param {number} x0 - The starting X coordinate.
 * @param {number} y0 - The starting Y coordinate.
 * @param {number} x1 - The X coordinate of the control point.
 * @param {number} y1 - The Y coordinate of the control point.
 * @param {number} x - The ending X coordinate.
 * @param {number} y - The ending Y coordinate.
 */
BoundingBox.prototype.addQuad = function(x0, y0, x1, y1, x, y) {
    const cp1x = x0 + 2 / 3 * (x1 - x0);
    const cp1y = y0 + 2 / 3 * (y1 - y0);
    const cp2x = cp1x + 1 / 3 * (x - x0);
    const cp2y = cp1y + 1 / 3 * (y - y0);
    this.addBezier(x0, y0, cp1x, cp1y, cp2x, cp2y, x, y);
};
