var express = require('express');
var router = express.Router();
const Annonce = require('../models/annonces');


router.post('/', function(req, res) {

});

router.get('/', function(req, res) {
  Annonce.find().then((annonces) => {
    res.json(annonces);
  });
});

module.exports = router;
