var express = require('express');
var router = express.Router();
const Messaging = require('../models/messaging');


// router.post('/', function(req, res) {

// });

router.get('/', function(req, res) {
  Messaging.find().then((messaging) => {
    res.json({result: true, data: messaging});
  });
});

module.exports = router;