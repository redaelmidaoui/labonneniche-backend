var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const uid2 = require('uid2');

const User = require('../models/users');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Route SignUp - Inscription Nouveaux utilisateurs

router.post('/signup', (req, res) => {
  const { lastname, firstname, mail, password } = req.body;

  if (!lastname || !firstname || !mail || !password) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  User.findOne({ mail }).then(existingUser => {
    if (existingUser) {
      return res.json({ result: false, error: "User already exists" });
    }

    const hash = bcrypt.hashSync(password, 10);

    const newUser = new User({
      token: uid2(32),
      lastname,
      firstname,
      mail,
      password: hash,
    });

    newUser.save().then(() => {
      res.json({ result: true, token: newUser.token });
    }).catch(err => {
      console.error(err);
      res.json({ result: false, error: "Internal server error" });
    });
  }).catch(err => {
    console.error(err);
    res.json({ result: false, error: "Internal server error" });
  });
});

router.post('/signin', (req, res) => {
  const { mail, password } = req.body;

  if (!mail || !password) {
    return res.json({ result: false, error: "Missing fields" });
  }

  User.findOne({ mail }).then(user => {
    if (!user) {
      return res.json({ result: false, error: "User not found" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({ result: false, error: "Invalid password" });
    }

    res.json({ result: true, token: user.token });
  }).catch(err => {
    console.error(err);
    res.json({ error: "Internal serveur error" });
  });
});

module.exports = router;
