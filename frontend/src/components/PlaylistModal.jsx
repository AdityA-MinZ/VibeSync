import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toggleLike } from '../services/socialService';
import LikeButton from './LikeButton';
import './PlaylistModal.css';

function PlaylistModal({ playlist, onClose }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackLikes, setTrackLikes] = useState({});
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComment, setLoadingComment] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const tracksRef = useRef(null);
  const playerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const progressIntervalRef = useRef(null);

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
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!currentTrack) return;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextTrack();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevTrack();
          break;
        case 'KeyM':
          e.preventDefault();
          handleMuteToggle();
          break;
        case 'KeyR':
          e.preventDefault();
          handleRepeatToggle();
          break;
        case 'KeyS':
          e.preventDefault();
          handleShuffleToggle();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTrack, handlePlayPause, handleNextTrack, handlePrevTrack, handleMuteToggle, handleRepeatToggle, handleShuffleToggle]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTrackSource = useCallback((track) => {
    if (track.youtubeUrl || track.youtubeId) return 'youtube';
    return null;
  }, []);

  const getYoutubeVideoId = useCallback((url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }, []);

  const openYouTubeExternal = (track) => {
    const videoId = getYoutubeVideoId(track.youtubeUrl) || track.youtubeId;
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    } else {
      alert('No YouTube video found for this track');
    }
  };

  const getTrackDuration = (track) => {
    return track.duration_ms || track.duration || 0;
  };

  const handlePlayTrack = useCallback(async (track, index) => {
    console.log('Playing track:', track);
    setCurrentTrack({ ...track, index });
    setCurrentTime(0);
    setDuration(0);
    
    const source = getTrackSource(track);
    console.log('Track source:', source);
    
    if (source === 'youtube') {
      console.log('Playing YouTube track');
      if (ytPlayerRef.current) {
        const videoId = getYoutubeVideoId(track.youtubeUrl) || track.youtubeId;
        if (videoId) {
          console.log('Loading YouTube video:', videoId);
          ytPlayerRef.current.loadVideoById(videoId);
          setIsPlaying(true); // Will be updated by YouTube state change
        } else {
          console.error('No YouTube video ID found');
          alert('No YouTube video found for this track');
        }
      } else {
        console.log('YouTube player not ready yet');
        // Player will load the video when ready
      }
    } else {
      console.log('Track cannot be played directly:', track);
      alert('This track cannot be played directly. Try importing from YouTube.');
    }
  }, [getTrackSource, getYoutubeVideoId]);

  const handleNextTrack = useCallback(async () => {
    if (!currentTrack || !playlist?.tracks) return;
    
    let nextIndex;
    if (isShuffle) {
      // Random track (but not the current one)
      do {
        nextIndex = Math.floor(Math.random() * playlist.tracks.length);
      } while (nextIndex === currentTrack.index && playlist.tracks.length > 1);
    } else {
      // Next track or loop to beginning
      nextIndex = (currentTrack.index + 1) % playlist.tracks.length;
      // If we're at the end and not repeating, stop playback
      if (nextIndex === 0 && !isRepeat) {
        setIsPlaying(false);
        setCurrentTrack(null);
        return;
      }
    }
    
    setPlaylistIndex(nextIndex);
    handlePlayTrack(playlist.tracks[nextIndex], nextIndex);
  }, [currentTrack, playlist, handlePlayTrack, isShuffle, isRepeat]);

  const handlePrevTrack = useCallback(async () => {
    if (!currentTrack || !playlist?.tracks) return;
    
    const prevIndex = currentTrack.index === 0 ? playlist.tracks.length - 1 : currentTrack.index - 1;
    setPlaylistIndex(prevIndex);
    handlePlayTrack(playlist.tracks[prevIndex], prevIndex);
  }, [currentTrack, playlist, handlePlayTrack]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(newVolume * 100);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (ytPlayerRef.current) {
      if (isMuted) {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
      } else {
        ytPlayerRef.current.mute();
      }
    }
  };

  const handleRepeatToggle = () => {
    setIsRepeat(!isRepeat);
  };

  const handleShuffleToggle = () => {
    setIsShuffle(!isShuffle);
  };

  const handlePlayPause = () => {
    if (!currentTrack) return;
    
    const source = getTrackSource(currentTrack);
    if (source === 'youtube' && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e) => {
    if (!ytPlayerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * duration;
    ytPlayerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);
  };

  const onYouTubeReady = useCallback((event) => {
    console.log('YouTube player ready');
    ytPlayerRef.current = event.target;
    
    // Set initial volume
    ytPlayerRef.current.setVolume(volume * 100);
    if (isMuted) {
      ytPlayerRef.current.mute();
    }
    
    // Auto-play current track if it's a YouTube track
    if (currentTrack && getTrackSource(currentTrack) === 'youtube') {
      const videoId = getYoutubeVideoId(currentTrack.youtubeUrl) || currentTrack.youtubeId;
      if (videoId) {
        console.log('Loading YouTube video:', videoId);
        ytPlayerRef.current.loadVideoById(videoId);
      }
    }
  }, [currentTrack, getTrackSource, getYoutubeVideoId, volume, isMuted]);

  const onYouTubeStateChange = useCallback((event) => {
    console.log('YouTube player state changed:', event.data);
    
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      const dur = ytPlayerRef.current.getDuration();
      setDuration(dur);
      
      // Start progress tracking
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      progressIntervalRef.current = setInterval(() => {
        if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
          const currentTime = ytPlayerRef.current.getCurrentTime();
          setCurrentTime(currentTime);
        }
      },1000);
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } else if (event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      // Auto-play next track
      handleNextTrack();
    } else if (event.data === window.YT.PlayerState.BUFFERING) {
      console.log('YouTube video buffering...');
    }
  }, [handleNextTrack]);

  const onYouTubeError = useCallback((event) => {
    console.error('YouTube player error:', event.data);
    let errorMessage = 'Failed to load YouTube video';
    
    switch (event.data) {
      case 2:
        errorMessage = 'Invalid YouTube video ID';
        break;
      case 5:
        errorMessage = 'YouTube video not supported in HTML5 player';
        break;
      case 100:
        errorMessage = 'YouTube video not found or removed';
        break;
      case 101:
      case 150:
        errorMessage = 'YouTube video embedding not allowed';
        break;
      default:
        errorMessage = `Unknown YouTube error (${event.data})`;
        break;
    }
    
    alert(errorMessage);
  }, []);

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube IFrame API ready');
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '200',
        width: '100%',
        playerVars: {
          autoplay: 0,
          controls: 1, // Show controls for better UX
          disablekb: 0, // Allow keyboard controls
          fs: 0, // Disable fullscreen button
          iv_load_policy: 3, // Hide annotations
          modestbranding: 1, // Minimal branding
          rel: 0, // Hide related videos
          showinfo: 0, // Hide video info
        },
        events: {
          onReady: onYouTubeReady,
          onStateChange: onYouTubeStateChange,
          onError: onYouTubeError,
        },
      });
    };

    return () => {
      // Cleanup YouTube player
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [onYouTubeReady, onYouTubeStateChange, onYouTubeError]);

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
            {currentTrack && (
              <div className="keyboard-shortcuts-hint">
                <small>💡 Keyboard shortcuts: Space (play/pause) | ←→ (prev/next) | M (mute) | R (repeat) | S (shuffle) | ↑↓ (volume)</small>
              </div>
            )}
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
                  {getTrackSource(track) === 'youtube' ? (
                    <button 
                      className="track-source-btn youtube"
                      onClick={(e) => { e.stopPropagation(); openYouTubeExternal(track); }}
                    >
                      YouTube
                    </button>
                  ) : (
                    <span className="track-source">No Source</span>
                  )}
                  <span className="track-time">{formatTime(getTrackDuration(track) / 1000)}</span>
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

          {comments && (
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
          )}

        </div>

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
              <button 
                className={`control-btn ${isShuffle ? 'active' : ''}`}
                onClick={handleShuffleToggle}
                title="Shuffle"
              >
                🔀
              </button>
              <button onClick={handlePrevTrack} title="Previous">⏮</button>
              <button className="play-pause-btn" onClick={handlePlayPause} title="Play/Pause">
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button onClick={handleNextTrack} title="Next">⏭</button>
              <button 
                className={`control-btn ${isRepeat ? 'active' : ''}`}
                onClick={handleRepeatToggle}
                title="Repeat"
              >
                🔁
              </button>
            </div>
            <div className="player-progress">
              <span className="player-time">{formatTime(currentTime)}</span>
              <div className="progress-bar" onClick={handleSeek}>
                <div 
                  className="progress-fill" 
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="player-time">{formatTime(duration)}</span>
            </div>
            <div className="player-volume">
              <button onClick={handleMuteToggle} title="Mute/Unmute">
                {isMuted ? '🔇' : '🔊'}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                title="Volume"
              />
            </div>
            {getTrackSource(currentTrack) === 'youtube' && (
              <div className="player-yt-badge">YouTube</div>
            )}
          </div>
        )}

        {currentTrack && getTrackSource(currentTrack) === 'youtube' && (
          <div className="youtube-embed-container">
            <div id="youtube-player"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistModal;
