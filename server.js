require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db'); // MongoDB Connection
const authRoutes = require('./server/routes/auth'); // User Auth API
const chatRoutes = require('./server/routes/chat'); // Chat API
const initializeSocket = require('./server/socket'); // Socket.io Logic

const app = express();
const server = http.createServer(app);

// Enable CORS for Frontend Connection
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(express.json());

// Connect to MongoDB
connectDB();

const path = require('path'); // Import Path module

// ✅ Redirect Root ("/") to Login Page
app.get("/", (req, res) => {
    res.redirect("/login.html");
});

// ✅ Serve Static Frontend Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// Initialize Socket.io for Real-time Chat
const io = socketIo(server, { cors: { origin: "*" } });
initializeSocket(io);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
