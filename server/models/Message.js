const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    from_user: { type: String, required: true }, // Sender's username
    to_user: { type: String, required: false },  // Receiver's username (null for public messages)
    room: { type: String, required: false }, // Room name (null for private messages)
    message: { type: String, required: true },
    date_sent: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
