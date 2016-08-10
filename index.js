/***
https://stackoverflow.com/questions/34197653/getusermedia-in-chrome-47-without-using-https
Can not test audio and video over insecure domain need SSL/TLS
***/
var fs = require("fs");
var os = require('os');
var express = require('express');
var bodyParser = require('body-parser');
var config = require('./config.js');
var app = express();

if(config.port == 443) {
    var https = require('https').createServer(config.sslOptions, app);
}
else {
    var https = require('http').Server(app);
}
var io = require('socket.io')(https);

//express.js
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

// Use API
var api = require('./app/routes/api')(app, express, io);
app.use('/api', api);

app.get('*', function(req, res){
    res.sendFile(__dirname + '/public/app/views/index.html');
});

//the web-app is listening on specific port
https.listen(config.port, function(err) {
    if(err) {
        console.log("Could not initiate server at port " + config.port);
    }
    else {
        console.log("Server initiated at port " + config.port);
    }
});

// Socket server
// reference - https://github.com/googlecodelabs/webrtc-web/blob/master/step-06/index.js
// convenience function to log server messages on the client
io.sockets.on('connection', function(socket) {
    // convenience function to log server messages on the client
    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }
    socket.on('create or join', function(room) {
        log('Received request to create or join room ' + room);
        var srvSockets = io.sockets.sockets;
        var numClients = Object.keys(srvSockets).length;
        log('Room ' + room + ' now has ' + numClients + ' client(s)');

        if (numClients === 1) {
          socket.join(room);
          log('Client ID ' + socket.id + ' created room ' + room);
          socket.emit('created', room, socket.id);
        } else if (numClients === 2) {
          log('Client ID ' + socket.id + ' joined room ' + room);
          socket.join(room);
          socket.emit('joined', room, socket.id);
          io.sockets.in(room).emit('ready', room);
          socket.broadcast.emit('ready', room);
        } else { // max two clients
          socket.emit('full', room);
        }
    });
    socket.on('ipaddr', function() {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });
});
