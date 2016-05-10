var Trilateration = function() {
  this.beacons = [];
}

Trilateration.prototype.sqr = function(a) {
  return Math.pow(a, 2);
};

Trilateration.prototype.clear = function() {
  beacons = [];
};

Trilateration.prototype.vector = function(x, y) {
  return {
    x: x,
    y: y
  };
};

Trilateration.prototype.setDistance = function(index, distance) {
  beacons[index].dis = distance;
};

Trilateration.prototype.addBeacon = function(index, position) {
  beacons[index] = position;
};

Trilateration.prototype.calculatePosition = function() {
  var j, k, x, y;
  if (beacons.length < 3) {
    console.error("Error! Please add at least three beacons!");
    return this.vector(0, 0);
  }
  k = (this.sqr(beacons[0].x) + this.sqr(beacons[0].y) - this.sqr(beacons[1].x) - this.sqr(beacons[1].y) - this.sqr(beacons[0].dis) + this.sqr(beacons[1].dis)) / (2 * (beacons[0].y - beacons[1].y)) - (this.sqr(beacons[0].x) + this.sqr(beacons[0].y) - this.sqr(beacons[2].x) - this.sqr(beacons[2].y) - this.sqr(beacons[0].dis) + this.sqr(beacons[2].dis)) / (2 * (beacons[0].y - beacons[2].y));
  j = (beacons[2].x - beacons[0].x) / (beacons[0].y - beacons[2].y) - (beacons[1].x - beacons[0].x) / (beacons[0].y - beacons[1].y);
  x = k / j;
  y = ((beacons[1].x - beacons[0].x) / (beacons[0].y - beacons[1].y)) * x + (this.sqr(beacons[0].x) + this.sqr(beacons[0].y) - this.sqr(beacons[1].x) - this.sqr(beacons[1].y) - this.sqr(beacons[0].dis) + this.sqr(beacons[1].dis)) / (2 * (beacons[0].y - beacons[1].y));
  return exports.vector(x, y);
};

module.exports = Trilateration;
