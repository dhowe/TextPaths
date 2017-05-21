var strokes = [], word, font, dotSize = 3, sfe = 0.1, sfc = 0.1, pad = 100, timer = 6500;
//var words = { 'communism':'共產主義' };

function preload() {
  font = loadFont('ArialUnicode.ttf');
}

function setup() {

  createCanvas(600, 400);
  frameRate(10);
  setupBoidsForWord('ok', sfe);
}

function keyReleased() {
  var word = xwords[floor(random(xwords.length))];
  setupBoidsForWord(xwords[word], sfe);
}


function renderPair() {
  var ewords = Object.keys(words);
  var word = ewords[floor(random(ewords.length))];
  setupBoidsForWord(words[word], sfe);
  setTimeout(function(){
    setupBoidsForWord(word, sfc);
    setTimeout(renderPair, timer);
  }, timer);
}

function draw() {

  background(51);
  strokeWeight(1);
  for (var i = 0; i < strokes.length; i++)
    strokes[i].render();
}

var xwords = ['L', 'T', 'I', 'N', '4', 'F', 'O' ,'T','V', '7'];
var qwords = [], widx = 0, stop = false;

function setupBoidsForWord(word, sf) {

  var fsize, x, y, bb;

  //stop = stop
  //word = words[floor(random(words.length))];
  //word = qwords[++widx%qwords.length];
  //
  word = xwords[floor(random(xwords.length))];

  fsize = fontSizeForBounds(font, word, width - pad, height - pad);
  bb = font.textBounds(word, 0, 0, fsize);
  x = (width-bb.w)/2, y = (height / 2) + (bb.h / 2);

  textSize(fsize); // yuck
  migrate(font._getPath(word, x, y, { sampleFactor: sf }).commands);
}

function migrate(path) {

  if (!frameCount) { // first-time

    strokes = pathToVrokes(path);
    console.log(strokes);
    //logPath(path);
  }
  else {

    var current = strokes.length,
      nextSet = pathToVrokes(path),
      difference = nextSet.length - current;

    //console.log(word+': '+nextSet.length+' diff='+difference);
    //logPath(path);

    if (difference > 0) { // fewer, add some

      for (var i = 0; i < difference; i++) {
        var randomIndex = floor(random(strokes.length));
        var v = strokes[randomIndex].copy();
        strokes.splice(randomIndex, 0, v);
      }

    } else if (difference < 0) { // more, remove some

      for (var i = 0; i < -difference; i++) {
        var randomIndex = floor(random(strokes.length));
        strokes.splice(randomIndex, 1);
      }
    }

    if (strokes.length != nextSet.length)
      throw Error('invalid state: word='+word+'('+nextSet.length+') strokes='+strokes.length);

    // set targets
    for (var j = 0; j < strokes.length; j++) {
      strokes[j].resetTargets(nextSet[j]);
    }
  }
}

function fontSizeForBounds(font, text, boundsWidth, boundsHeight) {
  var fontSize = 12, bbox = { w: 0, h: 0 };
  while (bbox.w < boundsWidth && bbox.h < boundsHeight) {
    bbox = font.textBounds(text, 0, 0, fontSize += 2);
  }
  return fontSize;
}
