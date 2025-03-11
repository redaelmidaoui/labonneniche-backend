var express = require('express');
var router = express.Router();
const Messaging = require('../models/messaging');
const User = require('../models/users');

// /POST / - Ajouter une messagerie
router.post('/', (req, res) => {

    const { id_user1, id_user2 } = req.body;

    // Vérifier si les champs ne sont pas manquants ou vides
    if (!id_user1 || !id_user2) {
        return res.json({ result: false, error: "Missing or empty fields" });
    }

    // Vérifier si les deux utilisateurs existent dans la base de données
    User.findOne({ _id: id_user1 })
        .then(user1 => {
            if (!user1) {
                // S'assurer que la réponse est envoyée une seule fois
                if (!res.headersSent) {
                    return res.json({ result: false, error: "User 1 not found" });
                }
            }

            return User.findOne({ _id: id_user2 });
        })
        .then(user2 => {
            if (!user2) {
                // S'assurer que la réponse est envoyée une seule fois
                if (!res.headersSent) {
                    return res.json({ result: false, error: "User 2 not found" });
                }
            }

            // Vérifier si une messagerie existe déjà entre les deux utilisateurs
            return Messaging.findOne({
                $or: [
                    { user1: id_user1, user2: id_user2 },
                    { user1: id_user2, user2: id_user1 }
                ]
            });
        })
        .then(existingMessaging => {
            if (existingMessaging) {
                // Si une messagerie existe déjà, ne pas en créer une nouvelle
                if (!res.headersSent) {
                    return res.json({ result: false, error: "Messaging already exists between these users" });
                }
            }

            // Si aucune messagerie n'existe, créer la nouvelle messagerie
            const newMessaging = new Messaging({
                user1: id_user1,
                user2: id_user2,
                messages: [],
            });

            return newMessaging.save();
        })
        .then((data) => {
            if (!res.headersSent) {
                res.json({ result: true, newMessaging: data });
            }
        })
        .catch(err => {
            // S'assurer que la réponse est envoyée une seule fois
            if (!res.headersSent) {
                res.json({ result: false, error: err.message });
            }
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
            { user1: id_user },
            { user2: id_user }
        ]
    })
    .populate([
        {path: 'user1', select: ['_id', 'firstname', 'mail', 'profilePhoto']},
        {path: 'user2', select: ['_id', 'firstname', 'mail', 'profilePhoto']}
    ])
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