import React, { useState, useEffect, useCallback } from 'react';
import { searchAll, getSuggestions, getTrendingSearches } from '../services/searchService';
import { followUser, unfollowUser, checkFollowStatus } from '../services/socialService';
import './SearchResults.css';

function SearchResults({ query, onClose, onTrackSelect }) {
  const [results, setResults] = useState({
    tracks: [],
    artists: [],
    playlists: [],
    users: []
  });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [error, setError] = useState(null);
  const [followStatus, setFollowStatus] = useState({});
  const [followingLoading, setFollowingLoading] = useState({});

  const performSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await searchAll(query, activeTab === 'all' ? 'all' : activeTab);
      setResults(data.results);
    } catch (err) {
      setError('Failed to perform search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, activeTab]);

  const loadSuggestions = useCallback(async () => {
    try {
      const data = await getSuggestions(query);
      setSuggestions(data.suggestions);
    } catch (err) {
      console.error('Suggestions error:', err);
    }
  }, [query]);

  useEffect(() => {
    performSearch();
    loadTrending();
  }, [performSearch]);

  useEffect(() => {
    if (results.users.length > 0) {
      checkFollowStatuses();
    }
  }, [results.users, checkFollowStatuses]);

  const checkFollowStatuses = useCallback(async () => {
    const statuses = {};
    for (const user of results.users) {
      try {
        const { isFollowing } = await checkFollowStatus(user._id);
        statuses[user._id] = isFollowing;
      } catch (err) {
        statuses[user._id] = false;
      }
    }
    setFollowStatus(statuses);
  }, [results.users]);

  const handleFollowToggle = async (userId) => {
    setFollowingLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const isCurrentlyFollowing = followStatus[userId];
      if (isCurrentlyFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      setFollowStatus(prev => ({ ...prev, [userId]: !isCurrentlyFollowing }));
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setFollowingLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  useEffect(() => {
    if (query.length >= 2) {
      loadSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query, loadSuggestions]);

  const loadTrending = async () => {
    try {
      const data = await getTrendingSearches();
      setTrending(data.trending);
    } catch (err) {
      console.error('Trending error:', err);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    performSearch();
  };

  const getTotalResults = () => {
    return results.tracks.length + results.artists.length + 
           results.playlists.length + results.users.length;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const tabs = [
    { id: 'all', label: 'All', count: getTotalResults() },
    { id: 'tracks', label: 'Tracks', count: results.tracks.length },
    { id: 'artists', label: 'Artists', count: results.artists.length },
    { id: 'playlists', label: 'Playlists', count: results.playlists.length },
    { id: 'users', label: 'Users', count: results.users.length }
  ];

  if (loading) {
    return (
      <div className="search-results-overlay">
        <div className="search-results-container">
          <div className="search-loading">
            <div className="spinner"></div>
            <p>Searching for "{query}"...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results-overlay" onClick={onClose}>
      <div className="search-results-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="search-results-header">
          <h2>Search Results</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Search Query Display */}
        <div className="search-query-display">
          <span className="query-label">Results for:</span>
          <span className="query-text">"{query}"</span>
          <span className="results-count">({getTotalResults()} found)</span>
        </div>

        {/* Tabs */}
        <div className="search-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`search-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
              <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="search-suggestions">
            <h4>Suggestions</h4>
            <div className="suggestions-list">
              {suggestions.map((suggestion, idx) => (
                <span key={idx} className="suggestion-tag">
                  {suggestion.type === 'user' ? '@' : ''}{suggestion.text}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Results Content */}
        <div className="search-results-content">
          {error && (
            <div className="search-error">
              <p>{error}</p>
              <button onClick={performSearch}>Try Again</button>
            </div>
          )}

          {/* Tracks Section */}
          {(activeTab === 'all' || activeTab === 'tracks') && results.tracks.length > 0 && (
            <div className="result-section">
              {activeTab === 'all' && <h3 className="section-title">Tracks</h3>}
              <div className="tracks-grid">
                {results.tracks.map(track => (
                  <div 
                    key={track.id} 
                    className="track-result-card"
                    onClick={() => onTrackSelect && onTrackSelect(track)}
                  >
                    <div className="track-image">
                      <img src={track.image} alt={track.title} />
                      <div className="play-overlay">
                        <span className="play-icon">▶</span>
                      </div>
                    </div>
                    <div className="track-info">
                      <h4 className="track-title">{track.title}</h4>
                      <p className="track-artist">{track.artist}</p>
                      <div className="track-meta">
                        <span className="genre-badge">{track.genre}</span>
                        <span className="duration">{track.duration}</span>
                      </div>
                      <div className="track-stats">
                        <span>▶ {formatNumber(track.plays)}</span>
                        <span>❤️ {formatNumber(track.likes)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artists Section */}
          {(activeTab === 'all' || activeTab === 'artists') && results.artists.length > 0 && (
            <div className="result-section">
              {activeTab === 'all' && <h3 className="section-title">Artists</h3>}
              <div className="artists-grid">
                {results.artists.map(artist => (
                  <div key={artist._id} className="artist-result-card">
                    <div className="artist-avatar-large">
                      {artist.username.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="artist-name">{artist.username}</h4>
                    <p className="artist-followers">
                      {formatNumber(artist.followers?.length || 0)} followers
                    </p>
                    <button 
                      className={`follow-btn-sm ${followStatus[artist._id] ? 'following' : ''}`}
                      onClick={() => handleFollowToggle(artist._id)}
                      disabled={followingLoading[artist._id]}
                    >
                      {followingLoading[artist._id] ? '...' : followStatus[artist._id] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playlists Section */}
          {(activeTab === 'all' || activeTab === 'playlists') && results.playlists.length > 0 && (
            <div className="result-section">
              {activeTab === 'all' && <h3 className="section-title">Playlists</h3>}
              <div className="playlists-grid">
                {results.playlists.map(playlist => (
                  <div key={playlist._id} className="playlist-result-card">
                    <div className="playlist-cover">
                      <span className="playlist-icon">🎵</span>
                      <div className="playlist-overlay">
                        <span className="track-count">{playlist.tracks?.length || 0} tracks</span>
                      </div>
                    </div>
                    <div className="playlist-info">
                      <h4 className="playlist-title">{playlist.title}</h4>
                      <p className="playlist-creator">by {playlist.owner?.username}</p>
                      {playlist.description && (
                        <p className="playlist-desc">{playlist.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Section */}
          {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
            <div className="result-section">
              {activeTab === 'all' && <h3 className="section-title">Users</h3>}
              <div className="users-list">
                {results.users.map(user => (
                  <div key={user._id} className="user-result-item">
                    <div className="user-avatar">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                      <h4 className="user-name">{user.username}</h4>
                      <p className="user-email">{user.email}</p>
                    </div>
                    <button 
                      className={`follow-btn ${followStatus[user._id] ? 'following' : ''}`}
                      onClick={() => handleFollowToggle(user._id)}
                      disabled={followingLoading[user._id]}
                    >
                      {followingLoading[user._id] ? '...' : followStatus[user._id] ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {getTotalResults() === 0 && !error && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No results found</h3>
              <p>We couldn't find anything matching "{query}"</p>
              <div className="search-tips">
                <h4>Search Tips:</h4>
                <ul>
                  <li>Check your spelling</li>
                  <li>Try more general keywords</li>
                  <li>Try different keywords</li>
                  <li>Use artist names or track titles</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Trending Searches */}
        {trending.length > 0 && (
          <div className="trending-searches">
            <h4>🔥 Trending Searches</h4>
            <div className="trending-list">
              {trending.map((term, idx) => (
                <span key={idx} className="trending-tag">{term}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchResults;
