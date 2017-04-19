var font, v1, v2;

function preload() {

  font = loadFont('Batang.ttf'); //儷宋
}

function setup() {

  createCanvas(600, 400);

  createButton("Go").position(20, height - 10).mousePressed(function (a) {

  });

  v1 = makePoints('共产主义', 50, 200, 120, 0.2);
  v2 = makePoints('communism', 50, 300, 85, 0.2);
  console.log(v1.length, v2.length);
}

function makePoints(txt, x, y, sz, sf) {

  var vehicles = [],
    points = font.textToPoints(txt, x, y, sz, {
      sampleFactor: sf
    });

  for (var i = 0; i < points.length; i++) {
    var pt = points[i];
    var vehicle = new Vehicle(pt.x, pt.y, 4);
    vehicles.push(vehicle);
  }

  return vehicles;
}

function draw() {

  background(51);
  drawVehicles(v1, v2);
}

function drawVehicles(vehicles) {
  for (var j = 0; j < arguments.length; j++) {
    var ve = arguments[j];
    for (var i = 0; i < ve.length; i++) {
      var v = ve[i];
      v.behaviors();
      v.update();
      v.show();
    }
  }
}
