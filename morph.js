var font, dotSize = 3, vehicles = [], sfe = 0.4, sfc = 0.4, pad = 100;
//var words = { 'communism':'共產主義' };

function preload() {
  font = loadFont('ArialUnicode.ttf');
}

function setup() {

  createCanvas(600, 400);
  renderPair();
}

function renderPair() {
  var ewords = Object.keys(words);
  var word = ewords[floor(random(ewords.length))];
  setupBoidsForWord(words[word], sfe);
  setTimeout(function(){
    setupBoidsForWord(word, sfc);
    setTimeout(renderPair, 3000);
  }, 3000);
}

function draw() {

  background(51);

  if (0) {
    for (var i = 0; i < points.length; i++) {
      ellipse(points[i].x,points[i].y,dotSize,dotSize);
    }
    strokeWeight(1);
    stroke(200,0,0);
    noFill();
    rect(pad/2, pad/2, width-pad, height-pad);
    rect(x,y-bb.h,bb.w,bb.h);
  }

  drawVehicles(vehicles);
}

var fsize, points, x, y, bb;
function setupBoidsForWord(str, sf, f) {
  f = f || font;
  fsize = fontSizeForBounds(f, str, width - pad, height - pad);
  bb = f.textBounds(str, 0, 0, fsize);
  x = (width-bb.w)/2, y = (height / 2) + (bb.h / 2);
  points = f.textToPoints(str, x, y, fsize, { sampleFactor: sf });
  migrateToNewPoints(points);
}

function fontSizeForBounds(font, text, boundsWidth, boundsHeight) {
  var fontSize = 12, bbox = { w: 0, h: 0 };
  while (bbox.w < boundsWidth && bbox.h < boundsHeight) {
    bbox = font.textBounds(text, 0, 0, fontSize += 2);
  }
  return fontSize;
}

function migrateToNewPoints(points) {

  if (!vehicles.length) {

    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      var target = createVector(point.x, point.y);
      var position = createVector(random(0, width), random(0, height));
      var acceleration = createVector();
      var velocity = p5.Vector.random2D();
      var v = new Vehicle(dotSize, target, position, acceleration, velocity);
      vehicles.push(v);
    }

  } else {

    var currentCount = vehicles.length;
    var difference = points.length - currentCount;
    if (difference > 0) {
      for (var i = 0; i < difference; i++) {
        var randomIndex = Math.floor((Math.random() * vehicles.length));
        var v = vehicles[randomIndex].copy();
        vehicles.splice(randomIndex, 0, v);
      }
    } else if (difference < 0) {
      for (var i = 0; i < difference * -1; i++) {

        var randomIndex = Math.floor((Math.random() * vehicles.length));
        vehicles.splice(randomIndex, 1);
      }
    }
  }

  for (var i = 0; i < points.length; i++) {
    this.vehicles[i].setTarget(new p5.Vector(points[i].x, points[i].y));
    //this.vehicles[i].setSize(this.dotSize);
  }
}

function drawVehicles(vehicles) {
  for (var i = 0; i < vehicles.length; i++) {
    this.vehicles[i].update().draw();
  }
}
