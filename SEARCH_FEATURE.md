# VibeSync Search Feature

## Overview
The VibeSync search functionality provides comprehensive search capabilities across all content types including tracks, artists, playlists, and users.

## Backend Implementation

### Search Routes (`/backend/routes/search.js`)
- **GET `/api/search`** - Basic search with query parameter
  - Query params: `q` (search term), `type` (all|tracks|artists|playlists|users), `limit`
  - Returns categorized results

- **POST `/api/search/advanced`** - Advanced search with filters
  - Body: `{ q, type, genre, mood, duration, sortBy, page, limit }`
  - Supports pagination and sorting

- **GET `/api/search/suggestions`** - Get search suggestions
  - Query params: `q` (partial search term)
  - Returns autocomplete suggestions

- **GET `/api/search/trending`** - Get trending searches
  - Returns popular search terms

### Models

#### Track Model (`/backend/models/Track.js`)
New model with comprehensive fields:
- `title` (indexed for search)
- `artist` (indexed)
- `genre` (indexed, enum)
- `mood` (indexed, enum)
- `description`
- `duration`
- `audioUrl`
- `coverArt`
- `creator` (reference to User)
- `plays` (indexed)
- `likes` (indexed)
- `tags` (array, indexed)
- `visibility` (public|friends|private)
- `isActive`

Indexes:
- Text index on title, artist, description
- Compound indexes for common queries

### API Integration

The search API is authenticated using JWT tokens. All endpoints require the `Authorization: Bearer <token>` header.

## Frontend Implementation

### Search Service (`/frontend/src/services/searchService.js`)
API wrapper functions:
- `searchAll(query, type, limit)` - Basic search
- `advancedSearch(params)` - Advanced search with filters
- `getSuggestions(query)` - Get autocomplete suggestions
- `getTrendingSearches()` - Get trending searches

### SearchResults Component (`/frontend/src/components/SearchResults.jsx`)
Features:
- Tabbed interface for different result types
- Real-time search suggestions
- Trending searches display
- Track, Artist, Playlist, and User result cards
- Responsive grid layouts
- Loading states and error handling
- Empty state with search tips

### Integration with HomePage
The search bar in HomePage now:
- Accepts search queries (minimum 2 characters)
- Shows search button when typing
- Opens SearchResults overlay on submit
- Closes with Escape key or click outside
- Can select tracks to play

## Usage

### Basic Search
1. Type in the search bar (min 2 characters)
2. Press Enter or click the search button
3. View results categorized by type
4. Click tabs to filter by specific type

### Features
- **All Tab**: Shows results from all categories
- **Tracks Tab**: Shows matching tracks with artwork and stats
- **Artists Tab**: Shows artist profiles with follow buttons
- **Playlists Tab**: Shows playlists with track counts
- **Users Tab**: Shows user profiles

### Search Tips
- Use artist names for best results
- Try genre names (electronic, pop, hip-hop, etc.)
- Partial matches work (e.g., "mid" matches "midnight")
- Case-insensitive search

## Testing

### Backend Testing
```bash
cd backend
npm run dev

# Test search endpoint
curl -H "Authorization: Bearer <token>" \
  "http://localhost:4000/api/search?q=electronic&type=all"

# Test suggestions
curl -H "Authorization: Bearer <token>" \
  "http://localhost:4000/api/search/suggestions?q=mid"

# Test trending
curl -H "Authorization: Bearer <token>" \
  "http://localhost:4000/api/search/trending"
```

### Frontend Testing
1. Navigate to the home page
2. Click on the search bar
3. Type a search query (e.g., "summer", "electronic", "Luna")
4. Press Enter to see results
5. Switch between tabs to filter results
6. Click on tracks to play them
7. Close search with X button or Escape key

## Future Enhancements

1. **Full-text Search**: Implement MongoDB text search with scoring
2. **Elasticsearch**: For production-scale search
3. **Search History**: Store and display recent searches
4. **Filters UI**: Advanced filters panel in frontend
5. **Voice Search**: Speech-to-text integration
6. **Image Search**: Search by album artwork similarity
7. **AI Recommendations**: ML-based search result ranking

## Mock Data

The search currently returns mock track data for demonstration. To use real data:

1. Create Track documents in MongoDB
2. Update the `searchTracks` function in `/backend/routes/search.js` to query the Track model
3. Populate with real audio files and metadata

Example Track creation:
```javascript
const Track = require('./models/Track');

const newTrack = new Track({
  title: "My Song",
  artist: "Artist Name",
  genre: "electronic",
  mood: "energetic",
  duration: "3:45",
  audioUrl: "/uploads/audio/my-song.mp3",
  coverArt: "/uploads/covers/my-song.jpg",
  creator: userId,
  tags: ["electronic", "dance", "2024"],
  visibility: "public"
});

await newTrack.save();
```
