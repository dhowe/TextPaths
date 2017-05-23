// TODO: handle alignments?
// OPT:  do bestPairings
// BUG:  fix fill for interior paths (if contained)

function Texticle(font, txt, options) {

  this.init = function(txt, x, y, fsize, font) {

    this.x = x;
    this.y = y;
    this.text = txt;
    this.font = font || textFont();
    this.fontSize = fsize || textSize();
    this.letters = this.createLetters(txt, x, y, this.fontSize);
    /*console.log(options);
    this.text = txt;
    this.x = options && options.x || 0;
    this.y = options && options.y || 0;
    this.font = options && options.font || textFont();
    this.fontSize = options && options.fontSize || textSize();

    // if (args.length === 2 && typeof x === 'object') {
    //   //txt = new Texticle(word, 50, height/2 + metrics.h/2);
    //   var metrics = fontSizeForBounds(font, word, width-100, height-100);
    //   textSize(metrics.fontSize);
    // }

    this.letters = this.createLetters(this.text, this.x, this.y, this.fontSize);*/
  }

  this.createLetters = function(txt, x, y, fsize) {

    var l = [], f = this.font;
    if (!(typeof f === 'object' && f.font && f.font.supported))
      throw Error("Not an opentype-compatible font", f)

    f.font.forEachGlyph(txt, x, y, fsize, 0,
      function(glyph, gx, gy, sz, opts) {
        var char = String.fromCharCode(glyph.unicode);
        l.push(new Letter(f, char, gx, gy, fsize));
      }
    );
    return l;
  }

  this.pathCount = function() {

    var total = 0;
    for (var i = 0; i < this.letters.length; i++) {
      total += this.letters[i].pathCount();
    }
    return total;
  }

  this.morph = function(txt, x, y, fs) {

    var oldCount = this.pathCount();
    var newCount = 0;
    var glyphs = this.font._getGlyphs(txt);
    for (var i = 0; i < glyphs.length; i++) {
      var gpath = glyphs[i].getPath(x, y, this.fontSize),
        paths = splitPaths(gpath.commands);
      newCount += paths.length;
    }
    console.log(oldCount + " -> " + newCount);
  }

  this.draw = function() {
    for (var i = 0; i < this.letters.length; i++) {
      this.letters[i].update().draw();
    }
  };

  this.init.apply(this, arguments);
};

function Letter(font, glyph, x, y, fsize) {

  this.init = function(font, glyph, x, y, fsize) {

    this.x = x;
    this.y = y;
    this.font = font;
    this.vehicles = []; // 2d array: [paths][vehicles]

    glyph = (typeof glyph === 'object') ? glyph : font._getGlyphs(glyph)[0];
    var glyphPath = glyph.getPath(this.x, this.y, fsize || textSize());

    this.paths = splitPaths(glyphPath.commands);
    this.initVehicles();
  }

  this.pathCount = function() {
    return this.paths.length;
  }

  this.morph = function(letter) {

    function copyVehicleArray(v) {
      var result = [];
      for (var i = 0; i < v.length; i++) {
        result.push(v[i].copy());
      }
      return result;
    }

    var current = this.vehicles.length;
    this.paths = splitPaths(font._getGlyphs(letter)[0].getPath(this.x, this.y, fsize).commands);
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
        for (var j = 0; j < toRemove.length; j++)
          toRemove[j].destroy();
        toRemove = [];
      }
    }

    if (this.paths.length != this.vehicles.length)
      throw Error('1. invalid state: letter='+letter+
      ' ('+this.paths.length+') '+this.vehicles.length);

    // We now have an equal # of paths, check for even #/type of points in each
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

  this.initVehicles = function() {

    var last;
    for (var j = 0; j < this.paths.length; j++) {

      this.vehicles[j] = [];
      for (var i = 0; i < this.paths[j].length; i++) {

        var cmd = this.paths[j][i], type = cmd.shift();

        if (type === 'Z') continue;
        var target = createVector(cmd[0], cmd[1]);
        var position = createVector(random(0, width), random(0, height));
        var acceleration = createVector();
        var velocity = p5.Vector.random2D();
        var veh = new Vehicle(3, target, position, acceleration, velocity);
        veh.type = type;

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

          var target = createVector(cmd[0], cmd[1]);
          var position = createVector(random(0, width), random(0, height));
          var acceleration = createVector();
          var velocity = p5.Vector.random2D();
          veh.control = new Vehicle(3, target, position, acceleration, velocity);
          veh.control.type = 'C';

          this.vehicles[j].push(veh.control);
        }
        last = cmd;
      }
    }

    //logV(this.vehicles[0]);
  }

  this.update = function() {

    for (var j = 0; j < this.vehicles.length; j++) {
      for (var i = 0; i < this.vehicles[j].length; i++) {
        var x = this.vehicles[j][i].pos.x;
        var y = this.vehicles[j][i].pos.y;
        this.vehicles[j][i].update();
      }
    }
    return this;
  }

  this.draw = function() {

    var pg = this.font.parent._renderer, ctx = pg.drawingContext;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.fillStyle = '#c00';
    ctx.strokeStyle = '#fff';
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
      ctx.stroke();
      Letter.doFill && ctx.fill();
    }
    ctx.restore();
  }

  this.init.apply(this, arguments);
}

Letter.random = function() {
  return Math.random() < .5 ?
    String.fromCharCode(floor(random(65, 90))) :
    String.fromCharCode(floor(random(97, 122)));
}

Letter.doFill = false;


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

function fontSizeForBounds(font, text, boundsWidth, boundsHeight) {

  boundsWidth = boundsWidth;
  boundsHeight = boundsHeight;
  var fontSize = 12, bbox = { w: 0, h: 0 };
  while (bbox.w < boundsWidth && bbox.h < boundsHeight) {
    bbox = font.textBounds(text, 0, 0, fontSize += 2);
  }
  bbox.fontSize = fontSize;
  return bbox; // returns {x,y,w,h,fontSize}
}

function logV(v) {
  setTimeout(function() {
    var s = '';
    for (var i = 0; i < v.length; i++)
      s += "("+round(v[i].pos.x)+','+round(v[i].pos.y)+") ";
    console.log(s);
  }, 1500);
}
