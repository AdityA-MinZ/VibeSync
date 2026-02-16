# 🎵 Collaborative Music Playback System

## Overview
A real-time collaborative music playback system that allows friends to listen to music together synchronously.

## Features
- ✅ Create/join playback sessions
- ✅ Real-time synchronized playback
- ✅ Queue management (add/remove tracks)
- ✅ Play/Pause/Skip/Seek controls
- ✅ Permission system (host vs participants)
- ✅ Session settings (public/private, control permissions)
- ✅ Playback history tracking
- ✅ WebSocket-based real-time sync

---

## API Endpoints

### Session Management

#### Create Session
```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Friday Night Vibes",
  "description": "Chill music session",
  "settings": {
    "isPublic": false,
    "allowOthersToAdd": true,
    "allowOthersToControl": false,
    "syncMode": "strict"
  }
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "A3F7B2D1",
    "name": "Friday Night Vibes",
    "host": { "_id": "...", "username": "user123" },
    "participants": [...],
    "settings": {...}
  }
}
```

#### Get User Sessions
```http
GET /api/sessions
Authorization: Bearer <token>
```

#### Get Public Sessions
```http
GET /api/sessions/public?limit=20
Authorization: Bearer <token>
```

#### Get Session Details
```http
GET /api/sessions/:sessionId
Authorization: Bearer <token>
```

#### Join Session
```http
POST /api/sessions/:sessionId/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "socketId": "socket_id_from_frontend"
}
```

#### Leave Session
```http
POST /api/sessions/:sessionId/leave
Authorization: Bearer <token>
```

#### End Session (Host only)
```http
POST /api/sessions/:sessionId/end
Authorization: Bearer <token>
```

---

### Playback Controls

#### Play
```http
POST /api/sessions/:sessionId/play
Authorization: Bearer <token>
Content-Type: application/json

{
  "track": {
    "trackId": "spotify:track:123",
    "title": "Song Name",
    "artist": "Artist Name",
    "album": "Album Name",
    "duration": 240,
    "coverArt": "https://...",
    "source": "spotify"
  }
}
```

#### Pause
```http
POST /api/sessions/:sessionId/pause
Authorization: Bearer <token>
```

#### Skip
```http
POST /api/sessions/:sessionId/skip
Authorization: Bearer <token>
```

#### Seek
```http
POST /api/sessions/:sessionId/seek
Authorization: Bearer <token>
Content-Type: application/json

{
  "position": 120  // seconds
}
```

#### Get Sync State
```http
GET /api/sessions/:sessionId/sync
Authorization: Bearer <token>
```

---

### Queue Management

#### Add to Queue
```http
POST /api/sessions/:sessionId/queue
Authorization: Bearer <token>
Content-Type: application/json

{
  "trackId": "spotify:track:456",
  "title": "Next Song",
  "artist": "Next Artist",
  "duration": 180,
  "source": "spotify"
}
```

#### Remove from Queue
```http
DELETE /api/sessions/:sessionId/queue/:position
Authorization: Bearer <token>
```

---

### Session Settings

#### Update Settings (Host only)
```http
PUT /api/sessions/:sessionId/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "isPublic": true,
  "allowOthersToAdd": true,
  "allowOthersToControl": false,
  "syncMode": "relaxed"
}
```

---

## WebSocket Events (Socket.IO)

### Client → Server Events

#### Join Session
```javascript
socket.emit('join-playback-session', {
  sessionId: 'A3F7B2D1',
  userId: 'user123'
});
```

#### Leave Session
```javascript
socket.emit('leave-playback-session', {
  sessionId: 'A3F7B2D1',
  userId: 'user123'
});
```

#### Play
```javascript
socket.emit('session-play', {
  sessionId: 'A3F7B2D1',
  userId: 'user123',
  track: {
    trackId: 'spotify:track:123',
    title: 'Song Name',
    artist: 'Artist Name',
    duration: 240
  }
});
```

#### Pause
```javascript
socket.emit('session-pause', {
  sessionId: 'A3F7B2D1',
  userId: 'user123'
});
```

#### Skip
```javascript
socket.emit('session-skip', {
  sessionId: 'A3F7B2D1',
  userId: 'user123'
});
```

#### Seek
```javascript
socket.emit('session-seek', {
  sessionId: 'A3F7B2D1',
  userId: 'user123',
  position: 120  // seconds
});
```

#### Add to Queue
```javascript
socket.emit('session-add-queue', {
  sessionId: 'A3F7B2D1',
  userId: 'user123',
  track: {
    trackId: 'spotify:track:456',
    title: 'Next Song',
    artist: 'Artist Name'
  }
});
```

#### Remove from Queue
```javascript
socket.emit('session-remove-queue', {
  sessionId: 'A3F7B2D1',
  userId: 'user123',
  position: 2
});
```

#### Request Sync (for new joiners)
```javascript
socket.emit('session-request-sync', {
  sessionId: 'A3F7B2D1'
});
```

#### Update Position (periodic)
```javascript
socket.emit('session-update-position', {
  sessionId: 'A3F7B2D1',
  position: 125  // current playback position
});
```

---

### Server → Client Events

#### Session Joined
```javascript
socket.on('session-joined', (data) => {
  console.log('Joined session:', data.session);
  console.log('Sync state:', data.syncState);
});
```

#### User Joined
```javascript
socket.on('user-joined-session', (data) => {
  console.log('User joined:', data.userId);
});
```

#### User Left
```javascript
socket.on('user-left-session', (data) => {
  console.log('User left:', data.userId);
});
```

#### Playback Update
```javascript
socket.on('session-playback-update', (data) => {
  // data.type: 'play', 'pause', 'skip', 'seek'
  // data.session: full session object
  // data.triggeredBy: userId who triggered
  console.log('Playback update:', data);
});
```

#### Queue Update
```javascript
socket.on('session-queue-update', (data) => {
  // data.type: 'add', 'remove'
  // data.track or data.position
  console.log('Queue updated:', data);
});
```

#### Position Update (periodic)
```javascript
socket.on('session-position-update', (data) => {
  console.log('Current position:', data.position);
});
```

#### Sync Data (response to request-sync)
```javascript
socket.on('session-sync-data', (data) => {
  console.log('Sync data:', data);
  // data.isPlaying, data.currentTrack, data.position, data.queue
});
```

#### Error
```javascript
socket.on('session-error', (data) => {
  console.error('Session error:', data.message);
});
```

---

## Session Model Schema

```javascript
{
  sessionId: String,          // Unique session code (e.g., "A3F7B2D1")
  name: String,               // Session name
  description: String,        // Session description
  host: ObjectId,             // Host user reference
  participants: [{            // Active participants
    user: ObjectId,
    joinedAt: Date,
    isActive: Boolean,
    socketId: String
  }],
  currentTrack: {             // Currently playing track
    trackId: String,
    title: String,
    artist: String,
    album: String,
    duration: Number,
    coverArt: String,
    source: String,          // 'spotify', 'youtube', 'local'
    addedBy: ObjectId,
    addedAt: Date
  },
  isPlaying: Boolean,         // Playback state
  currentPosition: Number,    // Current position in seconds
  startedAt: Date,           // When playback started
  pausedAt: Date,            // When playback paused
  queue: [{                   // Upcoming tracks
    trackId: String,
    title: String,
    artist: String,
    position: Number,
    addedBy: ObjectId
  }],
  settings: {
    isPublic: Boolean,       // Can anyone join?
    allowOthersToAdd: Boolean,    // Can participants add tracks?
    allowOthersToControl: Boolean, // Can participants control playback?
    syncMode: String         // 'strict' or 'relaxed'
  },
  status: String,            // 'active', 'paused', 'ended'
  history: [{                // Past tracks
    trackId: String,
    title: String,
    playedAt: Date,
    duration: Number
  }],
  createdAt: Date,
  endedAt: Date
}
```

---

## Permission System

| Action | Host | Participant (with control) | Participant (without control) |
|--------|------|---------------------------|------------------------------|
| Create Session | ✅ | ❌ | ❌ |
| End Session | ✅ | ❌ | ❌ |
| Play/Pause | ✅ | ✅* | ❌ |
| Skip | ✅ | ✅* | ❌ |
| Seek | ✅ | ✅* | ❌ |
| Add to Queue | ✅ | ✅ | ✅* |
| Remove from Queue | ✅ | ✅ (own tracks) | ✅ (own tracks) |
| Change Settings | ✅ | ❌ | ❌ |

*Requires `allowOthersToControl: true` in settings
*Requires `allowOthersToAdd: true` in settings

---

## Frontend Integration Example

```javascript
import io from 'socket.io-client';

class CollaborativePlayback {
  constructor() {
    this.socket = io('http://localhost:4000');
    this.currentSession = null;
    this.setupListeners();
  }

  setupListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to playback server');
    });

    // Session events
    this.socket.on('session-joined', (data) => {
      this.currentSession = data.session;
      this.syncPlayback(data.syncState);
    });

    this.socket.on('session-playback-update', (data) => {
      this.handlePlaybackUpdate(data);
    });

    this.socket.on('session-queue-update', (data) => {
      this.updateQueue(data);
    });

    this.socket.on('session-position-update', (data) => {
      this.updatePosition(data.position);
    });
  }

  // Join a session
  async joinSession(sessionId, userId) {
    this.socket.emit('join-playback-session', {
      sessionId,
      userId
    });
  }

  // Play a track
  play(track) {
    this.socket.emit('session-play', {
      sessionId: this.currentSession.sessionId,
      userId: this.userId,
      track
    });
  }

  // Pause
  pause() {
    this.socket.emit('session-pause', {
      sessionId: this.currentSession.sessionId,
      userId: this.userId
    });
  }

  // Sync playback state
  syncPlayback(state) {
    if (state.isPlaying) {
      // Calculate current position based on elapsed time
      const elapsed = (Date.now() - new Date(state.startedAt).getTime()) / 1000;
      const currentPosition = state.position + elapsed;
      
      // Update your player
      this.player.seek(currentPosition);
      this.player.play();
    }
  }

  // Handle playback updates from server
  handlePlaybackUpdate(data) {
    switch (data.type) {
      case 'play':
        this.player.play();
        break;
      case 'pause':
        this.player.pause();
        break;
      case 'skip':
        this.loadTrack(data.session.currentTrack);
        break;
      case 'seek':
        this.player.seek(data.position);
        break;
    }
  }
}

// Usage
const playback = new CollaborativePlayback();
playback.joinSession('A3F7B2D1', 'user123');
```

---

## Testing

Run the test suite:
```bash
cd backend
npm run test:sessions
```

Manual testing with curl:
```bash
# Create session
curl -X POST http://localhost:4000/api/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Session", "settings": {"isPublic": true}}'

# Join session
curl -X POST http://localhost:4000/api/sessions/A3F7B2D1/join \
  -H "Authorization: Bearer <token>"

# Add to queue
curl -X POST http://localhost:4000/api/sessions/A3F7B2D1/queue \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"trackId": "123", "title": "Test Song", "artist": "Test Artist"}'

# Play
curl -X POST http://localhost:4000/api/sessions/A3F7B2D1/play \
  -H "Authorization: Bearer <token>"
```

---

## Architecture

```
Client A                    Server                    Client B
  |                           |                           |
  |---- join-playback-session ->|                           |
  |                           |---- join-playback-session ->|
  |                           |                           |
  |---- session-play -------->|                           |
  |                           |---- session-playback-update ->|
  |                           |                           | (plays track)
  |                           |                           |
  |                           |<--- session-pause ---------|
  |<-- session-playback-update |                           |
  | (pauses)                  |                           |
  |                           |                           |
```

---

## Notes

1. **Synchronization**: In "strict" mode, all clients are forced to sync. In "relaxed" mode, small delays are allowed.

2. **Position Tracking**: Server tracks playback position and broadcasts updates every 5 seconds.

3. **Reconnection**: If a user disconnects and reconnects, they should call `session-request-sync` to get current state.

4. **Host Transfer**: Currently, if host leaves, session ends. Future: transfer host to another participant.

5. **Track Sources**: Supports Spotify, YouTube, and local tracks. Track metadata should include source type.
