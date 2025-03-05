var express = require('express');
var router = express.Router();
const Messaging = require('../models/messaging');
const User = require('../models/users');

// /POST / - Ajouter une messagerie
router.post('/', (req, res) => {

    const { id_user1, id_user2 } = req.body;

    //Vérifier si les champs ne sont pas manquantes ou vides
    if (!id_user1 || !id_user2) {
        return res.json({ result: false, error: "Missing or empty fields" });
    };

    // Vérifier si les deux utilisateurs existent dans la base de données
    User.findOne({ _id: id_user1 })
        .then(user1 => {
            if (!user1) {
                return res.json({ result: false, error: "User 1 not found" });
            }

            return User.findOne({ _id: id_user2 });
        })
        .then(user2 => {
            if (!user2) {
                return res.json({ result: false, error: "User 2 not found" });
            }

            // Si les deux utilisateurs existent, créer la nouvelle messagerie
            const newMessaging = new Messaging({
                id_user1: id_user1,
                id_user2: id_user2,
                messages: [],
            });

            return newMessaging.save();
        })
        .then((data) => {
            res.json({ result: true, newMessaging: data });
        })
        .catch(err => {
            res.json({ result: false, error: err.message });
        });
});

// /GET /getMessaging/:id_user - Récupérer toutes les messageries d'un utilisateur
router.get('/getMessaging/:id_user', (req, res) => {
    const { id_user } = req.params;

    // Vérifier si l'id_user est fourni
    if (!id_user) {
        return res.json({ result: false, error: "User ID is required" });
    }

    // Trouver toutes les messageries où l'utilisateur est soit id_user1 soit id_user2
    Messaging.find({
        $or: [
            { id_user1: id_user },
            { id_user2: id_user }
        ]
    })
    .then(messageries => {
        if (messageries.length === 0) {
            return res.json({ result: false, message: "No messageries found for this user" });
        }

        res.json({ result: true, messageries });
    })
    .catch(err => {
        res.json({ result: false, error: err.message });
    });
});

// /PUT /addMessage/:id_messaging - ajouter un message
router.put('/addMessage/:id_messaging', async (req, res) => {
    const { id_editor, content } = req.body;
    const { id_messaging } = req.params;

    // Vérifier si les champs ne sont pas manquants ou vides
    if (!id_editor || !content) {
        return res.json({ result: false, error: "Missing or empty fields" });
    }

    // Vérifier si l'id_messaging est fourni
    if (!id_messaging) {
        return res.json({ result: false, error: "Messaging ID is required" });
    }

    try {
        // Récupérer l'objet Messaging avec l'id_messaging
        const messaging = await Messaging.findOne({ _id: id_messaging });

        // Vérifier si l'objet messaging a été trouvé
        if (!messaging) {
            return res.json({ result: false, error: "Messaging not found" });
        }

        // Créer le nouveau message
        const newMessage = {
            id_editor,
            date_of_dispatch: Date.now(),
            content,
        };

        // Ajouter le nouveau message à la liste des messages existants
        messaging.messages.push(newMessage);

        // Sauvegarder les modifications
        await messaging.save();

        return res.json({ result: true, message: "Message added successfully" });
    } catch (err) {
        // Gérer les erreurs
        console.error(err);
        return res.json({ result: false, error: "Error saving message" });
    }
});

module.exports = router;