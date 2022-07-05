const config = require('./config.json');
var express = require('express');
var app = express();
var cors = require('cors');
var port = process.env.PORT || config.port || 3000;

var listener = app.listen(port, function()
{
    console.log(process.env.PROJECT_DOMAIN.toUpperCase() + ' is online! [Port: ' + listener.address().port + ']');
});

app.use(cors());

app.get('/', function(req, res)
{
    res.sendFile(__dirname + '/client/index.html');
});

app.get('/stylesheet.css', function(req, res)
{
    res.sendFile(__dirname + '/client/stylesheet.css');
});

app.get('/script.js', function(req, res)
{
    res.sendFile(__dirname + '/client/script.js');
});

app.get('/initial.js', function(req, res)
{
    res.sendFile(__dirname + '/client/initial.js');
});

app.get('/db/emojis.js', function(req, res)
{
    res.sendFile(__dirname + '/client/db/emojis.js');
});

