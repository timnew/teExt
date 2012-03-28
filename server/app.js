
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , dispatching = require('./routes/dispatching.js');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);
app.get('/dispatching', dispatching.dispatching);
app.get('/debug/:message', dispatching.manualPost);
app.post('/Send', dispatching.post);

app.listen(8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
