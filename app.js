var express = require('express')
  , app = express.createServer()
  , repl = require("repl")
  , BucketMgr = require(__dirname + '/lib/buckets')
  , buckets = new BucketMgr.buckets
  , io = require('socket.io').listen(app);


app.configure(function() {
  app.set('views', __dirname + '/templates');
  app.set('view engine', 'html');
  app.set('view options', {layout: false});
  app.register(".html", require("jqtpl").express);
  app.use(express.static(__dirname + '/public'))
});

io.configure('production', function() {
  io.set('log level', 1);
});

var imac = new BucketMgr.ruleset;
var desktop = new BucketMgr.ruleset;
var laptop = new BucketMgr.ruleset;
var android = new BucketMgr.ruleset;

imac.add(100, function(src) {
  return (src.lastContact === 'right');
});

desktop.add(100, function(src) {
  return (src.lastContact === 'left');
});

laptop.add(200, function(src) {
  return src.hasDeviceorientation;
});

var clientToRuleset = {
  'id1': laptop,
  'id2': imac,
  'id3': desktop,
  'id4': android
};

app.get('/client/:id', function(req, res) {
  res.render('index', {clientId: req.params.id});
});

io.sockets.on('connection', function(socket) {
  socket.on('create', function(data) {
    buckets.add(data.clientId, socket, data, clientToRuleset['id'+data.clientId]);
  });
  socket.on('removeball', function(data) {
    buckets.getTarget(data).addBall(data.circleMeta);
  });
  socket.on('disconnect', function() {
    console.log('disconnect');
    buckets.remove(socket);
  });
});

app.listen(3100);
repl.start("bucket-cmd> ").context.buckets = buckets;