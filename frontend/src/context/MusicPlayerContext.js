import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import API_URL from '../config';

const MusicPlayerContext = createContext(null);

const getFullUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}${relativePath}`;
};

export function MusicPlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const ytPlayerRef = useRef(null);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const playerRef = useRef(null);

  const playNextRef = useRef(null);
  const handleYouTubeStateChangeRef = useRef(null);
  const initYouTubePlayerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const loadYouTubeApi = useCallback(() => {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };
    });
  }, []);

  const getTrackSource = useCallback((track) => {
    if (track.youtubeUrl || track.youtubeId) return 'youtube';
    if (track.audioUrl || track.sourceUrl || track.source === 'upload') return 'uploaded';
    return null;
  }, []);

  const getYoutubeVideoId = useCallback((url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  }, []);

  const getAudioUrl = useCallback((track) => {
    const relativeUrl = track.audioUrl || track.sourceUrl || null;
    if (!relativeUrl) return null;
    return getFullUrl(relativeUrl);
  }, []);

  const handleYouTubeStateChange = useCallback((event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      const dur = ytPlayerRef.current?.getDuration();
      setDuration(dur || 0);
      
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        if (ytPlayerRef.current?.getCurrentTime) {
          setCurrentTime(ytPlayerRef.current.getCurrentTime());
        }
      }, 1000);
    } else if (event.data === window.YT.PlayerState.PAUSED) {
      setIsPlaying(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    } else if (event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      if (playNextRef.current) {
        playNextRef.current();
      }
    }
  }, []);

  const initYouTubePlayer = useCallback(() => {
    if (playerRef.current) return;
    
    loadYouTubeApi().then(() => {
      playerRef.current = new window.YT.Player('youtube-player-hidden', {
        height: '0',
        width: '0',
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          onReady: (event) => {
            ytPlayerRef.current = event.target;
          },
          onStateChange: handleYouTubeStateChange,
        },
      });
    });
  }, [loadYouTubeApi, handleYouTubeStateChange]);

  const playNext = useCallback(() => {
    if (!playlist || !currentTrack) return;
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentIndex(nextIndex);
    const nextTrack = playlist[nextIndex];
    setCurrentTrack({ ...nextTrack, index: nextIndex });
    setCurrentTime(0);
    setDuration(0);
    
    const source = getTrackSource(nextTrack);
    if (source === 'youtube') {
      initYouTubePlayer();
      setTimeout(() => {
        if (ytPlayerRef.current) {
          const videoId = getYoutubeVideoId(nextTrack.youtubeUrl) || nextTrack.youtubeId;
          if (videoId) {
            ytPlayerRef.current.loadVideoById(videoId);
            setIsPlaying(true);
          }
        }
      }, 500);
    } else if (source === 'uploaded') {
      const audioUrl = getAudioUrl(nextTrack);
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error('Audio play error:', err));
        
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
          }
        }, 1000);
      }
    }
  }, [playlist, currentTrack, currentIndex, getTrackSource, getYoutubeVideoId, getAudioUrl, initYouTubePlayer]);

  handleYouTubeStateChangeRef.current = handleYouTubeStateChange;
  playNextRef.current = playNext;
  initYouTubePlayerRef.current = initYouTubePlayer;

  const playTrack = useCallback((track, playlistData = null, index = 0) => {
    if (!track) return;
    
    setCurrentTrack({ ...track, index });
    setCurrentTime(0);
    setDuration(0);
    
    if (playlistData) {
      setPlaylist(playlistData);
      setCurrentIndex(index);
    }

    const source = getTrackSource(track);

    if (source === 'youtube') {
      initYouTubePlayer();
      setTimeout(() => {
        if (ytPlayerRef.current) {
          const videoId = getYoutubeVideoId(track.youtubeUrl) || track.youtubeId;
          if (videoId) {
            ytPlayerRef.current.loadVideoById(videoId);
            setIsPlaying(true);
          }
        }
      }, 500);
    } else if (source === 'uploaded') {
      const audioUrl = getAudioUrl(track);
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error('Audio play error:', err));
        
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
          }
        }, 1000);
      }
    }
  }, [getTrackSource, getYoutubeVideoId, getAudioUrl, initYouTubePlayer]);

  const togglePlayPause = useCallback(() => {
    const source = currentTrack ? getTrackSource(currentTrack) : null;
    
    if (source === 'youtube' && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
      } else {
        ytPlayerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    } else if (source === 'uploaded' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [currentTrack, isPlaying, getTrackSource]);

  const playPrev = useCallback(() => {
    if (!playlist || !currentTrack) return;
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    playTrack(playlist[prevIndex], playlist, prevIndex);
  }, [playlist, currentIndex, currentTrack, playTrack]);

  const seekTo = useCallback((time) => {
    const source = currentTrack ? getTrackSource(currentTrack) : null;
    
    if (source === 'youtube' && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(time, true);
      setCurrentTime(time);
    } else if (source === 'uploaded' && audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [currentTrack, getTrackSource]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      if (playNextRef.current) {
        playNextRef.current();
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const value = {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playlist,
    currentIndex,
    playTrack,
    togglePlayPause,
    playNext,
    playPrev,
    seekTo,
    audioRef,
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="metadata" />
      <div id="youtube-player-hidden" style={{ display: 'none' }}></div>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}

export default MusicPlayerContext;
