(function() { // tests
  var a, b, expected, i = 0;
  a = [100, 100, 100, 500];
  b = [500, 100, 100, 100];
  expected = [1, 0];
  result = bestPairings(a, b);
  console.log(++i, result, arrayEquals(result, expected) ? 'Ok' : 'Fail!');

  a = [0, 0, 1, 1, 2, 3];
  b = [1, 1, 2, 2, 1, 0];
  expected = [2, 0, 1];
  result = bestPairings(a, b);
  console.log(++i, result, arrayEquals(result, expected) ? 'Ok' : 'Fail!');

  a = [];
  b = [];
  expected = [];
  result = bestPairings(a, b);
  console.log(++i, result, arrayEquals(result, expected) ? 'Ok' : 'Fail!');

  a = [0, 0, 1, 1];
  b = [0, 1, 1, 0];
  expected = [0, 1];
  result = bestPairings(a, b);
  console.log(++i, result, arrayEquals(result, expected) ? 'Ok' : 'Fail!');

})();

function arrayEquals(a1, a2) {
  if (!a1 || !a2 || a1.length !== a2.length)
    return false;
  for (var i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i])
      return false;
  }
  return true;
}

function bestPairings(a, b) {

  function getCostMatrix(a, b) {

    function dist(p1, p2) {
      var a = p1[0] - p2[0];
      var b = p1[1] - p2[1];
      return Math.sqrt(a * a + b * b);
    }

    var costMatrix = [];
    for (var i = 0; i < a.length/2; i++) {
      costMatrix.push([]);
      var p1 = [a[i],a[i]+1];
      costMatrix[i].push(new Array(b.length));
      for (var j = 0; j < b.length/2; j++) {
        var p2 = [b[j],b[j]+1];
        costMatrix[i][j] = dist(p1, p2);
      }
    }
    return costMatrix;
  }
  
  if( a.length === 0 || b.length === 0) {
    return [];
  }

  if (a.length !== b.length || a.length % 2 != 0 || b.length % 2 != 0)
    throw Error("bad input");

  // indexes of best pairings for set b
  var best = [],
    result = computeMunkres(getCostMatrix(a, b));

  for (var i = 0; i < result.length; i++) {
    item = result[i];
    best.push(item[1]);
  }

  return best;
}