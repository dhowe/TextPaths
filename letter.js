// Next:
//    inPosition() function
//    fix starting position bug
//    scaling of flee (alphabet.html)
//    do smart morph (include bestPairings)

function Letter(font, glyph, x, y, fsize, ignoreAlignment) {

  this.init = function(font, glyph, x, y, fsize, ignoreAlignment) {

    this.fontSize = fsize || textSize();
    this.font = validateFont(font || textFont());
    this.ctx = this.font.parent._renderer.drawingContext;
    this.glyph = (typeof glyph === 'object') ? glyph : this.font._getGlyphs(glyph)[0];
    this.char = String.fromCharCode(this.glyph.unicode);
    this.x = ignoreAlignment ? x : this._xAlign(x);
    this.y = ignoreAlignment ? y : this._yAlign(y);
    this.createPath();
    this.createVehicles();
    Letter.instances.push(this);
  }

  this.getBounds = function(dynamic) {

    if (!dynamic) return this.bounds;

    var mv = Number.MAX_VALUE, xCoords = [], yCoords = [],
      minX = mv, minY = mv, maxX = -mv, maxY = -mv;

    this.vehicles.forEach(function(v) {
      xCoords.push(v.pos.x);
      yCoords.push(v.pos.y);
    });

    minX = Math.min.apply(null, xCoords);
    minY = Math.min.apply(null, yCoords);
    maxX = Math.max.apply(null, xCoords);
    maxY = Math.max.apply(null, yCoords);

    return {
      x: minX,
      y: minY,
      h: maxY - minY,
      w: maxX - minX,
      advance: minX - this.x
    };
  }

  this.inPosition = function() {
    console.log('NEXT'); // true if all vehicles have arrived at targets
  }

  this.createPath = function() {

    this.path = this.glyph.getPath(this.x, this.y, this.fontSize);
    var box = this.path.getBoundingBox();
    this.bounds = { x:box.x1, y:box.y1, w:box.x2-box.x1, h:box.y2-box.y1 }; // x,y,w,h
    this.scale = 1 / this.glyph.path.unitsPerEm * this.fontSize;
    //console.log(this.glyph); console.log(this.path);
  }

  this.position = function(x, y, ignoreAlignment) {
    if (!arguments.length) {
      return { x: this.x, y: this.y };
    }
    this.target(x, y, ignoreAlignment, true);
  }

  this.target = function(x, y, ignoreAlignment, updatePosition) {

    x = ignoreAlignment ? x : this._xAlign(x);
    y = ignoreAlignment ? y : this._yAlign(y);

    var xOff = x - this.x;
    var yOff = y - this.y;

    this.x = x;
    this.y = y;
    this.createPath();

    for (var i = 0; i < this.vehicles.length; i++) {
      this.vehicles[i].target.add(createVector(xOff, yOff))
      if (updatePosition) {
        this.vehicles[i].pos.add(createVector(xOff, yOff))
      }
    }
  }

  this.createVehicles = function() {

    this.vehicles = [];
    for (var i = 0; i < this.path.commands.length; i++) {

      var cmd = this.path.commands[i];

      if (cmd.type === 'Z') continue;

      var veh = this._createVehicle(cmd.x, cmd.y, cmd.type);
      this.vehicles.push(veh);

      if (veh.type === 'L') {

        // convert lines to quads
        veh.type = 'Q';

        // compute midpoint between last and current
        cmd.x1 = cmd.x - ((cmd.x - last.x) / 2)
        cmd.y1 = cmd.y - ((cmd.y - last.y) / 2)
      }

      if (veh.type === 'Q') {

        veh.control = this._createVehicle(cmd.x1, cmd.y1, 'C');
        //console.log(veh.pos.x,veh.pos.y,'->',veh.control.pos.x,veh.control. pos.y);
        this.vehicles.push(veh.control);
      }
      else if (veh.type !== 'M') {

        throw Error('Unexpected type: '+veh.type);
      }

      last = cmd;
    }

    //console.log('Created '+this.vehicles.length+' vehicles');
  }

  this.copy = function() {

    var l = new Letter(this.font, this.glyph, this.x, this.y, this.fontSize);

    // now update the current positions
    for (var i = 0; i < l.vehicles.length; i++) {
      l.vehicles[i].pos = this.vehicles[i].pos.copy();
    }

    return l;
  }

  this.destroy = function(x, y) {

    this.vehicles = [];
    delete this.path;
    delete this.glyph;
  }

  this.morph = function(letter, x, y, fs) { // not updated

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

  this.draw = function(mx, my, drawBounds) {

    this.update(mx, my);
    this.render(drawBounds);
  }

  this.update = function(mx, my) {

    for (var i = 0; i < this.vehicles.length; i++) {
      this.vehicles[i].update(mx, my);
    }
    return this;
  }

  this.render = function(drawBounds) {

    var p = this.font.parent, pg = p._renderer, ctx = pg.drawingContext;

    ctx.beginPath();
    for (var i = 0; i < this.vehicles.length; i++) {

      var vehicle = this.vehicles[i];
      var x = vehicle.pos.x, y = vehicle.pos.y;

      if (Letter.fillVehicles)
        ctx.fillRect(x-1,y-1,2,2);

      if (vehicle.type === 'M') {
        ctx.moveTo(x, y);
      } else if (vehicle.type === 'Q') {
        ctx.quadraticCurveTo(vehicle.control.pos.x, vehicle.control.pos.y, x, y);
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

    if (drawBounds) {
      noFill();
      stroke(100);
      rect(this.bounds.x,this.bounds.y,this.bounds.w,this.bounds.h);
    }
  }
  this._xAlign = function(x) {

    var p = this.font.parent, ctx = this.ctx;
    if (p && ctx) {
      var fontSize = this.fontSize,
        textWidth = this.font._textWidth(this.char, fontSize);
      if (ctx.textAlign === p.CENTER) {
        x -= textWidth / 2;
      } else if (ctx.textAlign === p.RIGHT) {
        x -= textWidth;
      }
    }
    return x;
  }

  this._yAlign = function(y) {

    var p = this.font.parent, ctx = this.ctx;
    if (p && ctx) {
      var fontSize = this.fontSize,
        textAscent = this.font._textAscent(fontSize),
        textDescent = this.font._textDescent(fontSize);
      if (ctx.textBaseline === p.TOP) {
        y += textAscent;
      } else if (ctx.textBaseline === p._CTX_MIDDLE) {
        y += textAscent / 2;
      } else if (ctx.textBaseline === p.BOTTOM) {
        y -= textDescent;
      }
    }
    return y;
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

Letter.instances = [];

Letter.fillVehicles = false;

Letter.drawAll = function(mx, my) {
  //Letter.speed = .1;
  for (var i = 0; i < Letter.instances.length; i++) {
    Letter.instances[i].draw(mx, my);
  }
}

Letter.destroy = function(t) {
  var idx = Letter.instances.indexOf(t);
  if (idx > -1) Letter.instances.splice(idx,1);
}

Letter.random = function() {
  return Math.random() < .5 ?
    String.fromCharCode(floor(random(65, 90))) :
    String.fromCharCode(floor(random(97, 122)));
}

function logV(v) {
  setTimeout(function() {
    var s = '';
    for (var i = 0; i < v.length; i++)
      s += "("+round(v[i].pos.x)+','+round(v[i].pos.y)+") ";
    console.log(s);
  }, 1500);
}




// The Opentype Bounding Box object ////////////////////////////////////

function derive(v0, v1, v2, v3, t) {
    return Math.pow(1 - t, 3) * v0 +
        3 * Math.pow(1 - t, 2) * t * v1 +
        3 * (1 - t) * Math.pow(t, 2) * v2 +
        Math.pow(t, 3) * v3;
}

function BoundingBox() {
    this.x1 = Number.NaN;
    this.y1 = Number.NaN;
    this.x2 = Number.NaN;
    this.y2 = Number.NaN;
}

BoundingBox.prototype.isEmpty = function() {
    return isNaN(this.x1) || isNaN(this.y1) || isNaN(this.x2) || isNaN(this.y2);
};

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

BoundingBox.prototype.addX = function(x) {
    this.addPoint(x, null);
};

BoundingBox.prototype.addY = function(y) {
    this.addPoint(null, y);
};

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

BoundingBox.prototype.addQuad = function(x0, y0, x1, y1, x, y) {
    const cp1x = x0 + 2 / 3 * (x1 - x0);
    const cp1y = y0 + 2 / 3 * (y1 - y0);
    const cp2x = cp1x + 1 / 3 * (x - x0);
    const cp2y = cp1y + 1 / 3 * (y - y0);
    this.addBezier(x0, y0, cp1x, cp1y, cp2x, cp2y, x, y);
};
