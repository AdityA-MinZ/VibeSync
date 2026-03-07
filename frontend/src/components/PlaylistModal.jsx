import React, { useState, useEffect, useRef } from 'react';
import { toggleLike } from '../services/socialService';
import { getSpotifyStatus } from '../services/spotifyService';
import LikeButton from './LikeButton';
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
    if (!spotifyConnected) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'VibeSync Web Player',
        getOAuthToken: cb => {
          const token = localStorage.getItem('spotifyToken');
          if (token) cb(token);
        },
        volume: 0.5
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify Player Ready with Device ID:', device_id);
        setSpotifyDeviceId(device_id);
        playerReadyRef.current = true;
      });

      player.addListener('player_state_changed', state => {
        if (!state) return;
        setIsPlaying(!state.paused);
        
        if (state.position === 0 && state.duration > 0 && !state.paused) {
          handleNextTrack();
        }
      });

      player.connect();
      setSpotifyPlayer(player);
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

  const handlePlayTrack = async (track, index) => {
    setCurrentTrack({ ...track, index });
    
    if (isSpotifyTrack(track)) {
      await playSpotifyTrack(track);
    } else {
      setIsPlaying(true);
    }
  };

  const handleNextTrack = async () => {
    if (!currentTrack || !playlist?.tracks) return;
    const nextIndex = (currentTrack.index + 1) % playlist.tracks.length;
    const nextTrack = playlist.tracks[nextIndex];
    setCurrentTrack({ ...nextTrack, index: nextIndex });
    
    if (isSpotifyTrack(nextTrack)) {
      await playSpotifyTrack(nextTrack);
    } else {
      setIsPlaying(true);
    }
  };

  const handlePrevTrack = async () => {
    if (!currentTrack || !playlist?.tracks) return;
    const prevIndex = currentTrack.index === 0 ? playlist.tracks.length - 1 : currentTrack.index - 1;
    const prevTrack = playlist.tracks[prevIndex];
    setCurrentTrack({ ...prevTrack, index: prevIndex });
    
    if (isSpotifyTrack(prevTrack)) {
      await playSpotifyTrack(prevTrack);
    } else {
      setIsPlaying(true);
    }
  };

  const isSpotifyTrack = (track) => {
    return track.spotifyUri || (track.id && track.id.length === 22 && /^[a-zA-Z0-9]+$/.test(track.id));
  };

  const playSpotifyTrack = async (track) => {
    if (!spotifyPlayer || !spotifyDeviceId || !playerReadyRef.current) {
      alert('Spotify is not connected or player is not ready. Please connect Spotify in Settings.');
      return;
    }

    const spotifyToken = localStorage.getItem('spotifyToken');
    if (!spotifyToken) {
      alert('Please reconnect Spotify in Settings to play this track.');
      return;
    }

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${spotifyDeviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [track.spotifyUri || `spotify:track:${track.id}`]
        })
      });
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing Spotify track:', error);
      alert('Failed to play track on Spotify. Please try again.');
    }
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
                    {track.album?.images?.[0]?.url || track.image ? (
                      <img src={track.album?.images?.[0]?.url || track.image} alt="" />
                    ) : (
                      <div className="track-placeholder">🎵</div>
                    )}
                    <div className="track-play-overlay">▶</div>
                  </div>
                  <div className="track-details">
                    <span className="track-title">{track.name || track.title}</span>
                    <span className="track-artist">
                      {track.artists?.map(a => a.name).join(', ') || track.artist || 'Unknown Artist'}
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
                  ) : null}
                  <span className="track-time">{formatDuration(track.duration_ms || track.duration)}</span>
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
                src={currentTrack.album?.images?.[2]?.url || currentTrack.image || 'https://picsum.photos/50/50'} 
                alt="" 
                className="player-track-img"
              />
              <div>
                <div className="player-track-name">{currentTrack.name || currentTrack.title}</div>
                <div className="player-track-artist">
                  {currentTrack.artists?.map(a => a.name).join(', ') || currentTrack.artist}
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
              <span>{formatDuration(currentTrack.duration_ms || currentTrack.duration)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistModal;
