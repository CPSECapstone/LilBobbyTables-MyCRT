var express = require('express');

var router = express.Router();

router.get('/', (request, response) => {
   response.json(['replay1', 'replay2']);
});

module.exports = router;
