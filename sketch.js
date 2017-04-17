// Daniel Shiffman
// http://codingtra.in
// Video: https://www.youtube.com/watch?v=4hA7G3gup-4

var font, vehicles, input;

function preload() {

  font = loadFont('AvenirNextLTPro-Demi.otf');
}

function setup() {

  createCanvas(600, 300);

  input = createInput('').position(15,height-10);
  createButton("Go").position(150,height-10).mousePressed(function(a){
    makePoints(input.value());
  });

  makePoints('tra .in');
}

function makePoints(txt) {

  vehicles = [];

  var points = font.textToPoints(txt, 50, 200, 192, {
    sampleFactor: 0.25
  });

  for (var i = 0; i < points.length; i++) {
    var pt = points[i];
    var vehicle = new Vehicle(pt.x, pt.y);
    vehicles.push(vehicle);
  }
}

function draw() {

  background(51);
  for (var i = 0; i < vehicles.length; i++) {
    var v = vehicles[i];
    v.behaviors();
    v.update();
    v.show();
  }
}
