const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    token: String,
    lastname: { type: String, required: true },
    firstname: { type: String, required: true },
    mail: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, default: '' },
    adresse: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    profilePhoto: { type: String, default: '' },
    registrationQuestionnaire: { type: Object, default: {} },
    favoriteAds: { type: [String], default: [] }
});

const User = mongoose.model('users', userSchema);

module.exports = User;
