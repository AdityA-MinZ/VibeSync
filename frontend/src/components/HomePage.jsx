// frontend/src/components/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import FriendsPage from "./FriendsPage";
import SearchResults from "./SearchResults";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import SaveToBoard from "./SaveToBoard";
import EditProfileModal from "./EditProfileModal";
import { getUserProfile, getUserPlaylists, getUserStats, getUserActivity, updateUserProfile, importSpotifyPlaylist, importYouTubePlaylist, searchTracks, createPlaylist } from "../services/userService";
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from "../services/notificationService";

const musicData = [
  {
    id: 1,
    title: "Midnight Dreams",
    artist: "Luna Eclipse",
    genre: "electronic",
    image: "https://picsum.photos/400/500?random=1",
    likes: 1234,
    plays: 45678,
    comments: 89,
    description:
      "An ambient electronic journey through the night. Perfect for late-night coding sessions or deep contemplation.",
  },
  {
    id: 2,
    title: "Summer Vibes",
    artist: "The Waves",
    genre: "pop",
    image: "https://picsum.photos/400/600?random=2",
    likes: 2341,
    plays: 78901,
    comments: 156,
    description:
      "Feel-good summer anthem that'll make you want to dance all day long.",
  },
  {
    id: 3,
    title: "Urban Beats",
    artist: "Street Sound",
    genre: "hiphop",
    image: "https://picsum.photos/400/450?random=3",
    likes: 3456,
    plays: 123456,
    comments: 234,
    description:
      "Hard-hitting hip hop track with powerful lyrics and infectious rhythm.",
  },
  {
    id: 4,
    title: "Jazz at Midnight",
    artist: "The Blue Notes",
    genre: "jazz",
    image: "https://picsum.photos/400/550?random=4",
    likes: 987,
    plays: 34567,
    comments: 67,
    description:
      "Smooth jazz saxophone melodies perfect for a relaxing evening.",
  },
  {
    id: 5,
    title: "Electric Storm",
    artist: "Neon Knights",
    genre: "rock",
    image: "https://picsum.photos/400/480?random=5",
    likes: 4567,
    plays: 234567,
    comments: 345,
    description: "High-energy rock anthem with electrifying guitar solos.",
  },
  {
    id: 6,
    title: "Morning Coffee",
    artist: "Acoustic Soul",
    genre: "pop",
    image: "https://picsum.photos/400/520?random=6",
    likes: 2345,
    plays: 89012,
    comments: 123,
    description: "Gentle acoustic melodies to start your day right.",
  },
  {
    id: 7,
    title: "Synth Wave",
    artist: "Retro Future",
    genre: "electronic",
    image: "https://picsum.photos/400/580?random=7",
    likes: 5678,
    plays: 345678,
    comments: 456,
    description: "80s-inspired synthwave with modern production.",
  },
  {
    id: 8,
    title: "Classical Beauty",
    artist: "Orchestra Divine",
    genre: "classical",
    image: "https://picsum.photos/400/460?random=8",
    likes: 1567,
    plays: 56789,
    comments: 78,
    description: "Timeless classical composition that stirs the soul.",
  },
  {
    id: 9,
    title: "Bass Drop",
    artist: "DJ Thunder",
    genre: "electronic",
    image: "https://picsum.photos/400/540?random=9",
    likes: 6789,
    plays: 456789,
    comments: 567,
    description: "Massive bass drops and energetic EDM vibes.",
  },
  {
    id: 10,
    title: "Indie Dreams",
    artist: "The Wanderers",
    genre: "rock",
    image: "https://picsum.photos/400/490?random=10",
    likes: 3456,
    plays: 123456,
    comments: 234,
    description:
      "Indie rock with introspective lyrics and catchy hooks.",
  },
  {
    id: 11,
    title: "Hip Hop Nation",
    artist: "MC Flow",
    genre: "hiphop",
    image: "https://picsum.photos/400/530?random=11",
    likes: 7890,
    plays: 567890,
    comments: 678,
    description:
      "Conscious hip hop with meaningful message and great flow.",
  },
  {
    id: 12,
    title: "Piano Serenity",
    artist: "Grace Notes",
    genre: "classical",
    image: "https://picsum.photos/400/510?random=12",
    likes: 2345,
    plays: 89012,
    comments: 123,
    description:
      "Beautiful piano compositions for meditation and focus.",
  },
];

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function HomePage({ user }) {
  const [currentFilter, setCurrentFilter] = useState("electronic");
  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [modalTrack, setModalTrack] = useState(null);
  const [showSaveToBoard, setShowSaveToBoard] = useState(false);

  // Create page state
  const [importMode, setImportMode] = useState(null); // 'spotify', 'youtube', 'manual'
  const [importUrl, setImportUrl] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [playlistGenre, setPlaylistGenre] = useState("");
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [trackSearchQuery, setTrackSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [visibility, setVisibility] = useState("public");
  const [isPlaying, setIsPlaying] = useState(false);

  // Legacy track state (for backward compatibility)
  const [trackTitle, setTrackTitle] = useState("");
  const [trackTags, setTrackTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // Profile state
  const [profileData, setProfileData] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [profilePlaylists, setProfilePlaylists] = useState([]);
  const [profileActivity, setProfileActivity] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim() && trackTags.length < 5) {
      e.preventDefault();
      if (!trackTags.includes(tagInput.trim())) {
        setTrackTags([...trackTags, tagInput.trim()]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTrackTags(trackTags.filter((tag) => tag !== tagToRemove));
  };

  const handlePublish = () => {
    handleCreatePlaylist();
  };

  const handleSaveDraft = async () => {
    if (!playlistName.trim()) {
      alert('Please enter a playlist name');
      return;
    }

    try {
      const playlistData = {
        name: playlistName,
        description: playlistDescription,
        genre: playlistGenre,
        tags: trackTags,
        tracks: playlistTracks,
        visibility,
        isDraft: true,
      };
      
      await createPlaylist(playlistData);
      alert('Draft saved!');
      
      setImportMode(null);
      setPlaylistName('');
      setPlaylistDescription('');
      setPlaylistGenre('');
      setPlaylistTracks([]);
      setTrackTags([]);
    } catch (error) {
      console.error('Save draft error:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  // Create page handlers
  const handleImportFromSpotify = () => {
    setImportMode('spotify');
  };

  const handleImportFromYouTube = () => {
    setImportMode('youtube');
  };

  const handleCreateManual = () => {
    setImportMode('manual');
  };

  const handleImportSubmit = async () => {
    if (!importUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    try {
      let response;
      if (importMode === 'spotify') {
        response = await importSpotifyPlaylist(importUrl);
      } else if (importMode === 'youtube') {
        response = await importYouTubePlaylist(importUrl);
      }

      if (response) {
        setPlaylistName(response.name || 'Imported Playlist');
        setPlaylistDescription(response.description || '');
        setPlaylistTracks(response.tracks || []);
        setImportMode('manual');
        setImportUrl('');
        alert('Playlist imported successfully!');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import playlist. Please check the URL and try again.');
    }
  };

  const handleTrackSearch = async () => {
    if (!trackSearchQuery.trim()) return;

    try {
      const results = await searchTracks(trackSearchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleAddTrackToPlaylist = (track) => {
    if (!playlistTracks.find(t => t.id === track.id)) {
      setPlaylistTracks([...playlistTracks, track]);
    }
    setSearchResults([]);
    setTrackSearchQuery('');
  };

  const handleRemoveTrack = (index) => {
    setPlaylistTracks(playlistTracks.filter((_, i) => i !== index));
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      alert('Please enter a playlist name');
      return;
    }

    try {
      const playlistData = {
        name: playlistName,
        description: playlistDescription,
        genre: playlistGenre,
        tags: trackTags,
        tracks: playlistTracks,
        visibility,
      };
      
      await createPlaylist(playlistData);
      alert('Playlist created successfully!');
      
      // Reset form
      setImportMode(null);
      setPlaylistName('');
      setPlaylistDescription('');
      setPlaylistGenre('');
      setPlaylistTracks([]);
      setTrackTags([]);
    } catch (error) {
      console.error('Create playlist error:', error);
      alert('Failed to create playlist. Please try again.');
    }
  };

  const filteredData = useMemo(() => {
    const base =
      searchTerm.trim().length > 0
        ? musicData.filter((t) => {
            const s = searchTerm.toLowerCase();
            return (
              t.title.toLowerCase().includes(s) ||
              t.artist.toLowerCase().includes(s) ||
              t.genre.toLowerCase().includes(s)
            );
          })
        : musicData.filter((t) => t.genre === currentFilter);
    return base;
  }, [currentFilter, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim().length >= 2) {
      setShowSearchResults(true);
    }
  };

  const closeSearchResults = () => {
    setShowSearchResults(false);
  };

  const handleTrackSelect = (track) => {
    setModalTrack(track);
    document.body.style.overflow = "hidden";
  };

  // Fetch unread notification count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const result = await getUnreadCount();
        setUnreadCount(result.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle Escape key to close search
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeSearchResults();
      }
    };

    if (showSearchResults) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showSearchResults]);

  // Fetch profile data when on profile page
  useEffect(() => {
    if (currentPage === "profile") {
      const fetchProfileData = async () => {
        try {
          const [profile, stats, playlists, activity] = await Promise.all([
            getUserProfile(),
            getUserStats(),
            getUserPlaylists(),
            getUserActivity()
          ]);
          setProfileData(profile);
          setProfileStats(stats);
          setProfilePlaylists(playlists);
          setProfileActivity(activity);
        } catch (error) {
          console.error('Error fetching profile data:', error);
        }
      };
      fetchProfileData();
    }
  }, [currentPage]);

  // Fetch notifications when on notifications page
  useEffect(() => {
    if (currentPage === "notifications") {
      const fetchNotifications = async () => {
        try {
          const result = await getNotifications({ limit: 50 });
          setNotifications(result.notifications || []);
          setUnreadCount(result.unreadCount || 0);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };
      fetchNotifications();
    }
  }, [currentPage]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id);
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👥';
      case 'playlist_share': return '🎵';
      case 'track_added': return '🎧';
      case 'achievement': return '🏆';
      case 'friend_request': return '🤝';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like': return '#ec4899';
      case 'comment': return '#8b5cf6';
      case 'follow': return '#06b6d4';
      case 'playlist_share': return '#7c3aed';
      case 'track_added': return '#f59e0b';
      case 'achievement': return '#10b981';
      case 'friend_request': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const openModal = (track) => {
    setModalTrack(track);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setModalTrack(null);
    document.body.style.overflow = "auto";
  };

  return (
    <>
      {/* Search bar - only show on home page */}
      {currentPage === "home" && (
      <form
        onSubmit={handleSearch}
        className="search-container"
        style={{
          marginLeft: sidebarExpanded ? 280 : 80,
          transition: "margin-left 0.3s ease",
        }}
      >
        <input
          type="text"
          className="search-bar"
          placeholder="Search for songs, artists, playlists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm.trim().length >= 2 && (
          <button type="submit" className="search-submit-btn">
            🔍
          </button>
        )}
        {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
          <p className="search-hint">Type at least 2 characters to search</p>
        )}
      </form>
      )}

      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((s) => !s)}
        unreadCount={unreadCount}
      />

      {/* Main container */}
      <div
        className={`masonry-container ${
          sidebarExpanded ? "sidebar-expanded" : ""
        }`}
      >
        {/* Home feed */}
        {currentPage === "home" && (
          <div className="page-content active">
            <div className="playlist-grid">
              {filteredData.map((track) => (
                <div
                  key={track.id}
                  className="playlist-card"
                  onClick={() => openModal(track)}
                >
                    <div className="playlist-card-image">
                      <img src={track.image} alt={track.title} />
                      <div className="genre-badge">{track.genre}</div>
                      <div className="play-overlay">
                        <div className="play-icon">▶</div>
                      </div>
                    </div>
                    <div className="playlist-card-content">
                      <h3 className="playlist-card-title">{track.title}</h3>
                      <p className="playlist-card-artist">{track.artist}</p>
                      <div className="playlist-card-stats">
                        <span className="stat">
                          <span className="stat-icon">👍</span>
                          {formatNumber(track.likes)}
                        </span>
                        <span className="stat">
                          <span className="stat-icon">▶</span>
                          {formatNumber(track.plays)}
                        </span>
                      </div>
                    </div>
                    <div className="playlist-card-actions">
                      <LikeButton
                        targetType="track"
                        targetId={track.id.toString()}
                        initialCount={track.likes}
                        showCount={true}
                        size="small"
                      />
                      <button
                        className="action-btn view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(track);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Profile */}
        {currentPage === "profile" && (
          <div className="page-content active">
            <div className="page-header">
              <h1 className="page-title">Profile</h1>
              <p className="page-subtitle">
                Manage your account and view your music journey
              </p>
            </div>
            
            {/* Profile Hero Card */}
            <div className="profile-hero-card">
              <div className="profile-cover-image" />
              <div className="profile-info-section">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar-large">
                    {(profileData?.username || user?.username || "A").charAt(0).toUpperCase()}
                  </div>
                  <button className="edit-avatar-btn" title="Change photo" onClick={() => setIsEditingProfile(true)}>
                    📷
                  </button>
                </div>
                <div className="profile-details">
                  <h2 className="profile-name">{profileData?.username || user?.username || "User"}</h2>
                  <p className="profile-handle">@{(profileData?.username || user?.username || "user").toLowerCase()}</p>
                  <p className="profile-bio">{profileData?.bio || "Music lover 🎵 | Creating vibes"}</p>
                  <div className="profile-meta">
                    <span className="meta-item">📅 Joined {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently"}</span>
                    {profileData?.location && <span className="meta-item">📍 {profileData.location}</span>}
                    {profileData?.website && <span className="meta-item">🔗 {profileData.website}</span>}
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="btn-primary" onClick={() => setIsEditingProfile(true)}>Edit Profile</button>
                  <button className="action-btn">Share Profile</button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper">🎵</div>
                <div className="stat-info">
                  <div className="stat-number">{profileStats?.playlistsCount || 0}</div>
                  <div className="stat-label">Playlists</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">👥</div>
                <div className="stat-info">
                  <div className="stat-number">{profileStats?.followersCount || 0}</div>
                  <div className="stat-label">Followers</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">🎧</div>
                <div className="stat-info">
                  <div className="stat-number">{Math.round((profileStats?.totalListeningTime || 0) / 60)}</div>
                  <div className="stat-label">Hours Listened</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrapper">🔥</div>
                <div className="stat-info">
                  <div className="stat-number">{profileStats?.currentStreak || 0}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="section-card">
              <div className="section-header">
                <h3>Recent Activity</h3>
                <button className="view-all-btn">View All</button>
              </div>
              <div className="activity-list">
                {profileActivity.length > 0 ? (
                  profileActivity.map((activity, idx) => (
                    <div key={idx} className="activity-item">
                      <div className="activity-icon" style={{ background: activity.color }}>
                        {activity.icon}
                      </div>
                      <div className="activity-content">
                        <p className="activity-text">{activity.text}</p>
                        <span className="activity-time">{activity.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-activity">No recent activity yet. Start creating playlists!</p>
                )}
              </div>
            </div>

            {/* Your Playlists */}
            <div className="section-card">
              <div className="section-header">
                <h3>Your Playlists</h3>
                <button className="view-all-btn">See All</button>
              </div>
              <div className="playlist-mini-grid">
                {profilePlaylists.length > 0 ? (
                  profilePlaylists.map((playlist, idx) => (
                    <div key={playlist._id || idx} className="playlist-mini-card" style={{ background: `linear-gradient(135deg, #7c3aed22, #7c3aed11)` }}>
                      <div className="playlist-mini-cover" style={{ background: '#7c3aed' }}>
                        🎵
                      </div>
                      <div className="playlist-mini-info">
                        <h4>{playlist.name || playlist.title}</h4>
                        <span>{playlist.tracks?.length || 0} tracks</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-playlists">No playlists yet. Create your first playlist!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Friends */}
        {currentPage === "friends" && (
          <FriendsPage user={user} sidebarExpanded={sidebarExpanded} />
        )}

        {/* Create */}
        {currentPage === "create" && (
          <div className="page-content active">
            <div className="page-header">
              <h1 className="page-title">Create Playlist</h1>
              <p className="page-subtitle">Import from Spotify or YouTube, or create your own</p>
            </div>
            
            <div className="create-options">
              {/* Import from Spotify */}
              <div className="create-option-card" onClick={() => handleImportFromSpotify()}>
                <div className="option-icon" style={{ background: '#1DB954' }}>🎵</div>
                <h3>Import from Spotify</h3>
                <p>Enter a Spotify playlist URL to import</p>
              </div>

              {/* Import from YouTube */}
              <div className="create-option-card" onClick={() => handleImportFromYouTube()}>
                <div className="option-icon" style={{ background: '#FF0000' }}>▶️</div>
                <h3>Import from YouTube</h3>
                <p>Enter a YouTube playlist URL to import</p>
              </div>

              {/* Create Manually */}
              <div className="create-option-card" onClick={() => handleCreateManual()}>
                <div className="option-icon" style={{ background: '#7c3aed' }}>✨</div>
                <h3>Create Manually</h3>
                <p>Build your own playlist from scratch</p>
              </div>
            </div>

            {/* Import Form (shown when importing) */}
            {(importMode === 'spotify' || importMode === 'youtube') && (
              <div className="import-form">
                <h3>Import from {importMode === 'spotify' ? 'Spotify' : 'YouTube'}</h3>
                <div className="form-group-modern">
                  <input
                    type="text"
                    className="form-input-modern"
                    placeholder={importMode === 'spotify' ? 'Paste Spotify playlist URL...' : 'Paste YouTube playlist URL...'}
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                  />
                </div>
                <button className="btn-primary" onClick={handleImportSubmit}>
                  Import Playlist
                </button>
                <button className="btn-secondary" onClick={() => setImportMode(null)}>
                  Cancel
                </button>
              </div>
            )}

            {/* Manual Playlist Creation */}
            {importMode === 'manual' && (
              <div className="create-layout">
                <div className="create-form-section">
                  <div className="form-card">
                    <div className="form-section-header">
                      <h3>Playlist Details</h3>
                    </div>
                    
                    <div className="form-group-modern">
                      <label className="form-label">Playlist Name <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-input-modern"
                        placeholder="Give your playlist a name"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                      />
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-input-modern form-textarea"
                        placeholder="Describe your playlist..."
                        rows={3}
                        value={playlistDescription}
                        onChange={(e) => setPlaylistDescription(e.target.value)}
                      />
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label">Genre</label>
                      <input
                        type="text"
                        className="form-input-modern"
                        placeholder="e.g., Pop, Rock, Electronic"
                        value={playlistGenre}
                        onChange={(e) => setPlaylistGenre(e.target.value)}
                      />
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label">Tags</label>
                      <div className="tags-input">
                        <input
                          type="text"
                          className="form-input-modern"
                          placeholder="Add tags (press Enter)"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                        />
                      </div>
                      {trackTags.length > 0 && (
                        <div className="tags-list">
                          {trackTags.map((tag) => (
                            <span key={tag} className="tag-item">
                              {tag}
                              <button type="button" onClick={() => handleRemoveTag(tag)} className="tag-remove">×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-card">
                    <div className="form-section-header">
                      <h3>Search & Add Tracks</h3>
                    </div>
                    <div className="track-search-box">
                      <input
                        type="text"
                        className="form-input-modern"
                        placeholder="Search for tracks to add..."
                        value={trackSearchQuery}
                        onChange={(e) => setTrackSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTrackSearch()}
                      />
                      <button className="search-btn" onClick={handleTrackSearch}>🔍</button>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="search-results-list">
                        {searchResults.map((track) => (
                          <div key={track.id} className="search-result-item" onClick={() => handleAddTrackToPlaylist(track)}>
                            <img src={track.image} alt="" className="result-thumb" />
                            <div className="result-info">
                              <div className="result-title">{track.title}</div>
                              <div className="result-artist">{track.artist}</div>
                            </div>
                            <button className="add-btn">+</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Tracks */}
                  {playlistTracks.length > 0 && (
                    <div className="form-card">
                      <div className="form-section-header">
                        <h3>Selected Tracks ({playlistTracks.length})</h3>
                      </div>
                      <div className="selected-tracks">
                        {playlistTracks.map((track, idx) => (
                          <div key={idx} className="selected-track-item">
                            <span className="track-number">{idx + 1}</span>
                            <img src={track.image} alt="" className="track-thumb" />
                            <div className="track-info">
                              <div className="track-title">{track.title}</div>
                              <div className="track-artist">{track.artist}</div>
                            </div>
                            <button className="remove-btn" onClick={() => handleRemoveTrack(idx)}>×</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-actions">
                    <button className="btn-save-draft" onClick={handleSaveDraft}>Save as Draft</button>
                    <button className="btn-publish" onClick={handlePublish}>Create Playlist</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {currentPage === "settings" && (
          <div className="page-content active">
            <div className="page-header">
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">
                Customize your VibeSync experience
              </p>
            </div>
            <div className="settings-layout">
              <div className="settings-nav">
                <button className="settings-nav-item active">Account</button>
                <button className="settings-nav-item">Notifications</button>
                <button className="settings-nav-item">Privacy</button>
                <button className="settings-nav-item">Audio Quality</button>
                <button className="settings-nav-item">Appearance</button>
                <button className="settings-nav-item">Connected Apps</button>
              </div>
              <div className="settings-content">
                <div className="settings-card">
                  <h3 className="settings-section-title">Profile Information</h3>
                  <div className="settings-form">
                    <div className="settings-form-group">
                      <label className="settings-label">Display Name</label>
                      <input type="text" className="settings-input" defaultValue={user?.username || "adi"} />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">Email</label>
                      <input type="email" className="settings-input" defaultValue={user?.email || "adi@gmail.com"} />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">Bio</label>
                      <textarea className="settings-input" rows="3" placeholder="Tell us about yourself..."></textarea>
                    </div>
                    <button className="btn-save">Save Changes</button>
                  </div>
                </div>
                <div className="settings-card">
                  <h3 className="settings-section-title">Change Password</h3>
                  <div className="settings-form">
                    <div className="settings-form-group">
                      <label className="settings-label">Current Password</label>
                      <input type="password" className="settings-input" placeholder="Enter current password" />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">New Password</label>
                      <input type="password" className="settings-input" placeholder="Enter new password" />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-label">Confirm New Password</label>
                      <input type="password" className="settings-input" placeholder="Confirm new password" />
                    </div>
                    <button className="btn-save">Update Password</button>
                  </div>
                </div>
                <div className="settings-card danger-zone">
                  <h3 className="settings-section-title">Danger Zone</h3>
                  <div className="danger-item">
                    <div>
                      <div className="danger-title">Delete Account</div>
                      <div className="danger-desc">Once you delete your account, there is no going back. Please be certain.</div>
                    </div>
                    <button className="btn-danger">Delete Account</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalTrack && (
        <div className="modal active" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>
              &times;
            </button>
            <img
              src={modalTrack.image}
              alt={modalTrack.title}
              className="modal-image"
            />
            <div className="modal-body">
              <h2 className="modal-title">{modalTrack.title}</h2>
              <p className="modal-artist">{modalTrack.artist}</p>
              <p className="modal-description">{modalTrack.description}</p>
              <div className="modal-actions">
                <button
                  className="modal-btn primary"
                  onClick={() =>
                    alert("Playing track... (hook to player here)")
                  }
                >
                  ▶ Play Now
                </button>
                <button
                  className="modal-btn secondary"
                  onClick={() => setShowSaveToBoard(true)}
                >
                  + Add to Playlist
                </button>
                <button
                  className="modal-btn secondary"
                  onClick={() => alert("Share (social sharing here)")}
                >
                  ⤴ Share
                </button>
              </div>
              <div
                className="card-stats"
                style={{ justifyContent: "center", gap: "2rem" }}
              >
                <div className="stat-item">
                  <LikeButton
                    targetType="track"
                    targetId={modalTrack.id.toString()}
                    initialCount={modalTrack.likes}
                    showCount={true}
                    size="medium"
                  />
                </div>
                <div className="stat-item">
                  <span>▶</span>
                  <span>{formatNumber(modalTrack.plays)}</span>
                </div>
                <div className="stat-item">
                  <span>💬</span>
                  <span>{formatNumber(modalTrack.comments)}</span>
                </div>
              </div>
              
              {/* Comments Section */}
              <CommentSection
                targetType="track"
                targetId={modalTrack.id.toString()}
                currentUser={user}
              />
            </div>
          </div>
        </div>
      )}

      {/* Search Results Overlay */}
      {showSearchResults && (
        <SearchResults
          query={searchTerm}
          onClose={closeSearchResults}
          onTrackSelect={handleTrackSelect}
        />
      )}

      {/* Save to Board Modal */}
      <SaveToBoard
        isOpen={showSaveToBoard}
        onClose={() => setShowSaveToBoard(false)}
        track={modalTrack}
        currentUser={user}
      />

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <EditProfileModal
          user={profileData || user}
          onClose={() => setIsEditingProfile(false)}
          onSave={async (updatedData) => {
            try {
              const updated = await updateUserProfile(updatedData);
              setProfileData(prev => ({ ...prev, ...updated }));
              setIsEditingProfile(false);
            } catch (error) {
              console.error('Error updating profile:', error);
              alert('Failed to update profile. Please try again.');
            }
          }}
        />
      )}
    </>
  );
}

export default HomePage;
