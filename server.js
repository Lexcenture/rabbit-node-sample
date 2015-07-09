var async = require('async');
var express = require('express');
var hbs = require('express-handlebars');
var bodyParser = require('body-parser');
var when = require('when');

var config = require('./config.js');

var amqp = require('amqplib');
var queueName = 'intel-queue';
var exchangeName = 'intelligence';

var app = express();

var jsonParser = bodyParser.json()

app.use('/js', express.static('js'));

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

app.route('/')
    .get(render)
    .post(jsonParser, publish)

app.route('/home')
    .get(renderHome)

app.route('/stream')
    .get(stream);

function render(req, res, next) {
  res.render('home', {intels: [], pageSpecificScript: 'homeScriptPartial'});
}

function renderHome(req, res, next) {
  res.render('home', {intels: [], pageSpecificScript: 'home2ScriptPartial'});
}

function publish(req, res, next) {

  if (!req.body) return res.sendStatus(400)

  var intelligence = req.body;

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
      res.sendStatus(201);

    });
  }).then(null, function (message) {
    console.log(message);
    res.sendStatus(500);
  });
}


function stream(req, res, next) {
  res.header('Content-Type', 'text/event-stream');
  res.header('Cache-Control', 'no-cache');
  res.header('Connection', 'keep-alive');
  res.status(200);

  amqp.connect(['amqp://', config.rabbit.host].join('')).then(function(conn) {
    var ok = conn.createChannel();
    ok = ok.then(function(ch) {
      ch.assertQueue(queueName);
      ch.bindQueue(queueName, exchangeName);
      ch.consume(queueName, function(msg) {
        if (msg !== null) {
          var message = msg.content.toString().replace(/(\r\n|\n|\r)/gm,"");
          console.log(" [x] Received '%s'", message);
          res.write("data: " + message + "\n\n");
          ch.ack(msg);
        }
      });
    });
    return ok;
  }).then(null, console.warn);
}


app.listen(config.server.port);
console.log('Listening on port ' + config.server.port);
