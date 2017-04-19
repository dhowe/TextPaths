// Daniel Shiffman
// http://codingtra.in
// Video: https://www.youtube.com/watch?v=4hA7G3gup-4

var font, points, txt = "communism";

function preload() {

  //font = loadFont('Fangsong.otf'); //儷宋
  font = loadFont('heiti.ttf');
}

function setup() {

  createCanvas(600, 300);
  // points = font.textToPoints(txt, 130, 200, 36,  {
  //   sampleFactor: 0.25
  // });
  textFont(font, 36);
}

function draw() {

  background(245);

  // for (var i = 0; i < points.length; i++) {
  //   ellipse(points[i].x,points[i].y,1,1);
  // }

  text(txt,130,130);
}
