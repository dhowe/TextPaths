// BUG:  fix breaking path when interacting with mouse (missing closePath()?)
// BUG:  fix fill for interior paths (if contained)
// OPT:  do bestPairings


function Textoid(txt, options) { // Textoid

  this.init = function(txt) { // txt, metrics || txt, x, y

    this.text = txt;

    if (typeof arguments[1] === 'object') {

      var options = x;
      this.x = options && options.x || 0;
      this.y = options && options.y || 0;
      this.font = options && options.font || textFont();
      this.fontSize = options && options.fontSize || textSize();
    }
    else {

      this.x = arguments[1];
      this.y = arguments[2];
      this.font = textFont();
      this.fontSize = textSize();
      this._doAlignment();
    }

    this.letters = this.createLetters();

    Textoid.instances.push(this);
  }

  this._doAlignment = function() {

    var pos, f = this.font, p = f.parent,
      ctx = p._renderer.drawingContext;
    if (f && p && ctx) {
      pos = f._handleAlignment(p, ctx, this.text, this.x, this.y);
      this.x = pos.x;
      this.y = pos.y;
    }
  }

  this.morph = function(txt, metrics, ms) {

    var x = metrics.x, y = metrics.y, f = metrics.font, idx = 0,
      fs = metrics.fontSize, ms = (typeof ms !== 'undefined') ? ms : 0;

    function equalize() {

      // remove any the children
      for (var i = 0; i < this.letters.length; i++) {
        this.letters.children = [];
      }

      var difference = txt.length - this.letters.length;
      if (difference > 0) { // fewer, add some
        for (var i = 0; i < difference; i++) {
          var index = round(this.letters.length/2);
          var toAdd = this.letters[index].copy();
          this.letters.splice(index, 0, toAdd);
        }

      } else if (difference < 0) { // more, remove some from end
        for (var i = 0; i < -difference; i++) {
          var index = this.letters.length-1;
          var toRemove = this.letters[index];
          this.letters.splice(index, 1);
          toRemove.destroy();
        }
      }
    }

    equalize.apply(this);

    if (txt.length != this.letters.length)
      throw Error('Invalid-state: ' + txt.length + ' != ' +this.letters.length);

    f.font.forEachGlyph(txt, x, y, fs, 0,
      function(glyph, gx, gy, sz, opts) {
        var char = String.fromCharCode(glyph.unicode);
        var delay = ms * idx, letter = this.letters[idx];
        setTimeout(function() {
          letter.morph(char, gx, gy, sz);
        }, delay);
        idx++;
      }.bind(this)
    );

    return this;
  }

  this.draw = function() {

    for (var i = 0; i < this.letters.length; i++) {
      this.letters[i].update().draw();
    }
  }

  this.createLetters = function() {

    var l = [], f = this.font;
    if (!(typeof f === 'object' && f.font && f.font.supported)) {
      console.error("Not an opentype-compatible font", f);
      return;
    }

    f.font.forEachGlyph(this.text, this.x, this.y, this.fontSize, 0,
      function(glyph, gx, gy, sz, opts) {
        var char = String.fromCharCode(glyph.unicode);
        l.push(new Letter(f, char, gx, gy, sz));
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
  this.init.apply(this, arguments);
};

Textoid.instances = [];

Textoid.drawAll = function() {
  for (var i = 0; i < Textoid.instances.length; i++) {
    Textoid.instances[i].draw();
  }
}

Textoid.layout = function(str, x, y, maxWidth, maxHeight, font) {

  var cars, n, ii, jj, line, testLine, children, testWidth, words,
    totalHeight, baselineHacked, f = font || textFont(), p = f.parent,
    pr = p._renderer, finalMaxHeight = Number.MAX_VALUE;

  var createTextoid = function(str, x, y, maxY) {
    children = children || [];
    //console.log('createTextoid(',str,x,y,')');
    if (y < maxY) children.push(new Textoid(str, x, y));
  }

  str = str.replace(/(\t)/g, '  ');
  cars = str.split('\n');

  if (typeof maxWidth !== 'undefined') {

    totalHeight = 0;
    for (ii = 0; ii < cars.length; ii++) {
      line = '';
      words = cars[ii].split(' ');
      for (n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        testWidth = pr.textWidth(testLine);
        if (testWidth > maxWidth) {
          line = words[n] + ' ';
          totalHeight += p.textLeading();
        } else {
          line = testLine;
        }
      }
    }

    if (pr._rectMode === p.CENTER) {
      x -= maxWidth / 2;
      y -= maxHeight / 2;
    }

    switch (pr.drawingContext.textAlign) {
      case p.CENTER:
        x += maxWidth / 2;
        break;
      case p.RIGHT:
        x += maxWidth;
        break;
    }

    if (typeof maxHeight !== 'undefined') {

      switch (pr.drawingContext.textBaseline) {
        case p.BOTTOM:
          y += (maxHeight - totalHeight);
          break;
        case p._CTX_MIDDLE: // CENTER?
          y += (maxHeight - totalHeight) / 2;
          break;
        case p.BASELINE:
          baselineHacked = true;
          pr.drawingContext.textBaseline = p.TOP;
          break;
      }

      // remember the max-allowed y-position for any line (fix to #928)
      finalMaxHeight = (y + maxHeight) - p.textAscent();
    }

    for (ii = 0; ii < cars.length; ii++) {

      line = '';
      words = cars[ii].split(' ');
      for (n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        testWidth = pr.textWidth(testLine);
        if (testWidth > maxWidth && line.length > 0) {
          createTextoid(line, x, y, finalMaxHeight);
          line = words[n] + ' ';
          y += p.textLeading();
        } else {
          line = testLine;
        }
      }

      createTextoid(line, x, y, finalMaxHeight);
      y += p.textLeading();
    }
  }
  else {
    // Offset to account for vertically centering multiple lines of text - no
    // need to adjust anything for vertical align top or baseline
    var offset = 0,
      vAlign = p.textAlign().vertical;
    if (vAlign === p.CENTER) {
      offset = ((cars.length - 1) * p.textLeading()) / 2;
    } else if (vAlign === p.BOTTOM) {
      offset = (cars.length - 1) * p.textLeading();
    }

    for (jj = 0; jj < cars.length; jj++) {

      createTextoid(cars[jj], x, y-offset, finalMaxHeight);
      y += p.textLeading();
    }
  }

  if (baselineHacked) {
    pr.drawingContext.textBaseline = p.BASELINE;
  }

  return p;
}
