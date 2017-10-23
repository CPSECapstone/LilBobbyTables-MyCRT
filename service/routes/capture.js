var express = require('express');
var http = require('http-status-codes');

var Capture = require('@lbt-mycrt/capture/launch');

var router = express.Router();

router.get('/', (request, response) => {
   response.json(['capture1', 'capture2']);
});

router.post('/', (request, response) => {
   Capture.launch();
   response.sendStatus(http.OK);
});

module.exports = router;