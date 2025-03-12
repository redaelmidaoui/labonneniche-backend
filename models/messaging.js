const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  id_editor: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  date_of_dispatch: Date,
  content: String,
})

const messagingSchema = mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  messages: [messageSchema],
});

const Messaging = mongoose.model("messagings", messagingSchema);

module.exports = Messaging;