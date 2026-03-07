import React, { useState, useEffect, useRef } from 'react';
import { toggleLike } from '../services/socialService';
import { getSpotifyStatus } from '../services/spotifyService';
import LikeButton from './LikeButton';
import API_URL from '../config';
import './PlaylistModal.css';

function PlaylistModal({ playlist, onClose }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackLikes, setTrackLikes] = useState({});
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComment, setLoadingComment] = useState(false);
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  const [spotifyDeviceId, setSpotifyDeviceId] = useState(null);
  const tracksRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const playerReadyRef = useRef(false);

  useEffect(() => {
    if (playlist?.tracks) {
      const initialLikes = {};
      playlist.tracks.forEach((track, idx) => {
        initialLikes[idx] = { liked: false, count: track.likes || 0 };
      });
      setTrackLikes(initialLikes);
      setComments(playlist.comments || []);
    }
  }, [playlist]);

  useEffect(() => {
    const checkSpotifyConnection = async () => {
      try {
        const status = await getSpotifyStatus();
        setSpotifyConnected(status.connected);
      } catch (error) {
        console.error('Failed to check Spotify status:', error);
      }
    };
    checkSpotifyConnection();
  }, []);

  useEffect(() => {
    console.log('Spotify player useEffect - spotifyConnected:', spotifyConnected);
    if (!spotifyConnected) {
      console.log('Spotify not connected, skipping player initialization');
      return;
    }

    console.log('Initializing Spotify Web Playback SDK...');
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = async () => {
      console.log('Spotify Web Playback SDK ready');
      try {
        // Get fresh Spotify access token from API
        const token = localStorage.getItem('token');
        console.log('Auth token for Spotify SDK:', !!token);
        if (!token) {
          console.error('No auth token found for Spotify SDK');
          return;
        }

        console.log('Fetching Spotify access token...');
        const response = await fetch(`${API_URL}/spotify/token`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Spotify token response status:', response.status);
        if (!response.ok) {
          throw new Error('Failed to get Spotify access token');
        }

        const { accessToken } = await response.json();
        console.log('Spotify access token received:', !!accessToken);

        if (!accessToken) {
          console.error('No Spotify access token available');
          return;
        }

        console.log('Creating Spotify Player...');
        const player = new window.Spotify.Player({
          name: 'VibeSync Web Player',
          getOAuthToken: cb => { 
            console.log('Providing OAuth token to Spotify player');
            cb(accessToken); 
          },
          volume: 0.5
        });

        player.addListener('ready', ({ device_id }) => {
          console.log('Spotify Player Ready with Device ID:', device_id);
          setSpotifyDeviceId(device_id);
          playerReadyRef.current = true;
        });

        player.addListener('initialization_error', ({ message }) => {
          console.error('Spotify Player initialization error:', message);
          alert('Spotify Player initialization failed. Please ensure you have Spotify Premium and try reconnecting.');
        });

        player.addListener('authentication_error', ({ message }) => {
          console.error('Spotify Player authentication error:', message);
          alert('Spotify authentication failed. Please reconnect Spotify in Settings.');
        });

        player.addListener('account_error', ({ message }) => {
          console.error('Spotify Player account error:', message);
          alert('Spotify Premium is required for playback. Please upgrade your Spotify account to Premium.');
        });

        player.addListener('player_state_changed', state => {
          if (!state) return;
          console.log('Spotify player state changed:', { paused: state.paused, position: state.position, duration: state.duration });
          setIsPlaying(!state.paused);
          
          if (state.position === 0 && state.duration > 0 && !state.paused) {
            handleNextTrack();
          }
        });

        console.log('Connecting Spotify player...');
        const connected = player.connect();
        console.log('Spotify player connect result:', connected);
        
        setSpotifyPlayer(player);
      } catch (error) {
        console.error('Error initializing Spotify player:', error);
        alert('Failed to initialize Spotify player. Please ensure you have Spotify Premium and try reconnecting.');
      }
    };

    return () => {
      if (spotifyPlayer) {
        spotifyPlayer.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyConnected]);

  const formatDuration = (ms) => {
    if (!ms) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const getTrackDuration = (track) => {
    return track.durationMs || track.duration_ms || track.duration || 0;
  };

  const handlePlayTrack = async (track, index) => {
    console.log('Playing track:', track);
    setCurrentTrack({ ...track, index });
    
    const source = getTrackSource(track);
    console.log('Track source:', source);
    
    if (source === 'spotify') {
      await playSpotifyTrack(track);
    } else if (source === 'youtube') {
      setIsPlaying(true);
    } else {
      alert('This track cannot be played directly. Try importing from YouTube or Spotify.');
    }
  };

  const playSpotifyTrack = async (track) => {
    console.log('playSpotifyTrack called');
    console.log('spotifyPlayer exists:', !!spotifyPlayer);
    console.log('spotifyDeviceId:', spotifyDeviceId);
    console.log('playerReadyRef.current:', playerReadyRef.current);
    
    if (!spotifyPlayer || !spotifyDeviceId || !playerReadyRef.current) {
      console.log('Spotify player not ready - showing alert');
      alert('Spotify is not connected or player is not ready. Please connect Spotify in Settings.');
      return;
    }

    try {
      console.log('Getting fresh Spotify access token for playback...');
      // Get fresh Spotify access token from API
      const token = localStorage.getItem('token');
      console.log('Auth token for playback:', !!token);
      if (!token) {
        alert('Please log in to play Spotify tracks.');
        return;
      }

      const response = await fetch(`${API_URL}/spotify/token`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Spotify token response status for playback:', response.status);
      if (!response.ok) {
        throw new Error('Failed to get Spotify access token');
      }

      const { accessToken } = await response.json();
      console.log('Spotify access token for playback:', !!accessToken);

      if (!accessToken) {
        alert('Please reconnect Spotify in Settings to play this track.');
        return;
      }

      const trackUri = track.spotifyUri || `spotify:track:${track.trackId || track.id}`;
      console.log('Playing track URI:', trackUri);
      console.log('Using device ID:', spotifyDeviceId);

      const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [trackUri]
        })
      });

      console.log('Spotify play response status:', playResponse.status);
      
      if (!playResponse.ok) {
        const errorData = await playResponse.text();
        console.error('Spotify play error:', errorData);
        
        if (playResponse.status === 401) {
          alert('Spotify authentication expired. Please reconnect Spotify in Settings.');
        } else if (playResponse.status === 403) {
          alert('Spotify Premium is required for playback. Please upgrade your Spotify account.');
        } else {
          alert(`Failed to play track: ${errorData}`);
        }
        return;
      }

      console.log('Track play request successful');
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing Spotify track:', error);
      if (error.message.includes('Premium')) {
        alert('Spotify Premium is required for playback. Please upgrade your Spotify account.');
      } else {
        alert('Failed to play track on Spotify. Please try again.');
      }
    }
  };

  const handleNextTrack = async () => {
    if (!currentTrack || !playlist?.tracks) return;
    const nextIndex = (currentTrack.index + 1) % playlist.tracks.length;
    handlePlayTrack(playlist.tracks[nextIndex], nextIndex);
  };

  const handlePrevTrack = async () => {
    if (!currentTrack || !playlist?.tracks) return;
    const prevIndex = currentTrack.index === 0 ? playlist.tracks.length - 1 : currentTrack.index - 1;
    handlePlayTrack(playlist.tracks[prevIndex], prevIndex);
  };

  const isSpotifyTrack = (track) => {
    const hasSpotifyUri = track.spotifyUri || (track.spotifyUri && track.spotifyUri.startsWith('spotify:'));
    const hasLongId = track.trackId && track.trackId.length === 22 && /^[a-zA-Z0-9]+$/.test(track.trackId);
    return hasSpotifyUri || hasLongId || track.source === 'spotify';
  };

  const handlePlayPause = async () => {
    if (!currentTrack) return;

    if (isSpotifyTrack(currentTrack)) {
      if (spotifyPlayer) {
        await spotifyPlayer.togglePlay();
      }
    } else if (youtubePlayerRef.current) {
      const command = isPlaying ? 'pauseVideo' : 'playVideo';
      youtubePlayerRef.current.contentWindow.postMessage(
        `{"event":"command","func":"${command}","args":""}`,
        '*'
      );
      setIsPlaying(!isPlaying);
    }
  };

  const getTrackSource = (track) => {
    if (isSpotifyTrack(track)) return 'spotify';
    if (track.youtubeUrl || track.youtubeId) return 'youtube';
    return null;
  };

  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const openYouTubeExternal = (track) => {
    const url = track.youtubeUrl || `https://www.youtube.com/watch?v=${track.youtubeId}`;
    window.open(url, '_blank');
  };

  const handleTrackLike = async (trackIdx) => {
    const trackId = playlist.tracks[trackIdx].id || `track-${trackIdx}`;
    try {
      const result = await toggleLike('track', trackId);
      setTrackLikes(prev => ({
        ...prev,
        [trackIdx]: { liked: result.liked, count: result.count }
      }));
    } catch (error) {
      console.error('Failed to like track:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setLoadingComment(true);
    try {
      const newComment = {
        text: commentText,
        user: { username: 'You' },
        createdAt: new Date().toISOString()
      };
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setLoadingComment(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/playlist/${playlist._id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: playlist.title,
          text: `Check out ${playlist.title} on VibeSync!`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (!playlist) return null;

  return (
    <div className="playlist-modal-overlay" onClick={onClose}>
      <div className="playlist-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        
        <div className="playlist-modal-header">
          <img 
            src={playlist.coverImage || `https://picsum.photos/400/400?random=${playlist._id}`}
            alt={playlist.title}
            className="playlist-modal-cover"
          />
          <div className="playlist-modal-info">
            <h2>{playlist.title}</h2>
            <p className="playlist-modal-owner">By {playlist.owner?.username || 'Unknown'}</p>
            {playlist.description && (
              <p className="playlist-modal-description">{playlist.description}</p>
            )}
            <div className="playlist-modal-stats">
              <span>{playlist.tracks?.length || 0} tracks</span>
              <span>{playlist.likes || 0} likes</span>
            </div>
            <div className="playlist-modal-actions">
              <LikeButton
                targetType="playlist"
                targetId={playlist._id || playlist.id}
                initialCount={playlist.likes || 0}
                showCount={true}
                size="medium"
              />
              <button className="play-all-btn" onClick={() => playlist.tracks?.length && handlePlayTrack(playlist.tracks[0], 0)}>
                ▶ Play All
              </button>
              <button className="share-btn" onClick={handleShare}>
                🔗 Share
              </button>
            </div>
          </div>
        </div>

        <div className="playlist-modal-content">
          <div className="tracks-section">
            <h3>Tracks</h3>
            <ul className="modal-tracks-list" ref={tracksRef}>
              {playlist.tracks?.map((track, idx) => (
                <li 
                  key={track.id || idx} 
                  className={`modal-track-item ${currentTrack?.index === idx ? 'active' : ''}`}
                  onClick={() => handlePlayTrack(track, idx)}
                >
                  <span className="track-num">{idx + 1}</span>
                  <div className="track-img">
                    {track.image || track.album?.images?.[0]?.url ? (
                      <img src={track.image || track.album?.images?.[0]?.url} alt="" />
                    ) : (
                      <div className="track-placeholder">🎵</div>
                    )}
                    <div className="track-play-overlay">▶</div>
                  </div>
                  <div className="track-details">
                    <span className="track-title">{track.title || track.name || track.title}</span>
                    <span className="track-artist">
                      {track.artist || (track.artists && track.artists.map(a => a.name).join(', ')) || 'Unknown Artist'}
                    </span>
                  </div>
                  {getTrackSource(track) === 'spotify' ? (
                    <span className="track-source spotify">Spotify</span>
                  ) : getTrackSource(track) === 'youtube' ? (
                    <button 
                      className="track-source-btn youtube"
                      onClick={(e) => { e.stopPropagation(); openYouTubeExternal(track); }}
                    >
                      YouTube
                    </button>
                  ) : (
                    <span className="track-source">No Source</span>
                  )}
                  <span className="track-time">{formatDuration(getTrackDuration(track))}</span>
                  <button 
                    className={`track-like-btn ${trackLikes[idx]?.liked ? 'liked' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleTrackLike(idx); }}
                  >
                    {trackLikes[idx]?.liked ? '❤️' : '🤍'}
                    <span className="like-count">{trackLikes[idx]?.count || 0}</span>
                  </button>
                </li>
              ))}
              {(!playlist.tracks || playlist.tracks.length === 0) && (
                <li className="no-tracks">No tracks in this playlist</li>
              )}
            </ul>
          </div>

          <div className="comments-section">
            <h3>Comments</h3>
            <div className="comment-input-wrapper">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button onClick={handleAddComment} disabled={loadingComment}>Post</button>
            </div>
            <ul className="comments-list">
              {comments.map((comment, idx) => (
                <li key={idx} className="comment-item">
                  <div className="comment-avatar">
                    {comment.user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="comment-content">
                    <span className="comment-user">{comment.user?.username || 'User'}</span>
                    <span className="comment-text">{comment.text}</span>
                    <span className="comment-time">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
              {comments.length === 0 && (
                <li className="no-comments">No comments yet. Be the first!</li>
              )}
            </ul>
          </div>
        </div>

        {currentTrack && getTrackSource(currentTrack) === 'youtube' && (
          <div className="youtube-player-section">
            <div className="youtube-player-container">
              {getYoutubeVideoId(currentTrack.youtubeUrl) ? (
                <iframe
                  ref={youtubePlayerRef}
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(currentTrack.youtubeUrl)}?enablejsapi=1&autoplay=1&playsinline=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="youtube-fallback">
                  <p>Unable to embed YouTube video</p>
                  <button onClick={() => openYouTubeExternal(currentTrack)}>
                    Open in YouTube
                  </button>
                </div>
              )}
            </div>
            <button className="youtube-external-btn" onClick={() => openYouTubeExternal(currentTrack)}>
              Open in YouTube ↗
            </button>
          </div>
        )}

        {currentTrack && (
          <div className="music-player-bar">
            <div className="player-track-info">
              <img 
                src={currentTrack.image || currentTrack.album?.images?.[2]?.url || 'https://picsum.photos/50/50'} 
                alt="" 
                className="player-track-img"
              />
              <div>
                <div className="player-track-name">{currentTrack.title || currentTrack.name}</div>
                <div className="player-track-artist">
                  {currentTrack.artist || (currentTrack.artists && currentTrack.artists.map(a => a.name).join(', '))}
                </div>
              </div>
            </div>
            <div className="player-controls">
              <button onClick={handlePrevTrack}>⏮</button>
              <button className="play-pause-btn" onClick={handlePlayPause}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button onClick={handleNextTrack}>⏭</button>
            </div>
            <div className="player-progress">
              <span>0:00</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '0%' }}></div>
              </div>
              <span>{formatDuration(getTrackDuration(currentTrack))}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistModal;
