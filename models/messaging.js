const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
  id_editor: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  date_of_dispatch: Date,
  content: String,
})

const messagingSchema = mongoose.Schema({
  id_user1: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  id_user2: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  messages: [messageSchema],
});

const Messaging = mongoose.model("messaging", messagingSchema);

module.exports = Messaging;