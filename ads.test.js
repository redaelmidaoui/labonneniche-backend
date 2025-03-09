const request = require("supertest");
const mongoose = require("mongoose");
const app = require("./app");
const User = require("./models/users");
const Ad = require("./models/ads");

describe("Tests des routes d'annonces", () => {
    let userToken;
    let userId;

    const mongoose = require("./models/connection");

    beforeAll(async () => {

        // Nettoyage de la base
        await User.deleteMany({});
        await Ad.deleteMany({});

        // Création d'un utilisateur de test
        const user = new User({
            token: "test-token",
            lastname: "Doe",
            firstname: "John",
            mail: "test@example.com",
            password: "securepassword",
            gender: "male",
            adresse: "123 Rue de Test, Paris",
            phoneNumber: "0123456789",
            profilePhoto: "profile.jpg",
            registrationQuestionnaire: {},
            favoriteA: []
        });

        await user.save();
        userToken = user.token;
        userId = user._id;
    });

    // Fermeture de la connexion à la base de données
    afterAll(async () => {
        if (mongoose.connection && mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });
    // Nettoyage de la base de données avant chaque test
    beforeEach(async () => {
        await Ad.deleteMany({});
    });

    // Test de la création d'une annonce
    test("POST /ads -> doit créer une annonce et la retourner avec l'auteur", async () => {
        const newAd = {
            token: userToken,
            pictures: ["image1.jpg"],
            number: 1,
            age: 2,
            sort: "chien",
            gender: "male",
            description: "Annonce test",
            city: "Paris",
            postalCode: "75001"
        };

        const response = await request(app)
            .post("/ads")
            .send(newAd)
            .expect(200);

        expect(response.body.data).toHaveProperty("_id");
        expect(response.body.data.author._id).toBe(userId.toString());
        expect(response.body.data.description).toBe("Annonce test");
    });

    test("POST /ads -> doit renvoyer une erreur si le token est invalide", async () => {
        const response = await request(app)
            .post("/ads")
            .send({ token: "invalid-token", description: "Test" })
            .expect(404);

        expect(response.body.message).toBe("Utilisateur non trouvé");
    });

    // Test de la récupération de toutes les annonces
    test("GET /ads -> doit récupérer toutes les annonces", async () => {
        await Ad.create({
            publicationDate: new Date(),
            pictures: ["image1.jpg"],
            number: 1,
            age: 2,
            sort: "chien",
            gender: "male",
            description: "Annonce test",
            city: "Paris",
            postalCode: "75001",
            author: userId
        });

        // Récupération des annonces    
        const response = await request(app)
            .get("/ads")
            .expect(200);
        
        expect(response.body.length).toBe(1);
        expect(response.body[0].description).toBe("Annonce test");
    });
});
