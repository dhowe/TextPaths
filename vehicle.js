function Vehicle(radius, target, position, acceleration, velocity, col) {
  this.maxspeed = 10;
  this.maxforce = 2;
  this.arriveDistance = 100;
  this.fleeRadius = 100;
  this.radius = radius;
  this.col = col || '#f00';
  this.reset(target, position, acceleration, velocity);
}

Vehicle.prototype.reset = function (target, position, acceleration, velocity) {
  this.target = target;
  this.pos = position;
  this.acc = acceleration;
  this.vel = velocity;
}

Vehicle.prototype.copy = function () {
  return new Vehicle(this.radius, this.target.copy(),
    this.pos.copy(), this.acc.copy(), this.vel.copy());
}

Vehicle.prototype._behaviors = function (mx, my) {
  var flee , arrive = this.arrive(this.target);
  if (typeof mx !== 'undefined' && typeof my !== 'undefined') {
    flee = this.flee(createVector(mx, my));
  }
  else {
    flee = createVector(0,0);
  }

  arrive.mult(1);
  flee.mult(2); // was flee.mult(5)
  this.applyForce(arrive);
  this.applyForce(flee);
  return this;
}

Vehicle.prototype.setTarget = function (t) {
  this.target = t;
  return this;
}

Vehicle.prototype.setColor = function (c) {
  this.col = c;
  return this;
}

Vehicle.prototype.setSize = function (s) {
  this.radius = s;
  return this;
}

Vehicle.prototype.applyForce = function (f) {
  this.acc.add(f);
  return this;
}

Vehicle.prototype.arrive = function (target) {
  var desired = p5.Vector.sub(target, this.pos);
  var d = desired.mag();
  var speed = this.maxspeed;
  if (d < this.arriveDistance) {
    speed = map(d, 0, this.arriveDistance, 0, this.maxspeed);
  }
  desired.setMag(speed);
  var steer = p5.Vector.sub(desired, this.vel);
  steer.limit(this.maxforce);
  return steer;
}

Vehicle.prototype.flee = function (target) {

  var desired = p5.Vector.sub(target, this.pos);
  var d = desired.mag();
  if (d < this.fleeRadius) {
    desired.setMag(this.maxspeed);
    desired.mult(-1);
    var steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxforce);
    return steer;
  }

  return createVector(0, 0);
}

Vehicle.prototype.update = function (mx, my) {
  this._behaviors(mx, my);
  this.pos.add(this.vel);
  this.vel.add(this.acc);
  this.acc.mult(0);
  return this;
}

Vehicle.prototype.draw = function (ctx) {
  noFill();
  stroke('#f00');
  strokeWeight(this.radius);
  point(this.pos.x, this.pos.y);
  return this;
}
