// frontend/src/components/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import FriendsPage from "./FriendsPage";
import SearchResults from "./SearchResults";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import SaveToBoard from "./SaveToBoard";
import EditProfileModal from "./EditProfileModal";
import { getUserProfile, getUserPlaylists, getUserStats, getUserActivity, updateUserProfile } from "../services/userService";

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
  const [trackTitle, setTrackTitle] = useState("");
  const [trackGenre, setTrackGenre] = useState("");
  const [trackMood, setTrackMood] = useState("");
  const [trackDescription, setTrackDescription] = useState("");
  const [trackTags, setTrackTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [visibility, setVisibility] = useState("public");
  const [isPlaying, setIsPlaying] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [profilePlaylists, setProfilePlaylists] = useState([]);
  const [profileActivity, setProfileActivity] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handlePublish = () => {
    const playlistData = {
      title: trackTitle,
      genre: trackGenre,
      mood: trackMood,
      description: trackDescription,
      tags: trackTags,
      coverImage,
      audioFile: audioFile?.name,
      visibility,
    };
    console.log("Publishing playlist:", playlistData);
    alert("Playlist published successfully!");
  };

  const handleSaveDraft = () => {
    const playlistData = {
      title: trackTitle,
      genre: trackGenre,
      mood: trackMood,
      description: trackDescription,
      tags: trackTags,
      coverImage,
      audioFile: audioFile?.name,
      visibility,
    };
    console.log("Saving draft:", playlistData);
    alert("Draft saved!");
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

        {/* Create */}
        {currentPage === "create" && (
          <div className="page-content active">
            <div className="page-header">
              <h1 className="page-title">Create</h1>
              <p className="page-subtitle">Upload and share your music with the world</p>
            </div>
            
            <div className="create-layout">
              {/* Left Column - Form */}
              <div className="create-form-section">
                <div className="form-card">
                  <div className="form-section-header">
                    <span className="form-step">1</span>
                    <h3>Track Information</h3>
                  </div>
                  
                  <div className="form-group-modern">
                    <label className="form-label">
                      Track Title <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input-modern"
                      placeholder="Give your track a catchy name"
                      value={trackTitle}
                      onChange={(e) => setTrackTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group-modern">
                      <label className="form-label">Genre</label>
                      <input
                        type="text"
                        className="form-input-modern"
                        placeholder="Enter or select genre"
                        value={trackGenre}
                        onChange={(e) => setTrackGenre(e.target.value)}
                        list="genre-suggestions"
                      />
                      <datalist id="genre-suggestions">
                        <option value="electronic" />
                        <option value="pop" />
                        <option value="hiphop" />
                        <option value="rock" />
                        <option value="jazz" />
                        <option value="classical" />
                        <option value="rnb" />
                        <option value="folk" />
                        <option value="metal" />
                        <option value="country" />
                        <option value="reggae" />
                        <option value="soul" />
                        <option value="indie" />
                        <option value="alternative" />
                        <option value="dance" />
                        <option value="house" />
                        <option value="techno" />
                      </datalist>
                    </div>

                    <div className="form-group-modern">
                      <label className="form-label">Mood</label>
                      <select 
                        className="form-input-modern form-select"
                        value={trackMood}
                        onChange={(e) => setTrackMood(e.target.value)}
                      >
                        <option value="">Select mood</option>
                        <option value="happy">Happy</option>
                        <option value="sad">Sad</option>
                        <option value="energetic">Energetic</option>
                        <option value="chill">Chill</option>
                        <option value="romantic">Romantic</option>
                        <option value="angry">Angry</option>
                        <option value="melancholic">Melancholic</option>
                        <option value="dreamy">Dreamy</option>
                        <option value="uplifting">Uplifting</option>
                        <option value="dark">Dark</option>
                        <option value="nostalgic">Nostalgic</option>
                        <option value="intense">Intense</option>
                        <option value="peaceful">Peaceful</option>
                        <option value="aggressive">Aggressive</option>
                        <option value="mysterious">Mysterious</option>
                        <option value="groovy">Groovy</option>
                        <option value="bittersweet">Bittersweet</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-input-modern form-textarea"
                      placeholder="Tell the story behind your track..."
                      rows={4}
                      value={trackDescription}
                      onChange={(e) => setTrackDescription(e.target.value)}
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
                    <div className="tags-help">Add up to 5 tags to help people discover your music</div>
                  </div>
                </div>

                <div className="form-card">
                  <div className="form-section-header">
                    <span className="form-step">2</span>
                    <h3>Upload Files</h3>
                  </div>

                  {/* Audio Upload */}
                  <div className="upload-zone">
                    <div className="upload-icon">🎵</div>
                    <h4>Upload Audio File</h4>
                    <p className="upload-hint">Drag & drop your audio file here or click to browse</p>
                    <p className="upload-formats">Supported: MP3, WAV, FLAC (max 50MB)</p>
                    {audioFile ? (
                      <div className="file-selected">{audioFile.name}</div>
                    ) : (
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="file-input"
                        id="audio-upload"
                      />
                    )}
                    <label htmlFor="audio-upload" className="upload-btn">
                      {audioFile ? "Change File" : "Choose File"}
                    </label>
                  </div>

                  {/* Cover Art Upload */}
                  <div className="upload-zone upload-zone-small">
                    <div className="upload-preview">
                      {coverImage ? (
                        <img src={coverImage} alt="Cover" className="cover-preview-img" />
                      ) : (
                        <span className="upload-placeholder">🖼️</span>
                      )}
                    </div>
                    <div className="upload-info">
                      <h4>Cover Art</h4>
                      <p className="upload-hint">Recommended: 1400x1400px</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="file-input"
                        id="cover-upload"
                      />
                      <label htmlFor="cover-upload" className="upload-btn-secondary">
                        {coverImage ? "Change Image" : "Upload Image"}
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-card">
                  <div className="form-section-header">
                    <span className="form-step">3</span>
                    <h3>Visibility</h3>
                  </div>
                  
                  <div className="visibility-options">
                    <label className="visibility-option">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="public" 
                        checked={visibility === "public"}
                        onChange={(e) => setVisibility(e.target.value)}
                      />
                      <div className="visibility-content">
                        <span className="visibility-icon">🌍</span>
                        <div>
                          <div className="visibility-title">Public</div>
                          <div className="visibility-desc">Everyone can see and listen to your track</div>
                        </div>
                      </div>
                    </label>
                    <label className="visibility-option">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="friends"
                        checked={visibility === "friends"}
                        onChange={(e) => setVisibility(e.target.value)}
                      />
                      <div className="visibility-content">
                        <span className="visibility-icon">👥</span>
                        <div>
                          <div className="visibility-title">Friends Only</div>
                          <div className="visibility-desc">Only your friends can see this track</div>
                        </div>
                      </div>
                    </label>
                    <label className="visibility-option">
                      <input 
                        type="radio" 
                        name="visibility" 
                        value="private"
                        checked={visibility === "private"}
                        onChange={(e) => setVisibility(e.target.value)}
                      />
                      <div className="visibility-content">
                        <span className="visibility-icon">🔒</span>
                        <div>
                          <div className="visibility-title">Private</div>
                          <div className="visibility-desc">Only you can see this track</div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-save-draft" onClick={handleSaveDraft}>Save as Draft</button>
                  <button className="btn-publish" onClick={handlePublish}>Publish Track</button>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="create-preview-section">
                <div className="preview-card sticky">
                  <h3 className="preview-title">Preview</h3>
                  <div className="track-preview">
                    <div className="preview-cover">
                      {coverImage ? (
                        <img src={coverImage} alt="Cover" className="preview-cover-img" />
                      ) : (
                        <span className="preview-cover-placeholder">🎵</span>
                      )}
                    </div>
                    <div className="preview-info">
                      <h4 className="preview-track-title">
                        {trackTitle || "Your Track Title"}
                      </h4>
                      <p className="preview-track-artist">{user?.username || "adi"}</p>
                      {trackGenre && <span className="preview-genre">{trackGenre}</span>}
                    </div>
                  </div>
                  <div className="preview-waveform">
                    <div className="waveform-placeholder">
                      {[...Array(40)].map((_, i) => (
                        <div key={i} className="waveform-bar" style={{ height: `${Math.random() * 100}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="preview-actions">
                    <button 
                      className="preview-btn play-btn"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? "⏸" : "▶"}
                    </button>
                    <button className="preview-btn">❤️</button>
                    <button className="preview-btn">➕</button>
                    <span className="preview-duration">
                      {audioFile ? "3:45" : "--:--"}
                    </span>
                  </div>
                  {trackDescription && (
                    <div className="preview-description">
                      {trackDescription}
                    </div>
                  )}
                  {trackTags.length > 0 && (
                    <div className="preview-tags">
                      {trackTags.map((tag) => (
                        <span key={tag} className="preview-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          )}

        {/* Friends */}
        {currentPage === "friends" && (
          <FriendsPage user={user} sidebarExpanded={sidebarExpanded} />
        )}

        {/* Notifications */}
        {currentPage === "notifications" && (
          <div className="page-content active">
            <div className="page-header">
              <h1 className="page-title">Notifications</h1>
              <p className="page-subtitle">
                Stay updated with your music activity
              </p>
            </div>
            <div className="notifications-container">
              {[
                { icon: "❤️", text: "Luna Eclipse liked your playlist 'Electronic Dreams'", time: "2 hours ago", color: "#ec4899" },
                { icon: "🎵", text: "New track added to your playlist 'Electronic Mix'", time: "5 hours ago", color: "#06b6d4" },
                { icon: "👥", text: "Street Sound started following you", time: "1 day ago", color: "#f59e0b" },
                { icon: "💬", text: "MC Flow commented on your track 'Midnight Dreams'", time: "1 day ago", color: "#8b5cf6" },
                { icon: "▶️", text: "Your track reached 1,000 plays!", time: "2 days ago", color: "#10b981" },
                { icon: "🎁", text: "You received a gift from The Blue Notes", time: "3 days ago", color: "#f472b6" },
              ].map((notif, idx) => (
                <div key={idx} className="notification-item">
                  <div className="notification-icon" style={{ background: `linear-gradient(135deg, ${notif.color}, ${notif.color}88)` }}>
                    {notif.icon}
                  </div>
                  <div className="notification-content">
                    <div className="notification-text">{notif.text}</div>
                    <div className="notification-time">{notif.time}</div>
                  </div>
                </div>
              ))}
            </div>
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
