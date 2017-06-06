// TODO: handle alignments?
// OPT:  do bestPairings
// BUG:  fix fill for interior paths (if contained)

function Texticle(txt, options) { // Textoid

  this.init = function(txt, options) {

    //console.log('Texticle',options);

    this.text = txt;
    this.x = options && options.x || 0;
    this.y = options && options.y || 0;
    this.font = options && options.font || textFont();
    this.fontSize = options && options.fontSize || textSize();
    this.letters = this.createLetters(this.text, this.x, this.y, this.fontSize);
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
          var newLett = this.letters[index].copy();
          this.letters.splice(index, 0, newLett);
        }

      } else if (difference < 0) { // more, remove some from end
        for (var i = 0; i < -difference; i++) {
          var index = this.letters.length-1;
          var toRemove = this.letters[index];
          this.letters.splice(index, 1);
          toRemove.destroy()
        }
      }
    }

    equalize.bind(this)();

    if (txt.length != this.letters.length)
      throw Error('Invalid-state: ' + txt.length + ' != ' +this.letters.length);

    f.font.forEachGlyph(txt, x, y, fs, 0,
      function(glyph, gx, gy, sz, opts) {
        var char = String.fromCharCode(glyph.unicode);
        var delay = ms * idx, letter = this.letters[idx];
        setTimeout(function() {
          letter.morph(char, gx, gy, sz)
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
  this.init.apply(this, arguments);
};
