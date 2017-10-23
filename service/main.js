const express = require('express');
const path = require('path');

const app = express();

app.use((request, response, then) => {
   console.log();
   console.log("----=[ " + request.method + " " + request.path + " ]=----");
   then();
});

// Rest API Routes
app.use('/capture', require('./routes/capture'));
app.use('/replay', require('./routes/replay'));

// home page
app.get('/', (request, response) => {
   response.sendFile(path.join(__dirname, 'public/index.html'));
});

// start the server
const port = process.env.NODE_PORT || 3000;
const host = process.env.NODE_IP || 'localhost';
app.listen(port, host, () => {
   console.log("App Listening on " + host + ":" + port);
});
