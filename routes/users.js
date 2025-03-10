var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const uid2 = require('uid2');
const User = require('../models/users');
const { upload, cloudinary } = require('../cloudinaryConfig');
const Ad = require("../models/ads");

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


// Route PUT pour mettre à jour les annonces favorites
router.put('/addFavorites', async (req, res) => {
  try {
    const { token, favorites } = req.body; // Récupère le token et les favoris

    // Trouve l'utilisateur en fonction du token
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // Met à jour ses favoris
    user.favoriteAds = favorites;
    await user.save();

    // Renvoie l'utilisateur mis à jour
    res.json({ result: true, user });
  } catch (error) {
    
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Route GET pour récupérer les annonces favorites d'un utilisateur
router.get('/:token/favorites', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({ token });

    if (!user) {
      return res.status(404).json({ result: false, error: "Utilisateur non trouvé" });
    }

    // Récupérer les annonces favorites en fonction des IDs stockés
    const favoriteAds = await Ad.find({ _id: { $in: user.favoriteAds } });

    res.json({ result: true, favoriteAds });
  } catch (error) {
    res.status(500).json({ result: false, error: "Erreur serveur", details: error.message });
  }
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

// Route pour uploader la photo de profil du user dans son compte

router.post('/upload-profile-photo', upload.single('profilePhoto'), async (req, res) => {
  const { token } = req.body;

  console.log("Image reçue :", res.file);
  console.log("Token reçu :", token);

  if (!req.file) {
    return res.json({ result: false, error: 'Aucune image envoyée' });
  }

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.json({ result: false, error: 'Utilisateur introuvable' })
    }

    console.log("Utilisateur trouvé :", user.firstname);

    // Mise à jour de l'image car l'utilisateur 
    // a la possibilité de la remplacer depuis son compte
    
    user.profilePhoto = req.file.path;
    await user.save();

    console.log("Photo mise à jour :", user.profilePhoto);

    res.json({ result: true, profilePhoto: user.profilePhoto });
  } catch (error) {
    console.log("Erreur du serveur :", error);
    res.json({ result: false, error: 'Erreur du serveur' });
  }
});

// Route servant à la suppression de la photo de profil 
// (idem, l'utilisateur a la possibilité de la remplacer 
// depuis son compte)

router.post('/delete-profile-photo', async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({ token });
    if(!user) {
      return res.json({ result: false, error: 'Utilisateur introuvable' });
    }

    if (user.profilePhoto) {
      const publicId = user.profilePhoto.split('/').pop().split('.')[0]; // Extraction du publicId du user à l'origine de la suppression
      await cloudinary.uploader.destroy(`profile_photos/${publicId}`);
      user.profilePhoto = '';
      await user.save();
    }

    res.json({ result: true });
  } catch (error) {
    res.json({ result: false, error: 'Erreur du serveur' });
  }
});

// Route pour updater le profil utilisateur depuis la page "Mon compte"

router.post('/update-profile', async (req, res) => {
  const { token, firstname, lastname, gender, adresse, phoneNumber, mail } = req.body;

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.json({ result: false, error: 'Utilisateur introuvable' });
    }

    // Donne à l'utilisateur l'accès à ses informations afin qu'il puisse les modifier
    user.firstname = firstname;
    user.lastname = lastname;
    user.gender = gender;
    user.adresse = adresse;
    user.phoneNumber = phoneNumber;
    user.mail = mail;

    await user.save();

    res.json({ result: true, user });
  } catch (error) {
    console.error("Erreur du serveur :", error);
    res.json({ result: false, error: 'Erreur lors de la mise à jour du profil' });
  }
});

// Récupère les données du calendrier d'un utilisateur donné (dates d'indisponibilités et dates de rendez-vous)
router.get('/calendar/:token', async (req, res) => {
  try {
    const user = await User.findOne({ token: req.params.token });
    if (!user) {
      return res.json({ result: false, error: "Utilisateur introuvable" });
    }

    res.json({ result: true, unavailable: user.unavailable || [], appointments: user.appointments || [] });
  } catch (error) {
    res.json({ result: false, error: "Erreur lors du chargeme,t des données du calendrier" });
  }
});

// Met à jour les données du calendrier
router.post('/update-calendar', async (req, res) => {
  const { token, unavailable, appointments } = req.body;

  try {
    const user = await User.findOne({ token });
    if(!user) {
      return res.json({ result: false, error: "Utilisateur introuvable" });
    }

    user.unavailable = unavailable;
    user.appointments= appointments;
    await user.save();

    res.json({ result: true });
  } catch (error) {
    res.json({ result: false, error: "Erreur lors de la mise à jour du calendrier" });
  }
});


// CONNECTION AVEC AUTHENTIFICATION GOOGLE

router.post('/google-login', async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
      return res.json({ result: false, error: "Informations Google manquantes" });
  }

  try {
      let user = await User.findOne({ mail: email });

      if (!user) {
          user = new User({
              token: uid2(32),
              firstname: name.split(' ')[0],
              lastname: name.split(' ')[1] || '',
              mail: email,
              password: 'google-oauth' // On met un mot de passe bidon car Google gère l'auth
          });

          await user.save();
      }

      res.json({ result: true, token: user.token, user });
  } catch (error) {
      console.error("Erreur serveur lors de la connexion Google :", error);
      res.json({ result: false, error: "Erreur serveur" });
  }
});

module.exports = router;
