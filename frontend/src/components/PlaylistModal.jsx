import React, { useState, useEffect, useRef } from 'react';
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
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayTrack = async (track, index) => {
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
  };

  const handlePrevTrack = async () => {
    if (!currentTrack || !playlist?.tracks) return;
    const prevIndex = currentTrack.index === 0 ? playlist.tracks.length - 1 : currentTrack.index - 1;
    handlePlayTrack(playlist.tracks[prevIndex], prevIndex);
  };

  const handleNextTrack = async () => {
    if (!currentTrack || !playlist?.tracks) return;
    const nextIndex = (currentTrack.index + 1) % playlist.tracks.length;
    handlePlayTrack(playlist.tracks[nextIndex], nextIndex);
  };

  const getTrackSource = (track) => {
    if (track.youtubeUrl || track.youtubeId) return 'youtube';
    return null;
  };

  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
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

  const onYouTubeReady = (event) => {
    console.log('YouTube player ready');
    ytPlayerRef.current = event.target;
    
    // Auto-play current track if it's a YouTube track
    if (currentTrack && getTrackSource(currentTrack) === 'youtube') {
      const videoId = getYoutubeVideoId(currentTrack.youtubeUrl) || currentTrack.youtubeId;
      if (videoId) {
        console.log('Loading YouTube video:', videoId);
        ytPlayerRef.current.loadVideoById(videoId);
      }
    }
  };

  const onYouTubeStateChange = (event) => {
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
      }, 1000);
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
  };

  const onYouTubeError = (event) => {
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
    }
    
    alert(errorMessage);
  };

  const openYouTubeExternal = (track) => {
    const url = track.youtubeUrl || `https://www.youtube.com/watch?v=${track.youtubeId}`;
    window.open(url, '_blank');
  };

  const getTrackDuration = (track) => {
    return track.durationMs || track.duration_ms || track.duration || 0;
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
              <span className="player-time">{formatTime(currentTime)}</span>
              <div className="progress-bar" onClick={handleSeek}>
                <div 
                  className="progress-fill" 
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
              </div>
              <span className="player-time">{formatTime(duration)}</span>
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
