var Trilateration = function() {
  this.beacons = [];
};

Trilateration.prototype.sqr = function(a) {
  return Math.pow(a, 2);
};

Trilateration.prototype.clear = function() {
  this.beacons = [];
};

Trilateration.prototype.vector = function(x, y) {
  return {
    x: x,
    y: y
  };
};

Trilateration.prototype.setDistance = function(index, distance) {
  this.beacons[index].dis = distance;
};

Trilateration.prototype.addBeacon = function(index, position) {
  this.beacons[index] = position;
};

Trilateration.prototype.calculatePosition = function() {
  var j, k, x, y;
  if (this.beacons.length < 3) {
    console.error("Error! Please add at least three beacons!");
    return this.vector(0, 0);
  }
  k = (this.sqr(this.beacons[0].x) + this.sqr(this.beacons[0].y) - this.sqr(this.beacons[1].x) - this.sqr(this.beacons[1].y) - this.sqr(this.beacons[0].dis) + this.sqr(this.beacons[1].dis)) / (2 * (this.beacons[0].y - this.beacons[1].y)) - (this.sqr(this.beacons[0].x) + this.sqr(this.beacons[0].y) - this.sqr(this.beacons[2].x) - this.sqr(this.beacons[2].y) - this.sqr(this.beacons[0].dis) + this.sqr(this.beacons[2].dis)) / (2 * (this.beacons[0].y - this.beacons[2].y));
  j = (this.beacons[2].x - this.beacons[0].x) / (this.beacons[0].y - this.beacons[2].y) - (this.beacons[1].x - this.beacons[0].x) / (this.beacons[0].y - this.beacons[1].y);
  x = k / j;
  y = ((this.beacons[1].x - this.beacons[0].x) / (this.beacons[0].y - this.beacons[1].y)) * x + (this.sqr(this.beacons[0].x) + this.sqr(this.beacons[0].y) - this.sqr(this.beacons[1].x) - this.sqr(this.beacons[1].y) - this.sqr(this.beacons[0].dis) + this.sqr(this.beacons[1].dis)) / (2 * (this.beacons[0].y - this.beacons[1].y));
  return this.vector(x, y);
};

module.exports = Trilateration;
