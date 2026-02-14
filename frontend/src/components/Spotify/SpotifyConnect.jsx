import React, { useState, useEffect } from 'react';
import { 
  getSpotifyStatus, 
  disconnectSpotify, 
  getSpotifyLoginUrl 
} from '../../services/spotifyService';
import './SpotifyConnect.css';

function SpotifyConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkSpotifyStatus();
    
    // Check for Spotify callback in URL
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyStatus = urlParams.get('spotify');
    
    if (spotifyStatus === 'success') {
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh status
      checkSpotifyStatus();
    } else if (spotifyStatus === 'error') {
      const message = urlParams.get('message');
      setError(`Spotify connection failed: ${message || 'Unknown error'}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkSpotifyStatus = async () => {
    try {
      setLoading(true);
      const status = await getSpotifyStatus();
      setIsConnected(status.connected);
      setError(null);
    } catch (err) {
      console.error('Error checking Spotify status:', err);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const { authUrl } = await getSpotifyLoginUrl();
      // Redirect to Spotify OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error getting Spotify auth URL:', err);
      setError('Failed to initiate Spotify connection');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await disconnectSpotify();
      setIsConnected(false);
      setError(null);
    } catch (err) {
      console.error('Error disconnecting Spotify:', err);
      setError('Failed to disconnect Spotify');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="spotify-connect loading">
        <div className="spotify-spinner"></div>
        <p>Checking Spotify connection...</p>
      </div>
    );
  }

  return (
    <div className="spotify-connect">
      <div className="spotify-header">
        <div className="spotify-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <div className="spotify-info">
          <h3>Spotify Integration</h3>
          <p className="spotify-status">
            {isConnected ? (
              <span className="connected">
                <span className="status-dot"></span>
                Connected to Spotify
              </span>
            ) : (
              <span className="disconnected">Not connected</span>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="spotify-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="spotify-features">
        <h4>What you can do:</h4>
        <ul>
          <li>🔍 Search millions of songs on Spotify</li>
          <li>📀 Access your Spotify playlists</li>
          <li>🎵 Get personalized recommendations</li>
          <li>📊 View your listening stats</li>
          <li>🎧 Import your Spotify library</li>
        </ul>
      </div>

      <div className="spotify-actions">
        {isConnected ? (
          <button 
            className="spotify-btn disconnect"
            onClick={handleDisconnect}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
            Disconnect Spotify
          </button>
        ) : (
          <button 
            className="spotify-btn connect"
            onClick={handleConnect}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connect with Spotify
          </button>
        )}
      </div>
    </div>
  );
}

export default SpotifyConnect;
