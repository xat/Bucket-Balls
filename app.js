var express = require('express')
  , app = express.createServer()
  , repl = require("repl")
  , BucketMgr = require(__dirname + '/buckets')
  , config = require(__dirname + '/config')
  , buckets = new BucketMgr.buckets
  , rulesets = {}
  , io = require('socket.io').listen(app);

app.configure(function() {
  io.set('log level', 1);
  app.set('views', __dirname + '/templates');
  app.set('view engine', 'html');
  app.set('view options', {layout: false});
  app.register(".html", require("jqtpl").express);
  app.use(express.static(__dirname + '/public'))
});

for (var k in config.rulesets) {
  if (config.rulesets.hasOwnProperty(k)) {
    rulesets[k] = new BucketMgr.ruleset;
    for (var i=0; i<config.rulesets[k].length; i++) {
      rulesets[k].add(config.rulesets[k][i].points, config.rulesets[k][i].assert);
    }
  }
}

app.get('/client/:id', function(req, res) {
  res.render('index', {clientId: req.params.id, host: 'http://' + config.host});
});

io.sockets.on('connection', function(socket) {
  socket.on('create', function(data) {
    buckets.add(data.clientId, socket, data, rulesets[config.mappings[data.clientId]]);
  });
  socket.on('removeball', function(data) {
    buckets.getTarget(data).addBall(data.circleMeta);
  });
  socket.on('disconnect', function() {
    buckets.remove(socket);
  });
});

app.listen(config.port);

repl.start("bucket-cmd> ").context.buckets = buckets;