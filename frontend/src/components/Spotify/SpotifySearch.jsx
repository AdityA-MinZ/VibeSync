import React, { useState, useEffect, useCallback } from 'react';
import { 
  searchSpotify, 
  getSpotifyImage, 
  formatDuration,
  formatNumber 
} from '../../services/spotifyService';
import './SpotifySearch.css';

function SpotifySearch({ onTrackSelect, onPlaylistSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    tracks: [],
    artists: [],
    albums: [],
    playlists: []
  });
  const [activeTab, setActiveTab] = useState('tracks');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const types = ['track', 'artist', 'album', 'playlist'];
        const data = await searchSpotify(searchQuery, types, 20);
        setResults({
          tracks: data.tracks?.items || [],
          artists: data.artists?.items || [],
          albums: data.albums?.items || [],
          playlists: data.playlists?.items || []
        });
        setHasSearched(true);
      } catch (err) {
        console.error('Spotify search error:', err);
        if (err.response?.data?.needsAuth) {
          setError('Please connect your Spotify account to search');
        } else {
          setError('Failed to search Spotify. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleSearch = (e) => {
    setQuery(e.target.value);
  };

  const getTotalResults = () => {
    return results.tracks.length + results.artists.length + 
           results.albums.length + results.playlists.length;
  };

  const tabs = [
    { id: 'tracks', label: 'Tracks', count: results.tracks.length },
    { id: 'artists', label: 'Artists', count: results.artists.length },
    { id: 'albums', label: 'Albums', count: results.albums.length },
    { id: 'playlists', label: 'Playlists', count: results.playlists.length }
  ];

  return (
    <div className="spotify-search">
      <div className="spotify-search-header">
        <div className="spotify-search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="spotify-search-input"
            placeholder="Search Spotify for songs, artists, albums, playlists..."
            value={query}
            onChange={handleSearch}
          />
          {query && (
            <button 
              className="clear-search"
              onClick={() => setQuery('')}
            >
              ×
            </button>
          )}
        </div>
        <div className="spotify-brand">
          <span>Powered by</span>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
      </div>

      {error && (
        <div className="spotify-search-error">
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="spotify-search-loading">
          <div className="spinner"></div>
          <p>Searching Spotify...</p>
        </div>
      )}

      {hasSearched && !loading && (
        <>
          <div className="spotify-search-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`search-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span className="result-count">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="spotify-search-results">
            {getTotalResults() === 0 ? (
              <div className="no-results">
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <>
                {activeTab === 'tracks' && results.tracks.length > 0 && (
                  <div className="spotify-tracks-grid">
                    {results.tracks.map(track => (
                      <div 
                        key={track.id} 
                        className="spotify-track-card"
                        onClick={() => onTrackSelect && onTrackSelect(track)}
                      >
                        <div className="track-image">
                          <img 
                            src={getSpotifyImage(track.album?.images, 'medium')} 
                            alt={track.name}
                          />
                          <div className="play-overlay">
                            <span className="play-icon">▶</span>
                          </div>
                        </div>
                        <div className="track-info">
                          <h4 className="track-name">{track.name}</h4>
                          <p className="track-artist">
                            {track.artists?.map(a => a.name).join(', ')}
                          </p>
                          <div className="track-meta">
                            <span className="track-duration">
                              {formatDuration(track.duration_ms)}
                            </span>
                            <span className="track-popularity">
                              ⭐ {track.popularity}/100
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'artists' && results.artists.length > 0 && (
                  <div className="spotify-artists-grid">
                    {results.artists.map(artist => (
                      <div key={artist.id} className="spotify-artist-card">
                        <div className="artist-image">
                          <img 
                            src={getSpotifyImage(artist.images, 'medium')} 
                            alt={artist.name}
                          />
                        </div>
                        <div className="artist-info">
                          <h4 className="artist-name">{artist.name}</h4>
                          <p className="artist-followers">
                            {formatNumber(artist.followers?.total || 0)} followers
                          </p>
                          <p className="artist-genres">
                            {artist.genres?.slice(0, 2).join(', ') || 'Artist'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'albums' && results.albums.length > 0 && (
                  <div className="spotify-albums-grid">
                    {results.albums.map(album => (
                      <div key={album.id} className="spotify-album-card">
                        <div className="album-image">
                          <img 
                            src={getSpotifyImage(album.images, 'medium')} 
                            alt={album.name}
                          />
                        </div>
                        <div className="album-info">
                          <h4 className="album-name">{album.name}</h4>
                          <p className="album-artist">
                            {album.artists?.map(a => a.name).join(', ')}
                          </p>
                          <p className="album-year">
                            {album.release_date?.substring(0, 4)} • {album.total_tracks} tracks
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'playlists' && results.playlists.length > 0 && (
                  <div className="spotify-playlists-grid">
                    {results.playlists.map(playlist => (
                      <div 
                        key={playlist.id} 
                        className="spotify-playlist-card"
                        onClick={() => onPlaylistSelect && onPlaylistSelect(playlist)}
                      >
                        <div className="playlist-image">
                          <img 
                            src={getSpotifyImage(playlist.images, 'medium')} 
                            alt={playlist.name}
                          />
                        </div>
                        <div className="playlist-info">
                          <h4 className="playlist-name">{playlist.name}</h4>
                          <p className="playlist-owner">
                            by {playlist.owner?.display_name || playlist.owner?.id}
                          </p>
                          <p className="playlist-tracks">
                            {playlist.tracks?.total || 0} tracks
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {!hasSearched && !loading && (
        <div className="spotify-search-empty">
          <div className="empty-icon">🎵</div>
          <h3>Search Spotify</h3>
          <p>Find your favorite songs, artists, albums, and playlists from Spotify's catalog of over 70 million tracks.</p>
          <div className="search-tips">
            <span>Try searching for:</span>
            <div className="tip-tags">
              <span className="tip-tag">Drake</span>
              <span className="tip-tag">Taylor Swift</span>
              <span className="tip-tag">Rock music</span>
              <span className="tip-tag">Workout playlist</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default SpotifySearch;
