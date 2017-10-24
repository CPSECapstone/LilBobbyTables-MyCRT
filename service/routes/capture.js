var express = require('express');
var http = require('http-status-codes');

var captureProgram = require('@lbt-mycrt/capture/dist/launch');

var router = express.Router();
router.urlPrefix = '/capture';

router.get('/', (request, response) => {
   response
      .json(['capture1', 'capture2'])
      .end();
});

router.get('/:id', (request, response) => {
   const id = request.params.id;
   response
      .send('capture' + id)
      .end();
});

router.post('/', (request, response) => {
   captureProgram.launch();
   const id = "[ID]";

   response
      .status(http.OK)
      .location(router.urlPrefix + '/' + id)
      .end();
});

module.exports = router;