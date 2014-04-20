var app = require('express')()
  , repl = require('repl')
  , server = require('http').Server(app)
  , BucketMgr = require('./buckets')
  , serveStatic = require('serve-static')
  , config = require('./config')
  , buckets = new BucketMgr.buckets
  , rulesets = {}
  , ejs = require('ejs')
  , io = require('socket.io').listen(server);

io.set('log level', 1);
app.set('views', 'templates');

app.use(serveStatic('public'));
app.engine('html', ejs.renderFile);

for (var k in config.rulesets) {
  if (config.rulesets.hasOwnProperty(k)) {
    rulesets[k] = new BucketMgr.ruleset;
    for (var i=0; i<config.rulesets[k].length; i++) {
      rulesets[k].add(config.rulesets[k][i].points, config.rulesets[k][i].assert);
    }
  }
}

app.get('/client/:id', function(req, res) {
  res.render('index.html', { clientId: req.params.id });
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

server.listen(config.port);

repl.start("bucket-cmd> ").context.buckets = buckets;