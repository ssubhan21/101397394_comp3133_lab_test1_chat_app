const Message = require('./models/Message'); // Import Message model
const activeUsers = {}; // ✅ Track active users in rooms

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('✅ A user connected:', socket.id);

        // ✅ Join Room & Send Previous Messages
        socket.on('joinRoom', async ({ room, user }) => {
            if (!user) return;

            socket.join(room);
            console.log(`📢 ${user} joined room: ${room}`);

            // ✅ Add user to active room members
            if (!activeUsers[room]) {
                activeUsers[room] = new Set();
            }
            activeUsers[room].add(user);

            // ✅ Send updated members list to all clients in the room
            io.to(room).emit('updateMembers', Array.from(activeUsers[room]));

            // ✅ Fetch previous messages from MongoDB (Public & Private)
            const messages = await Message.find({
                $or: [
                    { room }, // Public chat room messages
                    { from_user: user, to_user: room }, // Private chat sender
                    { from_user: room, to_user: user } // Private chat receiver
                ]
            }).sort({ date_sent: 1 });

            socket.emit('loadMessages', messages);
        });

        // ✅ Handle Private Messages
        socket.on('privateMessage', async ({ from_user, to_user, message }) => {
            console.log(`📩 Private message from ${from_user} to ${to_user}: ${message}`);

            const newMessage = new Message({
                from_user,
                to_user,
                message,
                date_sent: new Date()
            });

            await newMessage.save();

            // ✅ Send message to both sender and receiver
            io.to(to_user).emit('receivePrivateMessage', {
                from_user,
                message,
                date_sent: newMessage.date_sent
            });
            io.to(from_user).emit('receivePrivateMessage', {
                from_user,
                message,
                date_sent: newMessage.date_sent
            });
        });

        // ✅ Leave Room
        socket.on('leaveRoom', ({ room, user }) => {
            if (!user) return;
            
            socket.leave(room);
            console.log(`📤 ${user} left room: ${room}`);

            // ✅ Remove user from active members
            if (activeUsers[room]) {
                activeUsers[room].delete(user);
                io.to(room).emit('updateMembers', Array.from(activeUsers[room]));
            }
        });

        // ✅ Send Message & Save to DB (Public)
        socket.on('sendMessage', async ({ room, message, user }) => {
            const newMessage = new Message({
                room,
                message,
                from_user: user,
                date_sent: new Date()
            });

            await newMessage.save();

            // ✅ Emit message including timestamp
            io.to(room).emit('receiveMessage', {
                user,
                message,
                date_sent: newMessage.date_sent
            });
        });

                // ✅ Typing Indicator 
        socket.on("typing", ({ room, user }) => {
            if (!room || !user) return;

            console.log(`📝 Typing event received from ${user} in ${room}`);
            socket.to(room).emit("userTyping", { user }); // ✅ Broadcast event to room
        });

        socket.on("stopTyping", ({ room }) => {
            if (!room) return;

            console.log(`⏹ Stop typing event received in ${room}`);
            socket.to(room).emit("stopTyping"); // ✅ Broadcast to all users
        });

        

        // ✅ Handle Disconnect
        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', socket.id);
        });
    });
};
