require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');  // For frontend serving
const streakIntegration = require('./utils/streakIntegration');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",  // Adjust for your frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ROOT ROUTE (fixes "Cannot GET /")
app.get('/', (req, res) => {
  res.json({ message: 'VibeSync Backend check', timestamp: new Date().toISOString() });
});

// API Routes (your existing ones)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/search', require('./routes/search'));
app.use('/api/spotify', require('./routes/spotify'));
app.use('/api/youtube', require('./routes/youtube'));
app.use('/api/streaks', require('./routes/streaks'));

// Production: Serve React frontend (if you have client/build folder)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build/index.html'));
  });
}

// Socket.IO events for VibeSync (team listening, etc.)
io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  
  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
  
  socket.on('user-login', (data) => {
    console.log('LOGIN EVENT:', data);
    socket.userId = data.userId;  // Store userId on socket
    io.emit('user-online', { userId: data.userId, status: 'online' });
  });
  
  socket.on('playing-track', async (data) => {
    console.log('PLAYING EVENT:', data);
    // Broadcast to friends room only
    io.to(`friends-${data.userId}`).emit('friend-playing', data);
    
    // Update user's listening streak
    if (data.userId) {
      try {
        const streakResult = await streakIntegration.onTrackPlay(data.userId);
        if (streakResult) {
          // Notify user of streak update
          socket.emit('streak-update', {
            currentStreak: streakResult.currentStreak,
            longestStreak: streakResult.longestStreak,
            message: streakResult.message
          });
        }
      } catch (error) {
        console.error('Streak update error in socket:', error.message);
      }
    }
  });
  
  socket.on('join-friends-room', (userId) => {
    console.log('Joining room:', `friends-${userId}`);
    socket.join(`friends-${userId}`);
    socket.join(`user-${userId}`);
  });
});

// Start server (Render-compatible)
const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VibeSync Server + Socket.IO on port ${PORT}`);
});
