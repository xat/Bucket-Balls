var buckets = function() {
  this.bucketList = {};
};

buckets.prototype.add = function(id, socket, meta, ruleset) {
  if (this.bucketList['id'+id]) {
    this.bucketList['id'+id].destroy();
  }
  this.bucketList['id'+id] = new bucket(id, socket, meta, ruleset);
  socket.bucketid = id;
  console.log('created bucket %s', id);
};

buckets.prototype.remove = function(socket) {
  try {
    this.bucketList['id' + socket.bucketid].destroy();
    delete this.bucketList['id' + socket.bucketid];
    console.log('removed bucket %s', socket.bucketid);
  } catch(e) {}
};

buckets.prototype.getBucket = function(id) {
  return this.bucketList['id' + id];
};

buckets.prototype.getTarget = function(src) {
  var winner;
  var mostPoints;
  for (k in this.bucketList) {
    if (this.bucketList.hasOwnProperty(k)) {
      if (k == 'id'+src.clientId) {
        continue;
      }
      if (!winner) {
        mostPoints = this.bucketList[k].ruleset.test(src);
        winner = this.bucketList[k];
      } else {
        if (this.bucketList[k].ruleset.test(src) > mostPoints) {
          mostPoints = this.bucketList[k].ruleset.test(src);
          winner = this.bucketList[k];
        }
      }
    }
  }
  console.log('most points: %s, winner id: %s', mostPoints, winner.id)
  return winner;
};

var bucket = function(id, socket, meta, ruleset) {
  this.id = id;
  this.socket = socket;
  this.ruleset = ruleset;
  this.meta = meta || {};
};

bucket.prototype.addBalls = function(num) {
  console.log('bucket %s: adding %s balls', this.id, num);
  this.socket.emit('addballs', num);
};

bucket.prototype.addBall = function(options) {
  //console.log('bucket %s: adding 1 ball', this.id);
  this.socket.emit('addball', options);
};

bucket.prototype.get = function(key) {
  return this.meta[key] || false;
};

bucket.prototype.destroy = function() {
  //console.log('bucket %s: adding 1 ball', this.id);
  this.socket.emit('disconnect');
};

var ruleset = function(name) {
  this.name = name;
  this.pairs = [];
};

ruleset.prototype.test = function(src) {
  var totalPoints = 0;
  for (var i=0; i<this.pairs.length; i++) {
    if (this.pairs[i].assert(src)) {
      totalPoints += this.pairs[i].points;
    }
  }
  return totalPoints;
};

ruleset.prototype.add = function(points, assert) {
  this.pairs.push({
    points: points,
    assert: assert
  });
};

module.exports.buckets = buckets;
module.exports.ruleset = ruleset;