const mongoose = require("mongoose");

const adSchema = mongoose.Schema({
    publicationDate: {
        type: Date,
        default: Date.now
      },
    pictures: [String],
    number: Number,
    age: String,
    sort: String,
    gender: String,
    description: String,
    city: String,
    postalCode: String,
    author: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "users"      
      },
});

const Ad = mongoose.model("ads", adSchema);

module.exports = Ad;
