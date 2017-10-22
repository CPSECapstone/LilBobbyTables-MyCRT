var express = require('express');

var router = express.Router();

router.get('/', (request, response) => {
   response.json(['capture1', 'capture2']);
});

module.exports = router;