var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const uid2 = require('uid2');
const User = require('../models/users');

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const phoneRegex = /^((\+33|0)[67])(\d{8})$/;

// Route GET pour récupérer tous les utilisateurs de la base de donnée

router.get('/', (req, res) => {
  User.find()
      .then(users => res.json({ result: true, users }))
      .catch(() => res.json({ result: false, error: "Failed to fetch users" }));
});

// Route GET BY ID pour récupérer un seul utilisateur depuis la base de donnée en le ciblant avec son ID

router.get('/:token', (req, res) => {
  const userToken = req.params.token;

  User.findOne({ token: userToken })
  .then(user => {
    if (!user) {
      return res.json({ result: false, error: "Utilisateur non trouvé" });
    }
    res.json({ result: true, user });
  })
  .catch(() => {
    res.json({ result: false, error: "Erreur lors de la récupération de l'utilisateur" });
  });
});

// Route SignUp - Inscription Nouveaux utilisateurs

router.post('/signup', (req, res) => {
  const { firstname, lastname, gender, adresse, phoneNumber, mail, password, registrationQuestionnaire } = req.body;

  if (!firstname || !lastname || !gender || !adresse || !phoneNumber || !mail || !password) {
      return res.json({ result: false, error: "Tous les champs sont requis" });
  }

  if (!emailRegex.test(mail)) {
      return res.json({ result: false, error: "Format d'email invalide" });
  }

  if (!phoneRegex.test(phoneNumber)) {
      return res.json({ result: false, error: "Format de téléphone invalide" });
  }

  User.findOne({ mail }).then(existingUser => {
      if (existingUser) {
          return res.json({ result: false, error: "Utilisateur déjà existant" });
      }

      const hash = bcrypt.hashSync(password, 10);

      const newUser = new User({
          token: uid2(32),
          lastname: capitalize(lastname),
          firstname: capitalize(firstname),
          gender,
          adresse: adresse.trim(),
          phoneNumber: phoneNumber.trim(),
          mail: mail.trim(),
          password: hash,
          registrationQuestionnaire,
      });

      newUser.save()
          .then(() => res.json({ result: true, token: newUser.token }))
          .catch(() => res.json({ result: false, error: "Erreur interne lors de l'enregistrement" }));
  }).catch(() => res.json({ result: false, error: "Erreur interne" }));
});

function capitalize(str) {
  return str.trim().charAt(0).toUpperCase() + str.trim().slice(1).toLowerCase();
}

// Route POST - Connexion (Signin)

router.post('/signin', (req, res) => {
  const { mail, password } = req.body;

  if (!mail || !password) {
    return res.json({ result: false, error: "Missing fields" });
  }

  User.findOne({ mail })
  .then(user => {
    if (!user) {
      return res.json({ result: false, error: "User not found" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.json({ result: false, error: "Invalid password" });
    }

    res.json({ result: true, token: user.token, userId: user._id });
  })
  .catch(err => res.json({ result: false, error: "Internal server error" }));
});

// CONNECTION AVEC AUTHENTIFICATION GOOGLE

router.post('/google-login', (req, res) => {
  const { credential } = req.body;

  if (!credential) {
      return res.json({ result: false, error: "Missing credential" });
  }

  const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;

  fetch(googleVerifyUrl)
      .then(response => response.json())
      .then(googleData => {
          if (googleData.aud !== process.env.GOOGLE_CLIENT_ID) {
              return res.json({ result: false, error: "Invalid audience" });
          }

          if (googleData.email_verified !== "true") {
              return res.json({ result: false, error: "Email non vérifié" });
          }

          User.findOne({ mail: googleData.email }).then(user => {
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
                      .then(() => res.json({ result: true, token: newUser.token, firstname: newUser.firstname }))
                      .catch(() => res.json({ result: false, error: "Erreur création user" }));
              }
          }).catch(() => res.json({ result: false, error: "Erreur recherche user" }));
      })
      .catch(() => res.json({ result: false, error: "Erreur vérification Google" }));
});

// CONNECTION AVEC AUTHENTIFICATION VIA FACEBOOK

// Facebook n'utilise pas de "credential" pour l'authentification mais un "accessToken"
// Ce token envoie un appel vers l'API Graph de Facebook qui nous permettra de récupérer 
// les informations de l'utilisateur si son mail est validé par Facebook

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

  // Comme dans le cas de l'authentification avec Google, on vérifie si l'utilisateur est déjà dazns notre base de données ou non,
  // Si ce n'est pas le cas, nous lui créons un token, sinon nous utilisons celui qui lui est déjà attitré

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
