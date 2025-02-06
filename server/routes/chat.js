const express = require('express');
const Message = require('../models/Message');

const router = express.Router();

// Get messages for a room
router.get('/:room', async (req, res) => {
    const { room } = req.params;
    const messages = await Message.find({ room }).sort({ date_sent: 1 });
    res.json(messages);
});

// Send a message
router.post('/', async (req, res) => {
    const { from_user, room, message } = req.body;

    try {
        const newMessage = new Message({ from_user, room, message });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
