# VibeSync

A full-stack social music streaming platform built with React, Node.js, Express, MongoDB, and Socket.io.

## Features

- **Music Streaming**: Stream music from YouTube, Spotify, and Apple Music
- **Playlists**: Create, edit, and share playlists
- **Social Features**: Follow users, friends system, likes, comments
- **Real-time**: Live collaborative listening sessions via Socket.io
- **User Profiles**: Customizable profiles with avatars and cover images
- **Search**: Search tracks, playlists, users, and boards
- **Notifications**: Real-time notifications for social activities
- **Listening Streaks**: Track daily listening habits
- **Boards**: Save and organize favorite tracks

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (real-time features)
- JWT authentication
- Multer (file uploads)

### Frontend
- React 19 (Create React App)
- React Router
- Axios
- Socket.io Client

## Project Structure

```
VibeSync/
├── backend/
│   ├── middleware/       # Auth middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── socket/          # Socket.io handlers
│   ├── utils/           # Utility functions
│   ├── uploads/         # Uploaded files
│   ├── server.js        # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── services/    # API service layer
│   │   ├── context/     # React contexts
│   │   ├── pages/       # Page components
│   │   ├── app.jsx      # Main app component
│   │   └── index.js     # Entry point
│   ├── public/
│   ├── package.json
│   └── README.md
├── AGENTS.md            # Development guidelines
└── vercel.json          # Vercel deployment config
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd VibeSync
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   
   Create `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/vibesync
   JWT_SECRET=your-secret-key
   PORT=4000
   NODE_ENV=development
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

**Development mode:**

```bash
# Terminal 1 - Backend (port 4000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm start
```

**Production build:**

```bash
cd frontend
npm run build
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:userId` | Get user profile |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/avatar` | Upload avatar |
| POST | `/api/users/cover` | Upload cover image |

### Playlists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/playlists` | Get user playlists |
| POST | `/api/playlists` | Create playlist |
| GET | `/api/playlists/:id` | Get playlist |
| PUT | `/api/playlists/:id` | Update playlist |
| DELETE | `/api/playlists/:id` | Delete playlist |
| POST | `/api/playlists/:id/tracks` | Add track |
| DELETE | `/api/playlists/:id/tracks/:trackId` | Remove track |

### Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/social/likes/toggle` | Toggle like |
| GET | `/api/social/likes/check` | Check like status |
| GET | `/api/social/likes/count` | Get like count |
| POST | `/api/social/follow/:userId` | Follow user |
| POST | `/api/social/unfollow/:userId` | Unfollow user |
| GET | `/api/social/follow/status/:userId` | Check follow status |
| GET | `/api/social/followers/:userId` | Get followers |
| GET | `/api/social/following/:userId` | Get following |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/social/comments` | Add comment |
| GET | `/api/social/comments` | Get comments |
| PUT | `/api/social/comments/:id` | Edit comment |
| DELETE | `/api/social/comments/:id` | Delete comment |
| POST | `/api/social/comments/:id/like` | Like comment |

### Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | Get friends list |
| POST | `/api/friends/request` | Send request |
| POST | `/api/friends/accept` | Accept request |
| POST | `/api/friends/reject` | Reject request |
| DELETE | `/api/friends/:userId` | Remove friend |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| PUT | `/api/notifications/:id/read` | Mark as read |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=` | Search all content |

### Boards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | Get boards |
| POST | `/api/boards` | Create board |
| GET | `/api/boards/:id` | Get board |
| PUT | `/api/boards/:id` | Update board |
| DELETE | `/api/boards/:id` | Delete board |
| POST | `/api/boards/:id/items` | Add item |
| DELETE | `/api/boards/:id/items/:itemId` | Remove item |

### Streaks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/streaks` | Get user streak |
| POST | `/api/streaks/listen` | Log listening session |

### Feed
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/feed` | Get activity feed |

### Listening Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create session |
| GET | `/api/sessions/:id` | Get session |
| POST | `/api/sessions/:id/join` | Join session |

### YouTube
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/youtube/search` | Search YouTube |
| GET | `/api/youtube/track/:id` | Get track info |

## Database Models

- **User** - User accounts and profiles
- **Playlist** - User playlists with tracks
- **Track** - Music track metadata
- **Comment** - Comments on tracks/playlists/albums
- **Like** - Likes on various content
- **Friend** - Friend relationships
- **Message** - Direct messages between users
- **Notification** - User notifications
- **Board** - Collection of saved tracks
- **ListeningSession** - Collaborative listening
- **PlaybackSession** - Playback state sync

## Real-time Features (Socket.io)

- **Collaborative Listening**: Multiple users can listen together
- **Live Updates**: Likes, comments, follows in real-time
- **Notifications**: Instant notification delivery

Socket events:
- `join-session` - Join a listening session
- `leave-session` - Leave a session
- `playback-update` - Sync playback state
- `user-joined` - User joined notification
- `user-left` - User left notification

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/vibesync
JWT_SECRET=your-secret-key
PORT=4000
NODE_ENV=development
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:4000/api
```

## Deployment

### Vercel (Frontend + Backend)
The project is configured for Vercel deployment with `vercel.json` in the root.

### Render/Heroku (Backend only)
Build command: `npm install`
Start command: `npm start`

## License

MIT
