var express = require('express');
var path = require('path');

var app = express();

// static files
app.use(express.static(path.join(__dirname, 'public')));

// Rest API Routes
app.use('/capture', require('./routes/capture'));
app.use('/replay', require('./routes/replay'));

// home page
app.get('/', (request, response) => {
   response.sendfile(path.join(__dirname, 'public/index.html'));
});

// start the server
var port = process.env.NODE_PORT || 3000;
var host = process.env.NODE_IP || 'localhost';
app.listen(port, host, () => {
   console.log("App Listening on " + host + ":" + port);
});
