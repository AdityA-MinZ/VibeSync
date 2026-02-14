# 🔥 Streak System Implementation Guide

## For Member 3: Backend Developer

### ✅ Implementation Status: COMPLETE

All streak functionality has been implemented and tested successfully.

---

## 📋 What Was Implemented

### 1. User Model Updates (`models/User.js`)

Added streak fields to User schema:

```javascript
streak: {
  currentStreak: { type: Number, default: 0 },      // Current consecutive days
  longestStreak: { type: Number, default: 0 },      // All-time record
  lastActiveDate: { type: Date, default: null }     // Last listening date
}
```

**Methods Added:**
- `user.updateStreak()` - Updates streak based on last active date
- `user.getStreakInfo()` - Returns streak info with active status

### 2. Streak Service (`services/streakService.js`)

Core business logic for streak management:

```javascript
// Update streak when user listens
await streakService.updateStreak(userId);

// Get streak info
await streakService.getStreakInfo(userId);

// Get leaderboard
await streakService.getLeaderboard(limit);
```

### 3. API Routes (`routes/streaks.js`)

Available endpoints:

```
GET  /api/streaks/me              → Get current user's streak
POST /api/streaks/update          → Manually update streak
GET  /api/streaks/:userId         → Get specific user's streak
GET  /api/streaks/leaderboard/top → Get top streaks leaderboard
```

### 4. Socket.IO Integration (`utils/streakIntegration.js`)

Automatic streak updates when users listen to music:

```javascript
// Automatically called when user emits 'playing-track' event
socket.on('playing-track', async (data) => {
  await streakIntegration.onTrackPlay(data.userId);
});
```

### 5. Server Integration (`server.js`)

Connected everything:
- Added streak routes
- Integrated with Socket.IO
- Ready for production

---

## 🎯 Core Streak Rules Implemented

### Rule 1: Day Active Definition
- A "day active" = user listened at least once between 00:00–23:59
- Uses local server time

### Rule 2: Streak Update Logic

```javascript
if (lastActive === today) {
  // Already counted today - do nothing
  return;
}

if (lastActive === yesterday) {
  // Consecutive day - increment streak
  currentStreak += 1;
} else {
  // Streak broken - start new streak
  currentStreak = 1;
}

// Always update
lastActiveDate = today;
longestStreak = max(longestStreak, currentStreak);
```

### Rule 3: Same Day Protection
- Multiple listens in same day don't double-count
- Streak only increments once per day

---

## 🧪 Test Results

All tests passed:

```
✅ Initial state: PASS
✅ First listen (Day 1): PASS
✅ Same day protection: PASS
✅ Consecutive days: PASS
✅ Broken streak reset: PASS
✅ Longest streak tracking: PASS
✅ Streak info retrieval: PASS
✅ Leaderboard: PASS
```

**Run tests:**
```bash
cd backend
npm run test:streaks
```

---

## 🚀 How to Use (For Member 3)

### Option 1: Automatic (Socket.IO) - RECOMMENDED

Streaks update automatically when users listen via WebSocket:

```javascript
// Frontend emits
socket.emit('playing-track', {
  userId: 'user123',
  track: { title: 'Song Name', artist: 'Artist' }
});

// Backend automatically:
// 1. Updates streak
// 2. Emits 'streak-update' event to user
```

**Already implemented in server.js - no action needed!**

### Option 2: Express Middleware

Add to any route that handles track playback:

```javascript
const streakIntegration = require('./utils/streakIntegration');

router.post('/play', 
  auth, 
  streakIntegration.middleware(),  // ← Add this
  trackController.play
);
```

### Option 3: Manual Service Call

Call directly from controllers:

```javascript
const streakService = require('./services/streakService');

// In your controller
exports.playTrack = async (req, res) => {
  // ... play track logic ...
  
  // Update streak
  await streakService.updateStreak(req.user.id);
  
  res.json({ success: true });
};
```

---

## 📊 API Documentation

### Get My Streak
```http
GET /api/streaks/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "currentStreak": 5,
  "longestStreak": 12,
  "lastActiveDate": "2026-02-14T10:30:00.000Z",
  "isActive": true,
  "daysSinceLastActive": 0
}
```

### Update Streak Manually
```http
POST /api/streaks/update
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "currentStreak": 6,
  "longestStreak": 12,
  "lastActiveDate": "2026-02-14T10:30:00.000Z",
  "message": "Streak updated successfully"
}
```

### Get Leaderboard
```http
GET /api/streaks/leaderboard/top?limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "userId": "...",
      "username": "musiclover123",
      "longestStreak": 45,
      "currentStreak": 12
    }
  ]
}
```

---

## 🔧 Frontend Integration (For Reference)

### Listen for Streak Updates
```javascript
socket.on('streak-update', (data) => {
  console.log(`🔥 Streak: ${data.currentStreak} days!`);
  // Update UI to show streak
});
```

### Get Streak Info
```javascript
const getStreak = async () => {
  const response = await fetch('/api/streaks/me', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await response.json();
  return data;
};
```

---

## 📁 Files to Review

1. **`models/User.js`** (lines 37-40, 62-108)
   - Streak schema fields
   - updateStreak() method
   - getStreakInfo() method

2. **`services/streakService.js`**
   - Complete business logic
   - All service methods

3. **`routes/streaks.js`**
   - API endpoints
   - Route handlers

4. **`utils/streakIntegration.js`**
   - Socket.IO integration
   - Middleware function

5. **`server.js`** (lines 8, 41, 62-75)
   - Streak integration setup

6. **`test-streaks.js`**
   - Comprehensive test suite
   - Usage examples

---

## ✅ Checklist for Member 3

- [x] User model updated with streak fields
- [x] Streak update logic implemented
- [x] Same-day protection working
- [x] Consecutive day tracking working
- [x] Broken streak reset working
- [x] Longest streak tracking working
- [x] API routes created
- [x] Socket.IO integration added
- [x] All tests passing
- [x] Documentation complete

---

## 🎉 Status: READY FOR PRODUCTION

The streak system is fully implemented, tested, and ready to use. All core functionality works as specified.

**Next Steps:**
1. Review the files listed above
2. Run `npm run test:streaks` to verify
3. Frontend can now call `/api/streaks/me` to display streaks
4. Streaks update automatically when users listen to music
