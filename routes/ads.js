var express = require("express");
var router = express.Router();
const Ad = require("../models/ads");
const User = require("../models/users");

router.post('/', function(req, res) {
  console.log(req.body);
  const {author} = req.body;
  console.log(author);
    // Vérifier si l'utilisateur existe dans la base de données
    User.findOne({ token: req.body.token })
      .then(user => {
        if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        const userId = user._id;
  
        const newAd = new Ad({
          publicationDate: new Date(),
          pictures: req.body.pictures,
          number: req.body.number,
          age: req.body.age,
          sort: req.body.sort,
          gender: req.body.gender,
          description: req.body.description,
          city: req.body.city,
          postalCode: req.body.postalCode,
          author: userId
        });
  
        // Sauvegarde de l'annonce
        return newAd.save();
      })
      .then(data => {
        // Une fois l'annonce sauvegardée, on récupère les informations de l'auteur
        return Ad.findById(data._id).populate('author');
      })
      .then(data => {
        // Réponse à l'utilisateur
        return res.json({ data });
      })
      .catch(err => {
        // Gestion des erreurs
        console.error(err);
        if (!res.headersSent){
          res.status(500).json({ message: 'Erreur serveur', error: err });
        }
      });
  }); 
  

router.get('/', function(req, res) {
  const {type, age, gender} = req.query;

  let filters = {};

  if (type) filters.sort = type;
  if (age) filters.age = age;
  if (gender) filters.gender = gender;

  Ad.find().populate('author')
  .then((ads) => {
    res.json(ads);
  })
  .catch((err) => {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur', error: err });
  });
});

module.exports = router;
