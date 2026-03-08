import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toggleLike, followUser, unfollowUser, checkFollowStatus } from '../services/socialService';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import LikeButton from './LikeButton';
import './PlaylistModal.css';

function PlaylistModal({ playlist, onClose, onViewProfile, currentUserId }) {
  const { 
    currentTrack, 
    isPlaying,
    playTrack,
    playNext,
    playPrev,
    togglePlayPause,
    currentTime,
    duration
  } = useMusicPlayer();
  
  const [trackLikes, setTrackLikes] = useState({});
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [loadingComment, setLoadingComment] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const ownerId = playlist.owner?._id || playlist.owner;
  const isOwnPlaylist = currentUserId && ownerId && (currentUserId === ownerId || currentUserId === ownerId.toString());

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (ownerId && !isOwnPlaylist) {
        try {
          const { isFollowing } = await checkFollowStatus(ownerId);
          setIsFollowing(isFollowing);
        } catch (err) {
          console.error('Check follow status error:', err);
        }
      }
    };
    checkFollowStatus();
  }, [ownerId, isOwnPlaylist]);

  const handleFollowToggle = async () => {
    if (!ownerId || isOwnPlaylist) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(ownerId);
        setIsFollowing(false);
      } else {
        await followUser(ownerId);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile && playlist.owner?.username) {
      onViewProfile(playlist.owner.username);
    }
  };

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
    playTrack(track, playlist?.tracks, index);
  }, [playTrack, playlist]);

  const handleNextTrack = useCallback(async () => {
    playNext();
  }, [playNext]);

  const handlePrevTrack = useCallback(async () => {
    playPrev();
  }, [playPrev]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleRepeatToggle = useCallback(() => {
    setIsRepeat(prev => !prev);
  }, []);

  const handleShuffleToggle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const handlePlayPause = useCallback(() => {
    togglePlayPause();
  }, [togglePlayPause]);

  const handleSeek = (e) => {
    // Seeking handled by MiniPlayer
  };

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
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentTrack, handlePlayPause, handleNextTrack, handlePrevTrack, handleMuteToggle, handleRepeatToggle, handleShuffleToggle]);

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
            <p className="playlist-modal-owner">
              By <span 
                className="owner-username" 
                onClick={handleViewProfile}
                style={{ cursor: 'pointer', color: 'var(--color-accent)' }}
              >
                {playlist.owner?.username || 'Unknown'}
              </span>
              {!isOwnPlaylist && ownerId && (
                <button 
                  className="follow-owner-btn"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </p>
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
            <ul className="modal-tracks-list">
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
      </div>
    </div>
  );
}

export default PlaylistModal;
