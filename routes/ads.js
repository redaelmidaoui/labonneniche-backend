var express = require("express");
var router = express.Router();
const Ad = require("../models/ads");
const User = require("../models/users");

router.post("/", function (req, res) {
  // Vérifier si l'utilisateur existe dans la base de données
  User.findOne({ token: req.body.token })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
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
        author: userId,
      });

      // Sauvegarde de l'annonce
      newAd.save().then((data) => {
        // Une fois l'annonce sauvegardée, on récupère les informations de l'auteur
        Ad.findById(data._id)
          .populate("author")
          .then((data) => {
            // Réponse à l'utilisateur
            return res.json({ data });
          });
      });
    })
    .catch((err) => {
      console.error(err); // Debug
      res.status(500).json({ message: "Erreur serveur", error: err });
    });
});  

// Route pour récupérer toutes les annonces
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

// Route pour récupérer une annonce par son ID
router.get("/:id", function (req, res) {
  Ad.findById(req.params.id)
    .populate("author")
    .then((ad) => {
      if (!ad) {
        return res.status(404).json({ message: "Annonce non trouvée" });
      }
      res.json(ad);
    });
});


  router.get("/myAds/:author", async function (req, res) {
    try {
      const { author } = req.params;
      const ads = await Ad.find({ author: author }); // Recherche des annonces par auteur

      if (!ads.length) {
        return res.status(404).json({ message: "Aucune annonce trouvée pour cet auteur" });
      }

      res.status(200).json(ads);
    } catch (error) {
      console.error("Erreur lors de la récupération des annonces :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });




module.exports = router;



