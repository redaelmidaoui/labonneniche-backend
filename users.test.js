const request = require('supertest');
const app = require('./app');
const User = require('./models/users');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// On commence par déclarer un User fictif afin 
// de pouvoir faire les tests sans impacter 
// la base de données

const testUser = {
    firstname: 'Alice',
    lastname: 'Pertuiset',
    gender: 'female',
    adresse: '68B Boulevard Bourdon, 92200, Neuilly-Sur-Seine',
    phoneNumber: '0708091011',
    mail: 'alice@gmail.com',
    password: 'alice123',
    registrationQuestionnaire: { haveAGarden: 'no' }
};

afterAll(async () => {
    await User.deleteOne({ mail: testUser.mail })
    await mongoose.connection.close();
})


// Test de la route 'signup' => Cette dernière doit retourner 
// un succès si le user est valide (qu'il était donc déjà 
// enregistré en base de données)

it('POST /users/signup - test user valide', async () => {
    const res = await request(app).post('/users/signup').send(testUser);

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.newDoc).toBeDefined();
    expect(res.body.newDoc.token).toBeDefined();
});


// Test de la route 'signin' => Cette dernière doit retourner 
// une erreur dans le cas où l'email renseigné par le user serait erroné 

it('POST /users/signin - test email erroné', async () => {
    const res = await request(app).post('/users/signin').send({
        mail: "pasalice@gmail.com",
        password: "alice123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBe("User not found")
});

// Test de la route 'signin' => Cette dernière doit retourner 
// une erreur dans le cas où le mot de passe serait erroné

it ('POST /users/signin - test mot de passe erroné', async () => {

    // Pour le bon fonctionnement du test on reprend le mail enregistré 
    // dans la constante en début de test : mail: 'alice@gmail.com'

    // const hashedPassword = bcrypt.hashSync(testUser.password, 10);
    // await User.create({ ...testUser, password: hashedPassword, token: 'faketoken' });

    const res = await request(app).post('/users/signin').send({
        mail: "alice@gmail.com",
        password: 'fauxmotdepasse'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBe("Invalid password");
});

// Test de la route 'findOne' pour vérifier qu'un utilisateur n'ayant pas 
// un token valable ne puisse pas être identifié comme étant un user enregistré

it('GET /users/:token - test pour retrouver un user avec son token', async () => {
    const res = await request(app).get('/users/faketoken');

    expect(res.statusCode).toBe(200);
    expect(res.body.result).toBe(false);
    expect(res.body.error).toBe("Utilisateur non trouvé");
});


