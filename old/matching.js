var munkres = require("munkres-js");

console.log(bestPairing([1,0],[1,1]));

function bestPairing(a, b) {

  function dist(p1, p2) {

    var a = p1[0] - p2[0];
    var b = p1[1] - p2[1];
    return Math.sqrt(a * a + b * b);
  }

  function getCostMatrix(a, b) {

    var costMatrix = [];
    for (var i = 0; i < a.length; i++) {
      costMatrix.push([]);
      costMatrix[i].push(new Array(b.length));
      for (var j = 0; j < b.length; j++) {
        costMatrix[i][j] = dist(a[i], b[j]);
      }
    }

    return costMatrix;
  }

  if (a.length !== b.length)
    throw Error("bad input");

  // indexes of best pairings for set b
  var best = [],
    result = munkres(getCostMatrix(a, b));

  for (var i = 0; i < result.length; i++) {
    item = result[i];
    best.push(item[1]);
  }
  return best;

  if (best.length !== a.length / 2)
    throw Error("bad output");

  return best;
}
