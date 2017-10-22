var express = require('express');

var app = express();
app.use('/capture', require('./routes/capture'));
app.use('/replay', require('./routes/replay'));

app.get('/', (request, response) => {
   response.send('Hello MyCRT');
});

app.listen(3000);
