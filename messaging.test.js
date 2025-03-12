const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./app'); 
const User = require('./models/users');
const Messaging = require('./models/messaging');

let user1;
let user2;
let messaging;

const addUsers = async () => {
    user1 = new User({
        firstname: 'alpha',
        lastname: 'user1',
        mail: 'jesuisuntest@test.test',
        password: 'motdepassepourtest1',
    });
    user2 = new User({
        firstname: 'beta',
        lastname: 'user2',
        mail: 'jesuisunautretest@test.test',
        password: 'motdepassepourtest2',
    });
    await user1.save();
    await user2.save();
}

const addMessaging = async () => {
    messaging = new Messaging({
        id_user1: user1._id,
        id_user2: user2._id,
        messages: [],
    })
    await messaging.save();
}

beforeAll(async () => {
    await addUsers();
});

afterAll(async () => {
    await Messaging.deleteMany({
        $or: [
            { id_user1: user1._id },
            { id_user2: user2._id }
        ]
    });
    await User.deleteMany({
        $or: [
            { _id: user1._id },
            { _id: user2._id }
        ]
    });
    await mongoose.connection.close();
});

it('/POST / - créer une messagerie', async () => {
    const res = await request(app)
        .post('/messaging/')
        .send({
            id_user1: user1._id,
            id_user2: user2._id,
        });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe(true);
});

it('/POST / - erreur messagerie déjà existante', async () => {
    addMessaging();

    const res = await request(app)
        .post('/messaging/')
        .send({
            id_user1: user1._id,
            id_user2: user2._id,
        });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe(false);
});

it('/GET /getMessaging/:id_user - Récupérer toutes les messageries de un utilisateur', async () => {
    const res = await request(app)
        .get(`/messaging/getMessaging/${user1._id}`);

    expect(res.status).toBe(200);
    expect(res.body.result).toBe(true);
    expect(res.body.messageries).toEqual(expect.arrayContaining([]));
});

it('/PUT /addMessage/:id_messaging - ajouter un message', async () => {
    addMessaging();

    const res = await request(app)
        .put(`/messaging/addMessage/${messaging._id}`)
        .send({
            id_editor: user1._id,
            content: "jesuisunmessage",
        });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe(true);
})