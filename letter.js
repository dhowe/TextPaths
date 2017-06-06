
function Letter(font, glyph, x, y, fsize) {

  this.init = function(font, glyph, x, y, fsize) {

    this.x = x;
    this.y = y;
    this.font = font;
    this.fontSize = fsize || textSize();
    this.vehicles = []; // 2d array: [paths][vehicles]
    this.glyph = (typeof glyph === 'object') ? glyph : font._getGlyphs(glyph)[0];
    this.createPaths();
    this.initVehicles();
  }

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

  this.initVehicles = function() {

    var last;
    for (var j = 0; j < this.paths.length; j++) {

      this.vehicles[j] = [];
      for (var i = 0; i < this.paths[j].length; i++) {

        var cmd = this.paths[j][i], type = cmd.shift();

        if (type === 'Z') continue;
        var target = createVector(cmd[0], cmd[1]);
        //var position = createVector(random(0, width), random(0, height));
        var position = createVector(this.x, this.y);
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
          //var position = createVector(random(0, width), random(0, height));
          var position = createVector(this.x, this.y);
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

  this.createPaths = function() {

    this.paths = splitPaths(this.glyph.getPath
      (this.x, this.y, this.fontSize).commands);
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

function logV(v) {
  setTimeout(function() {
    var s = '';
    for (var i = 0; i < v.length; i++)
      s += "("+round(v[i].pos.x)+','+round(v[i].pos.y)+") ";
    console.log(s);
  }, 1500);
}
