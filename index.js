/***
https://stackoverflow.com/questions/34197653/getusermedia-in-chrome-47-without-using-https
Can not test audio and video over insecure domain need SSL/TLS
***/
var fs = require("fs");
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

//express.js
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('*', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
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
