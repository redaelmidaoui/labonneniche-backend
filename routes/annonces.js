var express = require('express');
var router = express.Router();
const Annonce = require('../models/annonces');
const User = require('../models/users');



router.post('/', function(req, res) {
    // Vérifier si l'utilisateur existe dans la base de données
    User.findOne({ token: req.body.token })
      .then(user => {
        if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        
        const userId = user._id;
  
        const newAnnonce = new Annonce({
          publicationDate: new Date(),
          pictures: [],
          many: req.body.many,
          age: req.body.age,
          sort: req.body.sort,
          gender: req.body.gender,
          description: req.body.description,
          author: userId
        });
  
        // Sauvegarde de l'annonce
        return newAnnonce.save();
      })
      .then(data => {
        // Une fois l'annonce sauvegardée, on récupère les informations de l'auteur
        return Annonce.findById(data._id).populate('author');
      })
      .then(data => {
        // Réponse à l'utilisateur
        res.json({ data });
      })
      .catch(err => {
        // Gestion des erreurs
        console.error(err); // pour le debug
        res.status(500).json({ message: 'Erreur serveur', error: err });
      });
  });

router.get('/', function(req, res) {
  Annonce.find().populate('author')
  .then((annonces) => {
    res.json(annonces);
  });
});

module.exports = router;
