require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",  // Adjust for production: process.env.FRONTEND_URL
    methods: ["GET", "POST"]
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibesync')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/friends', require('./routes/friends'));

// Socket.IO for VibeSync real-time (Listen Together, notifications)
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  
  // Join user room (use JWT in production)
  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });
  
  // Playlist sync example
  socket.on('playlist-update', (data) => {
    io.to(data.userId).emit('playlist-synced', data);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

// Make io available in routes (for notifications)
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'VibeSync Backend ✅', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 VibeSync Server + Socket.IO on port ${PORT}`);
});
