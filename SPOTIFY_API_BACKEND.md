# Spotify API Backend Integration

## Overview
Complete Spotify Web API integration for VibeSync backend with OAuth2 authentication, token persistence, and comprehensive music catalog access.

## Environment Variables

Add these to your `.env` file:
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://your-domain.com/api/spotify/callback
FRONTEND_URL=https://your-frontend-domain.com  # Optional, defaults to http://localhost:3000
```

## Architecture

### Models

#### User Model Updates
The User model has been extended with Spotify fields:
- `spotify.connected` - Boolean indicating connection status
- `spotify.spotifyId` - Spotify user ID
- `spotify.displayName` - Spotify display name
- `spotify.profileImage` - Spotify profile image URL
- `spotify.accessToken` - OAuth access token
- `spotify.refreshToken` - OAuth refresh token
- `spotify.tokenExpiresAt` - Token expiry timestamp
- `spotifyStats.totalListeningTime` - Total minutes listened
- `spotifyStats.topGenres` - Array of user's top genres
- `spotifyStats.recentlyPlayed` - Recent track history

### Services

#### spotifyService.js
Central service for all Spotify API calls:
- OAuth URL generation
- Token exchange and refresh
- All Spotify API endpoints
- Error handling

### Routes

All routes are under `/api/spotify` and require JWT authentication.

## API Endpoints

### Authentication

#### GET /api/spotify/login
Get Spotify OAuth URL for authentication.

**Response:**
```json
{
  "authUrl": "https://accounts.spotify.com/authorize?..."
}
```

#### GET /api/spotify/callback
OAuth callback endpoint (used by Spotify, not frontend).

Redirects to frontend with query params:
- `?spotify=success` - Connection successful
- `?spotify=error&message=...` - Connection failed

#### GET /api/spotify/status
Check if user has connected Spotify.

**Response:**
```json
{
  "connected": true,
  "displayName": "John Doe",
  "profileImage": "https://...",
  "connectedAt": "2024-01-15T10:30:00.000Z"
}
```

#### POST /api/spotify/disconnect
Disconnect Spotify account.

**Response:**
```json
{
  "message": "Spotify disconnected successfully"
}
```

### Search

#### GET /api/spotify/search
Search Spotify catalog.

**Query Parameters:**
- `q` (required) - Search query
- `types` - Comma-separated types: track,artist,album,playlist (default: all)
- `limit` - Number of results (default: 20, max: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "tracks": { "items": [...] },
  "artists": { "items": [...] },
  "albums": { "items": [...] },
  "playlists": { "items": [...] }
}
```

### Tracks

#### GET /api/spotify/tracks/:id
Get track details by ID.

#### GET /api/spotify/tracks?ids=id1,id2,id3
Get multiple tracks by IDs.

### Artists

#### GET /api/spotify/artists/:id
Get artist details.

#### GET /api/spotify/artists/:id/top-tracks
Get artist's top tracks.

### Albums

#### GET /api/spotify/albums/:id
Get album details.

### User Data

#### GET /api/spotify/me
Get current user's Spotify profile.

#### GET /api/spotify/me/playlists
Get user's playlists.

**Query Parameters:**
- `limit` - Number of playlists (default: 20)
- `offset` - Pagination offset (default: 0)

#### GET /api/spotify/me/top/tracks
Get user's top tracks.

**Query Parameters:**
- `time_range` - short_term (4 weeks), medium_term (6 months), long_term (all time)
- `limit` - Number of tracks (default: 20)

**Also updates:** User's top genres in database

#### GET /api/spotify/me/top/artists
Get user's top artists.

**Query Parameters:**
- `time_range` - short_term, medium_term, long_term
- `limit` - Number of artists (default: 20)

**Also updates:** User's top genres in database

#### GET /api/spotify/me/recently-played
Get recently played tracks.

**Query Parameters:**
- `limit` - Number of tracks (default: 20)

**Also updates:** Total listening time in database

#### GET /api/spotify/me/player
Get current playback state.

### Playlists

#### GET /api/spotify/playlists/:id
Get playlist details.

#### GET /api/spotify/playlists/:id/tracks
Get playlist tracks.

**Query Parameters:**
- `limit` - Number of tracks (default: 100)
- `offset` - Pagination offset (default: 0)

### Browse

#### GET /api/spotify/browse/featured-playlists
Get featured playlists.

#### GET /api/spotify/browse/new-releases
Get new album releases.

#### GET /api/spotify/browse/categories
Get browse categories.

### Recommendations

#### GET /api/spotify/recommendations
Get track recommendations.

**Query Parameters:**
- `seed_tracks` - Comma-separated track IDs
- `seed_artists` - Comma-separated artist IDs
- `seed_genres` - Comma-separated genres
- `limit` - Number of tracks (default: 20)

#### GET /api/spotify/recommendations/available-genre-seeds
Get available genre seeds for recommendations.

## Token Management

### Automatic Token Refresh
- Tokens are automatically refreshed 5 minutes before expiry
- Refresh tokens are stored securely in the database
- Failed refresh attempts mark the connection as disconnected

### Token Storage
- Access tokens stored in: `user.spotify.accessToken`
- Refresh tokens stored in: `user.spotify.refreshToken`
- Expiry stored in: `user.spotify.tokenExpiresAt`

## Error Handling

### Common Error Responses

#### 401 - Not Connected
```json
{
  "error": "Spotify not connected",
  "needsAuth": true
}
```

#### 500 - Server Error
```json
{
  "error": "Error message here"
}
```

### Error Scenarios
1. **Token expired** - Automatic refresh attempted
2. **Refresh failed** - Connection marked as disconnected
3. **Spotify API error** - Passed through with 500 status
4. **Invalid token** - Returns 401 with needsAuth flag

## Database Schema

### User Collection Updates

```javascript
{
  // ... existing fields
  
  spotify: {
    connected: Boolean,
    connectedAt: Date,
    spotifyId: String,
    displayName: String,
    profileImage: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date
  },
  
  spotifyStats: {
    totalListeningTime: Number,  // in minutes
    topGenres: [String],
    recentlyPlayed: [{
      trackId: String,
      trackName: String,
      artistName: String,
      playedAt: Date
    }]
  }
}
```

## Usage Examples

### Connect Spotify
```javascript
// Frontend: Get auth URL
const { authUrl } = await fetch('/api/spotify/login', {
  headers: { 'Authorization': 'Bearer JWT_TOKEN' }
}).then(r => r.json());

// Redirect user to Spotify
window.location.href = authUrl;

// User authorizes on Spotify...
// Spotify redirects to /api/spotify/callback
// Backend redirects to frontend with ?spotify=success
```

### Search Tracks
```javascript
const results = await fetch('/api/spotify/search?q=drake&types=track&limit=10', {
  headers: { 'Authorization': 'Bearer JWT_TOKEN' }
}).then(r => r.json());
```

### Get User's Top Tracks
```javascript
const topTracks = await fetch('/api/spotify/me/top/tracks?time_range=medium_term&limit=20', {
  headers: { 'Authorization': 'Bearer JWT_TOKEN' }
}).then(r => r.json());
```

### Get Recommendations
```javascript
const recommendations = await fetch(
  '/api/spotify/recommendations?seed_tracks=trackId1,trackId2&seed_genres=pop,rock&limit=10',
  { headers: { 'Authorization': 'Bearer JWT_TOKEN' } }
).then(r => r.json());
```

## Testing

### Manual Testing

1. **Connect Account:**
```bash
# Get auth URL
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:4000/api/spotify/login

# Follow the URL in browser and authorize
# Check connection status
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:4000/api/spotify/status
```

2. **Search:**
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  "http://localhost:4000/api/spotify/search?q=the+weeknd&types=track,artist"
```

3. **Get User Data:**
```bash
curl -H "Authorization: Bearer YOUR_JWT" \
  http://localhost:4000/api/spotify/me/top/tracks
```

## Rate Limits

Spotify API rate limits:
- Web API: No specific limits documented, but implement reasonable request spacing
- Implement caching for frequently accessed data
- Use CDN for images (Spotify provides CDN URLs)

## Security Considerations

1. **Token Storage:**
   - Access tokens stored in database (encrypted in production)
   - Refresh tokens never exposed to frontend
   - Tokens automatically cleared on disconnect

2. **HTTPS:**
   - Always use HTTPS in production
   - Redirect URI must match Spotify app settings exactly

3. **Scopes:**
   - Request minimal required scopes
   - Current scopes: user-read-private, user-read-email, playlist-read-private, user-top-read, user-read-recently-played, user-read-playback-state, user-modify-playback-state, user-read-currently-playing, streaming

## Production Deployment

### Spotify App Configuration
1. Go to https://developer.spotify.com/dashboard
2. Create app or edit existing
3. Add Redirect URI: `https://your-domain.com/api/spotify/callback`
4. Add frontend domain to "Website" field
5. Save changes

### Environment Setup
```bash
# Production .env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=https://api.yourdomain.com/api/spotify/callback
FRONTEND_URL=https://app.yourdomain.com
```

### Database Migration
If updating existing users collection:
```javascript
// Add Spotify fields to existing users
db.users.updateMany(
  {},
  {
    $set: {
      spotify: {
        connected: false,
        connectedAt: null,
        spotifyId: null,
        displayName: null,
        profileImage: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null
      },
      spotifyStats: {
        totalListeningTime: 0,
        topGenres: [],
        recentlyPlayed: []
      }
    }
  }
);
```

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check SPOTIFY_REDIRECT_URI matches exactly in Spotify app settings
   - Include full URL with protocol (https://)

2. **"User not connected"**
   - User needs to authenticate with Spotify first
   - Check /api/spotify/status endpoint

3. **Token refresh failing**
   - Refresh token may be revoked
   - User needs to reconnect Spotify

4. **CORS errors**
   - Ensure frontend URL is in Spotify app settings
   - Check CORS configuration in backend

## Future Enhancements

1. **Playback Control:**
   - Play/pause/skip endpoints
   - Volume control
   - Queue management

2. **Playlist Management:**
   - Create playlists
   - Add/remove tracks
   - Reorder tracks

3. **Social Features:**
   - Share playlists
   - Collaborative playlists
   - Friend activity

4. **Analytics:**
   - Listening history charts
   - Genre distribution
   - Time-based stats

5. **Caching:**
   - Redis for token storage
   - CDN for images
   - API response caching
