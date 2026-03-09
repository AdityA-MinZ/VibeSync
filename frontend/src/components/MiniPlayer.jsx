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
    seekTo,
    volume,
    isMuted,
    isRepeat,
    isShuffle,
    toggleMute,
    changeVolume,
    toggleShuffle,
    toggleRepeat
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

  const handleVolumeChange = (e) => {
    changeVolume(parseFloat(e.target.value));
  };

  return (
    <div className="mini-player">
      <div className="mini-player-content">
        <div className="mini-player-track-info">
          <img 
            src={currentTrack.image || `https://picsum.photos/seed/${currentTrack.id || currentTrack.title}/50/50`} 
            alt="" 
            className="mini-player-track-img"
          />
          <div className="mini-player-track-details">
            <div className="mini-player-track-name">{currentTrack.title}</div>
            <div className="mini-player-track-artist">{currentTrack.artist || 'Unknown Artist'}</div>
          </div>
        </div>

        <div className="mini-player-controls">
          <button 
            className={`mini-player-btn mini-player-shuffle-btn ${isShuffle ? 'active' : ''}`} 
            onClick={toggleShuffle}
            title="Shuffle"
          >
            🔀
          </button>
          <button className="mini-player-btn" onClick={playPrev} title="Previous">⏮</button>
          <button className="mini-player-btn mini-player-play-btn" onClick={togglePlayPause}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="mini-player-btn" onClick={playNext} title="Next">⏭</button>
          <button 
            className={`mini-player-btn mini-player-repeat-btn ${isRepeat ? 'active' : ''}`} 
            onClick={toggleRepeat}
            title="Repeat"
          >
            🔁
          </button>
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

        <div className="mini-player-volume">
          <button className="mini-player-btn mini-player-mute-btn" onClick={toggleMute} title="Mute/Unmute">
            {isMuted ? '🔇' : '🔊'}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="mini-player-volume-slider"
            title="Volume"
          />
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
