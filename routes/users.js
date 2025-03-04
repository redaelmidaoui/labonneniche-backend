var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const uid2 = require('uid2');

const User = require('../models/users');

// Route GET pour récupérer tous les utilisateurs de la base de donnée

router.get('/', (req, res) => {
  User.find()
  .then(users => {
    res.json({ result: true, users });
  })
  .catch(err => {
    res.json({ result: false, error: "ƒailed to fetch users" });
  });
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

// Connection Google

router.post('/google-login', (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.json({ result: false, error: "Missing credential" });
  }

  const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;

  fetch(googleVerifyUrl)
  .then(response => response.json())
  .then(googleData => {
    if (!googleData.email) {
      return res.json({ result: false, error: "Invalid Google credential" });
    }

    User.findOne({ mail: googleData.email })
      .then(user => {
        if (user) {
          res.json({ result: true, token: user.token, firstname: user.firstname });
        } else {
          const newUser = new User({
            token: uid2(32),
            lastname: googleData.family_name || '',
            firstname: googleData.given_name || '',
            mail: googleData.email,
            password: 'google-oauth',
          });

          newUser.save()
          .then(() => {
            res.json({ result: true, token: newUser.token, firstname: newUser.firstname });
          })
          .catch(err => {
            res.json({ result: false, error: "Database save error" });
          });
        }
      })
      .catch(err => {
        res.json({ result: false, error: "Database find error" });
      });
  })
  .catch(err => {
    res.json({ result: false, error: "Google verification fetch error" });
  });

});


// Connection Facebook

router.post('/facebook-login', (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.json({ result: false, error: "Missing accessToken" });
  }

  const facebookVerifyUrl = `https://graph.facebook.com/me?fields=id,first_name,last_name,email&access_token=${accessToken}`;

  fetch(facebookVerifyUrl)
  .then(response => response.json())
  .then(facebookData => {
    if (!facebookData.email) {
      return res.json({ result: false, error: "Invalid Facebook accessToken" });
    }

    User.findOne({ mail: facebookData.email })
    .then(user => {
      if (user) {
        res.json({ result: true, token: user.token, firstname: user.firstname });
      } else {
        const newUser = new User({
          token: uid2(32),
          lastname: facebookData.last_name || '',
          firstname: facebookData.first_name || '',
          mail: facebookData.email,
          password: 'facebook-oauth',
        });

        newUser.save()
        .then(() => {
          res.json({ result: true, token: newUser.token, firstname: newUser.firstname });
        })
        .catch(err => {
          res.json({ result: false, error: "Database save error" });
        });
      }
    })
    .catch(err => {
      res.json({ result: false, error: "Database find error" });
    });
  })
  .catch(err => {
    res.json({ result: false, error: "Facebook verification fetch error" });
  });
});

module.exports = router;
