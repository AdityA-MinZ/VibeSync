import React from 'react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import './MiniPlayer.css';

function MiniPlayer() {
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration,
    togglePlayPause, 
    playNext, 
    playPrev,
    seekTo 
  } = useMusicPlayer();

  if (!currentTrack) return null;

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * duration;
    seekTo(seekTime);
  };

  return (
    <div className="mini-player">
      <div className="mini-player-content">
        <div className="mini-player-track-info">
          <img 
            src={currentTrack.image || 'https://picsum.photos/50/50'} 
            alt="" 
            className="mini-player-track-img"
          />
          <div className="mini-player-track-details">
            <div className="mini-player-track-name">{currentTrack.title}</div>
            <div className="mini-player-track-artist">{currentTrack.artist || 'Unknown Artist'}</div>
          </div>
        </div>

        <div className="mini-player-controls">
          <button className="mini-player-btn" onClick={playPrev} title="Previous">⏮</button>
          <button className="mini-player-btn mini-player-play-btn" onClick={togglePlayPause}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="mini-player-btn" onClick={playNext} title="Next">⏭</button>
        </div>

        <div className="mini-player-progress-section">
          <span className="mini-player-time">{formatTime(currentTime)}</span>
          <div className="mini-player-progress-bar" onClick={handleSeek}>
            <div 
              className="mini-player-progress-fill" 
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="mini-player-time">{formatTime(duration)}</span>
        </div>

        <div className="mini-player-source-badge">
          {currentTrack.youtubeUrl || currentTrack.youtubeId ? (
            <span className="source-youtube">YouTube</span>
          ) : (
            <span className="source-uploaded">🎵</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default MiniPlayer;
