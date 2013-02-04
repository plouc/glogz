var app        = require('http').createServer(handler),
    mime       = require('mime'),
    io         = require('socket.io').listen(app),
    fs         = require('fs'),
    handlebars = require('handlebars'),
    spawn      = require('child_process').spawn;

var config = require('./config.json');

io.set('log level', 1);

var webroot = './web';

app.listen(config.port);

handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});

function urlToFs(path) {
    path = path == '/' ? '/index.html' : path;
    return webroot + path;
}

function handler (req, res) {

  var filePath = urlToFs(req.url);

  fs.readFile(filePath, function (error, data) {
    if (error) {
      res.writeHead(500);
      return res.end('Error');
    }

    if (filePath.indexOf('index.html') > 0) {
      // pre compile index template (the only one)
      var indexRenderer = handlebars.compile(fs.readFileSync('./web/index.html').toString());
      data = indexRenderer({
        'host':          config.host,
        'version':       config.version,
        'logs':          config.logs,
        'streams':       config.streams,
        'defaultStream': config.defaultStream
      });
    }

    res.setHeader("Content-Type", mime.lookup(filePath));
    res.writeHead(200);
    res.end(data);
  });
}

console.log('setting watchers:');
config.logs.forEach(function(log) {
    console.log('* watching ' + log.name + '(tail -f ' + log.file + ')');
    var tail = spawn('tail', ['-f', log.file]);
    tail.stdout.on('data', function (data) {
      io.sockets.emit('log.' + log.name, data.toString('utf8'));
    });

  tail.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  tail.on('exit', function (code) {
    console.log('child process exited with code ' + code);
  });
});

console.info('listening on port: ' + config.port);