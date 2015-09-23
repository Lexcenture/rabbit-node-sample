var async = require('async');
var express = require('express.io');
var hbs = require('express-handlebars');
var bodyParser = require('body-parser');
var when = require('when');
var dateHelper = require('./helpers/date');
var config = require('./config.js');

var amqp = require('amqplib');
var queueName = 'intel-queue';
var exchangeName = 'intelligence';


redis = require('redis')
RedisStore = express.io.RedisStore
workers = function () {
  app = express().http().io()

  var jsonParser = bodyParser.json()

  app.use('/js', express.static('js'));
  app.use('/style', express.static('style'));

  app.set('views', __dirname + '/views');
  app.engine('hbs', hbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: __dirname + '/views',
    partialDir: [__dirname + '/views/partials'],
    helpers: {
      partial: function (name) {
        return name;
      }
    }
  }));
  app.set('view engine', 'hbs');

  // Setup the redis store for scalable io.
  app.io.set('store', new express.io.RedisStore({
    redisPub: redis.createClient(),
    redisSub: redis.createClient(),
    redisClient: redis.createClient()
  }));

  app.get('/', render);
  app.post('/', jsonParser, publish)

  app.io.route('stream', function (req) {
    amqp.connect(['amqp://', config.rabbit.host].join('')).then(function (conn) {
      var ok = conn.createChannel();
      ok = ok.then(function (ch) {
        ch.assertQueue(queueName);
        ch.bindQueue(queueName, exchangeName);
        ch.consume(queueName, function (msg) {
          if (msg !== null) {
            var message = msg.content.toString().replace(/(\r\n|\n|\r)/gm, "");
            console.log(" [x] Received '%s'", message);
            req.io.broadcast('newIntel', message);
            ch.ack(msg);
          }
        });
      });
      return ok;
    }).then(null, console.warn);
  });

  app.listen(config.server.port);
  console.log('Listening on port ' + config.server.port);
}

cluster = require('cluster')
numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log("IsMaster");
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  console.log("NOT IsMaster");
  workers();
}


function render(req, res, next) {
  res.render('home', {intels: [], pageSpecificScript: 'homeScriptPartial'});
}


function publish(req, res, next) {

  if (!req.body) return res.sendStatus(400)

  var intelligence = req.body;

  intelligence.time = intelligence.dateSetToFinal;

  amqp.connect(['amqp://', config.rabbit.host].join('')).then(function (conn) {
    return when(conn.createChannel().then(function (ch) {

      var ok = ch.assertExchange(exchangeName, 'topic', {durable: true});
      return ok.then(function () {

        var message = JSON.stringify(intelligence);
        ch.publish(exchangeName, '', new Buffer(message));

        console.log(" [x] Sent '%s'", message);


        return ch.close();

      });
    })).ensure(function () {

      conn.close();

      try {
        res.statusCode = 201;
        res.end('created!');
      } catch (e) {
        console.log("ERROR MESSAGE: ", e.message);

      }


    });
  }).then(null, function (message) {
    console.log("ERROR: ", message);
    res.statusCode = 500;
    res.end('failed');
  });
}


