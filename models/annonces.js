const mongoose = require("mongoose");

const annonceSchema = mongoose.Schema({
    publicationDate: {
        type: Date,
        default: Date.now
      },
    pictures: [String],
    age: String,
    sort: String,
    gender: String,
    description: String,
    author: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "users"      
      },
});

const Annonce = mongoose.model("annonces", annonceSchema);

module.exports = Annonce;
