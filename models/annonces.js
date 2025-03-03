const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    publicationDate: {
        type: Date,
        default: Date.now
      },
    pictures: [String],
    age: String,
    sort: String,
    gender: String,
    description: String,
});

const Annonce = mongoose.model("annonces", annonceSchema);

module.exports = Annonce;
