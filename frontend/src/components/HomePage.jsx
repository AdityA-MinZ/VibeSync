// frontend/src/components/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import FriendsPage from "./FriendsPage";
import SearchResults from "./SearchResults";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import SaveToBoard from "./SaveToBoard";
import EditProfileModal from "./EditProfileModal";
import PlaylistModal from "./PlaylistModal";
import ImageCropper from "./ImageCropper";
import MiniPlayer from "./MiniPlayer";
import { getUserProfile, getUserPlaylists, getUserStats, getUserActivity, updateUserProfile, updateStreak, importYouTubePlaylist, searchTracks, createPlaylist, deletePlaylist } from "../services/userService";
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from "../services/notificationService";
import API_URL from '../config';

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function HomePage({ user, onLogout }) {
  const [currentFilter, setCurrentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [modalTrack, setModalTrack] = useState(null);
  const [showSaveToBoard, setShowSaveToBoard] = useState(false);

  // Create page state
  const [importMode, setImportMode] = useState(null); // 'youtube', 'manual'
  const [importUrl, setImportUrl] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [playlistCoverImage, setPlaylistCoverImage] = useState("");
  const [playlistGenre, setPlaylistGenre] = useState("");
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [trackSearchQuery, setTrackSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [visibility, setVisibility] = useState("public");
  // eslint-disable-next-line no-unused-vars
  const [isPlaying, setIsPlaying] = useState(false);

  // Legacy track state (for backward compatibility)
  // eslint-disable-next-line no-unused-vars
  const [trackTitle, setTrackTitle] = useState("");
  const [trackTags, setTrackTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // Profile state
  const [profileData, setProfileData] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [profilePlaylists, setProfilePlaylists] = useState([]);
  const [profileActivity, setProfileActivity] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [userTopGenres, setUserTopGenres] = useState([]);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Settings state
  const [settingsSection, setSettingsSection] = useState('account');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    followRequests: true,
    newFollowers: true,
    playlistShares: true,
    trackLikes: true,
    comments: true,
    newMessages: true,
    systemUpdates: false
  });
  const [accountSettings, setAccountSettings] = useState({
    username: '',
    email: '',
    bio: '',
    location: ''
  });
  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [homePlaylists, setHomePlaylists] = useState([]);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleViewAllActivity = () => {
    // Navigate to a dedicated activity page or expand the current section
    alert('Full activity view coming soon!');
  };

  const handleViewAllPlaylists = () => {
    // Navigate to a dedicated playlists page or expand the current section
    alert('Full playlists view coming soon!');
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Create a preview URL and show cropper
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageToCrop(e.target.result);
      setShowImageCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedFile) => {
    setShowImageCropper(false);
    setImageToCrop(null);

    try {
      const formData = new FormData();
      formData.append('profileImage', croppedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/me/profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload profile picture');
      }

      const result = await response.json();
      
      // Update profile data with new image
      const imageUrl = result.profileImage.startsWith('http') ? result.profileImage : `${API_URL.replace('/api', '')}${result.profileImage}`;
      setProfileData(prev => ({
        ...prev,
        profileImage: imageUrl
      }));

      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    }
  };

  const handleCropCancel = () => {
    setShowImageCropper(false);
    setImageToCrop(null);
  };

  const handlePlaylistClick = (playlist) => {
    setSelectedPlaylist(playlist);
  };

  const handleClosePlaylistModal = () => {
    setSelectedPlaylist(null);
  };

  const handleDeletePlaylist = async (playlistId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;
    
    try {
      await deletePlaylist(playlistId);
      setHomePlaylists(homePlaylists.filter(p => p._id !== playlistId));
      setProfilePlaylists(profilePlaylists.filter(p => p._id !== playlistId));
      alert('Playlist deleted successfully');
    } catch (error) {
      console.error('Delete playlist error:', error);
      alert('Failed to delete playlist');
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/profile/${profileData?.username || user?.username}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profileData?.username || user?.username}'s Profile`,
          text: `Check out ${profileData?.username || user?.username}'s profile on VibeSync!`,
          url: profileUrl
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        alert('Profile link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing profile:', error);
      // Fallback: manually create a temporary input to copy
      const tempInput = document.createElement('input');
      tempInput.value = profileUrl;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      alert('Profile link copied to clipboard!');
    }
  };

  // Settings handlers
  const handleSettingsNavClick = (section) => {
    setSettingsSection(section);
    setSettingsMessage('');
  };

  const handleAccountSettingsChange = (field, value) => {
    setAccountSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationSettingsChange = (setting, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handlePasswordSettingsChange = (field, value) => {
    setPasswordSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveAccountSettings = async () => {
    setSettingsLoading(true);
    setSettingsMessage('');
    
    try {
      await updateUserProfile(accountSettings);
      setSettingsMessage('Account settings saved successfully!');
      
      // Update profile data
      setProfileData(prev => ({
        ...prev,
        ...accountSettings
      }));
    } catch (error) {
      console.error('Error saving account settings:', error);
      setSettingsMessage('Failed to save account settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setSettingsLoading(true);
    setSettingsMessage('');
    
    try {
      // Save notification preferences to backend
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/users/me/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationSettings)
      });
      
      setSettingsMessage('Notification preferences saved successfully!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setSettingsMessage('Failed to save notification settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordSettings;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSettingsMessage('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setSettingsMessage('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setSettingsMessage('Password must be at least 6 characters long');
      return;
    }
    
    setSettingsLoading(true);
    setSettingsMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (response.ok) {
        setSettingsMessage('Password changed successfully!');
        setPasswordSettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        setSettingsMessage(error.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setSettingsMessage('Failed to change password. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
    );
    
    if (!confirmDelete) return;
    
    const finalConfirm = window.confirm(
      'This is your last chance! Are you absolutely sure you want to delete your account?'
    );
    
    if (!finalConfirm) return;
    
    setSettingsLoading(true);
    setSettingsMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/me/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setSettingsMessage('Account deleted successfully. Redirecting...');
        setTimeout(() => {
          if (onLogout) onLogout();
          window.location.href = '/';
        }, 2000);
      } else {
        const error = await response.json();
        setSettingsMessage(error.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setSettingsMessage('Failed to delete account. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Load account settings when profile data is available
  useEffect(() => {
    if (profileData) {
      setAccountSettings({
        username: profileData.username || '',
        email: profileData.email || '',
        bio: profileData.bio || '',
        location: profileData.location || ''
      });
    }
  }, [profileData]);

  // Fetch home page playlists
  const fetchHomePlaylists = async () => {
    setHomeLoading(true);
    setHomeError(null);
    
    try {
      const [playlists, stats] = await Promise.all([
        getUserPlaylists(),
        getUserStats()
      ]);
      console.log('Playlists loaded:', playlists);
      console.log('Stats loaded:', stats);
      setHomePlaylists(playlists || []);
      setUserTopGenres(stats?.topGenres || []);
    } catch (error) {
      console.error('Error fetching home playlists:', error);
      console.error('Error response:', error.response?.data);
      setHomeError('Failed to load playlists. Please try again.');
    } finally {
      setHomeLoading(false);
    }
  };

  // Fetch playlists when on home page
  useEffect(() => {
    if (currentPage === "home") {
      fetchHomePlaylists();
    }
  }, [currentPage]);

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
      if (importMode === 'youtube') {
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

  const handlePlaylistCoverImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_URL}/upload/playlist-cover`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylistCoverImage(data.imageUrl);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Cover image upload error:', error);
      alert('Failed to upload cover image');
    }
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
        coverImage: playlistCoverImage,
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
      setPlaylistCoverImage('');
      setPlaylistGenre('');
      setPlaylistTracks([]);
      setTrackTags([]);
    } catch (error) {
      console.error('Create playlist error:', error);
      alert('Failed to create playlist. Please try again.');
    }
  };

  const filteredData = useMemo(() => {
  const base = homePlaylists;
  
  if (searchTerm.trim().length > 0) {
    const s = searchTerm.toLowerCase();
    return base.filter((playlist) => {
      return (
        playlist.title?.toLowerCase().includes(s) ||
        playlist.description?.toLowerCase().includes(s) ||
        playlist.owner?.username?.toLowerCase().includes(s)
      );
    });
  }
  
  if (currentFilter !== 'all') {
    return base.filter((playlist) => {
      // For playlists, we'll use a simple categorization based on title/description
      const playlistText = `${playlist.title || ''} ${playlist.description || ''}`.toLowerCase();
      switch (currentFilter) {
        case 'electronic':
          return playlistText.includes('electronic') || playlistText.includes('edm') || playlistText.includes('techno') || playlistText.includes('synth');
        case 'pop':
          return playlistText.includes('pop') || playlistText.includes('hits') || playlistText.includes('top') || playlistText.includes('summer');
        case 'rock':
          return playlistText.includes('rock') || playlistText.includes('alternative') || playlistText.includes('metal') || playlistText.includes('classics');
        case 'hiphop':
          return playlistText.includes('hip') || playlistText.includes('rap') || playlistText.includes('hop');
        case 'jazz':
          return playlistText.includes('jazz') || playlistText.includes('blues') || playlistText.includes('swing');
        case 'classical':
          return playlistText.includes('classical') || playlistText.includes('orchestra') || playlistText.includes('symphony');
        default:
          return true;
      }
    });
  }
  
  return base;
}, [homePlaylists, currentFilter, searchTerm]);

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
        setProfileLoading(true);
        setProfileError(null);
        
        try {
          // Update streak when visiting profile (once per day)
          const lastStreakUpdate = localStorage.getItem('lastStreakUpdate');
          const today = new Date().toDateString();
          if (lastStreakUpdate !== today) {
            try {
              await updateStreak();
              localStorage.setItem('lastStreakUpdate', today);
            } catch (streakError) {
              console.log('Streak update skipped:', streakError.message);
            }
          }

          const [profile, stats, playlists, activity] = await Promise.all([
            getUserProfile(),
            getUserStats(),
            getUserPlaylists(),
            getUserActivity()
          ]);
          console.log('Profile loaded:', profile);
          console.log('Stats loaded:', stats);
          console.log('Playlists loaded:', playlists);
          setProfileData(profile);
          setProfileStats(stats);
          setProfilePlaylists(playlists);
          setProfileActivity(activity);
        } catch (error) {
          console.error('Error fetching profile data:', error);
          console.error('Error response:', error.response?.data);
          setProfileError('Failed to load profile data. Please try again.');
        } finally {
          setProfileLoading(false);
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
      case 'comment': return '#9f14a9';
      case 'follow': return '#06b6d4';
      case 'playlist_share': return '#9f14a9';
      case 'track_added': return '#f59e0b';
      case 'achievement': return '#10b981';
      case 'friend_request': return '#3b82f6';
      default: return '#b8b4b3';
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

  // eslint-disable-next-line no-unused-vars
  const _openModal = (track) => {
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
        onLogout={onLogout}
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
            <div className="page-header">
              <h1 className="page-title">Discover Music</h1>
              <p className="page-subtitle">
                Explore playlists and discover new music
              </p>
            </div>
            {homeLoading && (
              <div className="loading-state">
                <div className="loading-spinner">Loading playlists...</div>
              </div>
            )}
            
            {homeError && (
              <div className="error-state">
                <div className="error-message">{homeError}</div>
                <button className="btn-primary" onClick={fetchHomePlaylists}>
                  Try Again
                </button>
              </div>
            )}
            
            {!homeLoading && !homeError && (
              <>
                {/* Filter Section */}
                <div className="filter-section">
                  <div className="filter-pills">
                    {userTopGenres.length > 0 ? (
                      <>
                        {userTopGenres.slice(0, 4).map((genre) => (
                          <button
                            key={genre}
                            className={`filter-pill ${currentFilter === genre.toLowerCase() ? 'active' : ''}`}
                            onClick={() => setCurrentFilter(genre.toLowerCase())}
                          >
                            {genre.charAt(0).toUpperCase() + genre.slice(1)}
                          </button>
                        ))}
                        <button
                          key="all"
                          className={`filter-pill ${currentFilter === 'all' ? 'active' : ''}`}
                          onClick={() => setCurrentFilter('all')}
                        >
                          All
                        </button>
                        {['electronic', 'pop', 'rock', 'hiphop', 'jazz', 'classical'].filter(g => !userTopGenres.slice(0, 4).map(g => g.toLowerCase()).includes(g)).slice(0, 3).map((genre) => (
                          <button
                            key={genre}
                            className={`filter-pill ${currentFilter === genre ? 'active' : ''}`}
                            onClick={() => setCurrentFilter(genre)}
                          >
                            {genre.charAt(0).toUpperCase() + genre.slice(1)}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {['all', 'electronic', 'pop', 'rock', 'hiphop', 'jazz', 'classical'].map((genre) => (
                          <button
                            key={genre}
                            className={`filter-pill ${currentFilter === genre ? 'active' : ''}`}
                            onClick={() => setCurrentFilter(genre)}
                          >
                            {genre.charAt(0).toUpperCase() + genre.slice(1)}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                
                {filteredData.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🎵</div>
                    <h3>No playlists found</h3>
                    <p>
                      {searchTerm.trim() 
                        ? 'No playlists match your search. Try different keywords.'
                        : 'No playlists yet. Create your first playlist to get started!'
                      }
                    </p>
                    {!searchTerm.trim() && (
                      <button className="btn-primary" onClick={() => setCurrentPage('create')}>
                        Create Playlist
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="playlist-grid">
                    {filteredData.map((playlist) => (
                      <div
                        key={playlist._id || playlist.id}
                        className="playlist-card"
                        onClick={() => handlePlaylistClick(playlist)}
                      >
                        <div className="playlist-card-image">
                          <img 
                            src={playlist.coverImage || `https://picsum.photos/400/500?random=${playlist._id || playlist.id}`} 
                            alt={playlist.title} 
                          />
                          <div className="genre-badge">
                            {playlist.tracks?.length || 0} tracks
                          </div>
                          <div className="play-overlay">
                            <div className="play-icon">▶</div>
                          </div>
                        </div>
                        <div className="playlist-card-content">
                          <h3 className="playlist-card-title">{playlist.title}</h3>
                          <p className="playlist-card-artist">
                            By {playlist.owner?.username || 'Unknown'}
                          </p>
                          {playlist.description && (
                            <p className="playlist-card-description">
                              {playlist.description.length > 100 
                                ? `${playlist.description.substring(0, 100)}...`
                                : playlist.description
                              }
                            </p>
                          )}
                          <div className="playlist-card-stats">
                            <span className="stat">
                              <span className="stat-icon">🎵</span>
                              {playlist.tracks?.length || 0}
                            </span>
                            <span className="stat">
                              <span className="stat-icon">❤️</span>
                              {playlist.likes || 0}
                            </span>
                            <span className="stat">
                              <span className="stat-icon">▶</span>
                              {playlist.plays || 0}
                            </span>
                          </div>
                        </div>
                        <div className="playlist-card-actions">
                          <LikeButton
                            targetType="playlist"
                            targetId={playlist._id || playlist.id}
                            initialCount={playlist.likes || 0}
                            showCount={true}
                            size="small"
                          />
                          <button
                            className="action-btn view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlaylistClick(playlist);
                            }}
                          >
                            View
                          </button>
                          {profileData?._id === playlist.owner?._id && (
                            <button
                              className="action-btn delete-btn"
                              onClick={(e) => handleDeletePlaylist(playlist._id, e)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
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
            
            {profileLoading && (
              <div className="loading-state">
                <div className="loading-spinner">Loading profile...</div>
              </div>
            )}
            
            {profileError && (
              <div className="error-state">
                <div className="error-message">{profileError}</div>
                <button className="btn-primary" onClick={() => window.location.reload()}>
                  Try Again
                </button>
              </div>
            )}
            
            {!profileLoading && !profileError && (
              <>
                {/* Profile Hero Card */}
                <div className="profile-hero-card">
              <div className="profile-info-section">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar-large">
                    {profileData?.profileImage ? (
                      <img 
                        src={profileData.profileImage.startsWith('http') ? profileData.profileImage : `${API_URL.replace('/api', '')}${profileData.profileImage}`}
                        alt="Profile" 
                        className="profile-avatar-img"
                      />
                    ) : (
                      (profileData?.username || user?.username || "A").charAt(0).toUpperCase()
                    )}
                  </div>
                  <input
                    type="file"
                    id="profile-image-upload"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleProfilePictureUpload}
                  />
                  <button 
                    className="edit-avatar-btn" 
                    title="Change photo" 
                    onClick={() => document.getElementById('profile-image-upload').click()}
                  >
                    📷
                  </button>
                </div>
                <div className="profile-details">
                  <h2 className="profile-name">{profileData?.username || user?.username || "User"}</h2>
                  <p className="profile-handle">@{(profileData?.username || user?.username || "user").toLowerCase()}</p>
                  <p className="profile-bio">{profileData?.bio || "add your bio"}</p>
                  <div className="profile-meta">
                    <span className="meta-item">📅 Joined {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Recently"}</span>
                    {profileData?.location && <span className="meta-item">📍 {profileData.location}</span>}
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="btn-primary" onClick={() => setIsEditingProfile(true)}>Edit Profile</button>
                  <button className="action-btn" onClick={handleShareProfile}>Share Profile</button>
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
                <button className="view-all-btn" onClick={handleViewAllActivity}>View All</button>
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
                <button className="view-all-btn" onClick={handleViewAllPlaylists}>See All</button>
              </div>
              <div className="playlist-mini-grid">
                {profilePlaylists.length > 0 ? (
                  profilePlaylists.map((playlist, idx) => (
                    <div 
                      key={playlist._id || idx} 
                      className="playlist-mini-card" 
                      style={{ background: `linear-gradient(135deg, #7c3aed22, #7c3aed11)` }}
                      onClick={() => handlePlaylistClick(playlist)}
                    >
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
            </>
          )}
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
                Stay updated with your latest activity
              </p>
              {unreadCount > 0 && (
                <button className="btn-secondary" onClick={handleMarkAllAsRead}>
                  Mark All as Read
                </button>
              )}
            </div>
            
            <div className="notifications-list">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div 
                      className="notification-icon"
                      style={{ background: getNotificationColor(notification.type) }}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <p className="notification-message">{notification.message}</p>
                      <div className="notification-meta">
                        <span className="notification-sender">
                          {notification.sender?.username || 'System'}
                        </span>
                        <span className="notification-time">
                          {getRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="notification-indicator" />
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🔔</div>
                  <h3>No notifications yet</h3>
                  <p>When someone interacts with your content, you'll see it here!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create */}
        {currentPage === "create" && (
          <div className="page-content active">
            <div className="page-header">
              <h1 className="page-title">Create Playlist</h1>
              <p className="page-subtitle">Import from YouTube, or create your own</p>
            </div>
            
            <div className="create-options">
              {/* Import from YouTube */}
              <div className="create-option-card" onClick={() => handleImportFromYouTube()}>
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Youtube_Music_icon.svg/960px-Youtube_Music_icon.svg.png" 
                  alt="YouTube" 
                  className="option-icon-img youtube"
                />
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
            {importMode === 'youtube' && (
              <div className="import-form">
                <h3>Import from YouTube</h3>
                <div className="form-group-modern">
                  <input
                    type="text"
                    className="form-input-modern"
                    placeholder="Paste YouTube playlist URL..."
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
                      <label className="form-label">Cover Image</label>
                      <div className="cover-image-upload">
                        {playlistCoverImage ? (
                          <div className="cover-preview">
                            <img src={playlistCoverImage} alt="Cover preview" className="cover-preview-img" />
                            <button
                              type="button"
                              className="remove-cover-btn"
                              onClick={() => setPlaylistCoverImage('')}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="cover-upload-placeholder">
                            <input
                              type="file"
                              id="playlist-cover-upload"
                              accept="image/*"
                              onChange={handlePlaylistCoverImageUpload}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor="playlist-cover-upload" className="cover-upload-btn">
                              📷 Add Cover Image
                            </label>
                          </div>
                        )}
                      </div>
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
                Manage your account and notification preferences
              </p>
            </div>
            
            {settingsMessage && (
              <div className={`settings-message ${settingsMessage.includes('success') ? 'success' : 'error'}`}>
                {settingsMessage}
              </div>
            )}
            
            <div className="settings-layout">
              <div className="settings-nav">
                <button 
                  className={`settings-nav-item ${settingsSection === 'account' ? 'active' : ''}`}
                  onClick={() => handleSettingsNavClick('account')}
                >
                  Account
                </button>
                <button 
                  className={`settings-nav-item ${settingsSection === 'notifications' ? 'active' : ''}`}
                  onClick={() => handleSettingsNavClick('notifications')}
                >
                  Notifications
                </button>
              </div>
              
              <div className="settings-content">
                {settingsSection === 'account' && (
                  <>
                    <div className="settings-card">
                      <h3 className="settings-section-title">Profile Information</h3>
                      <div className="settings-form">
                        <div className="settings-form-group">
                          <label className="settings-label">Username</label>
                          <input 
                            type="text" 
                            className="settings-input" 
                            value={accountSettings.username}
                            onChange={(e) => handleAccountSettingsChange('username', e.target.value)}
                          />
                        </div>
                        <div className="settings-form-group">
                          <label className="settings-label">Email</label>
                          <input 
                            type="email" 
                            className="settings-input" 
                            value={accountSettings.email}
                            onChange={(e) => handleAccountSettingsChange('email', e.target.value)}
                          />
                        </div>
                        <div className="settings-form-group">
                          <label className="settings-label">Bio</label>
                          <textarea 
                            className="settings-input form-textarea" 
                            rows="3" 
                            placeholder="add your bio"
                            value={accountSettings.bio}
                            onChange={(e) => handleAccountSettingsChange('bio', e.target.value)}
                          />
                        </div>
                        <div className="settings-form-group">
                          <label className="settings-label">Location</label>
                          <input 
                            type="text" 
                            className="settings-input" 
                            placeholder="City, Country"
                            value={accountSettings.location}
                            onChange={(e) => handleAccountSettingsChange('location', e.target.value)}
                          />
                        </div>
                        <button 
                          className="btn-save" 
                          onClick={handleSaveAccountSettings}
                          disabled={settingsLoading}
                        >
                          {settingsLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="settings-card">
                      <h3 className="settings-section-title">Change Password</h3>
                      <div className="settings-form">
                        <div className="settings-form-group">
                          <label className="settings-label">Current Password</label>
                          <input 
                            type="password" 
                            className="settings-input" 
                            placeholder="Enter current password"
                            value={passwordSettings.currentPassword}
                            onChange={(e) => handlePasswordSettingsChange('currentPassword', e.target.value)}
                          />
                        </div>
                        <div className="settings-form-group">
                          <label className="settings-label">New Password</label>
                          <input 
                            type="password" 
                            className="settings-input" 
                            placeholder="Enter new password"
                            value={passwordSettings.newPassword}
                            onChange={(e) => handlePasswordSettingsChange('newPassword', e.target.value)}
                          />
                        </div>
                        <div className="settings-form-group">
                          <label className="settings-label">Confirm New Password</label>
                          <input 
                            type="password" 
                            className="settings-input" 
                            placeholder="Confirm new password"
                            value={passwordSettings.confirmPassword}
                            onChange={(e) => handlePasswordSettingsChange('confirmPassword', e.target.value)}
                          />
                        </div>
                        <button 
                          className="btn-save" 
                          onClick={handlePasswordChange}
                          disabled={settingsLoading}
                        >
                          {settingsLoading ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="settings-card danger-zone">
                      <h3 className="settings-section-title">Danger Zone</h3>
                      <div className="danger-item">
                        <div>
                          <div className="danger-title">Delete Account</div>
                          <div className="danger-desc">Once you delete your account, there is no going back. Please be certain.</div>
                        </div>
                        <button 
                          className="btn-danger" 
                          onClick={handleDeleteAccount}
                          disabled={settingsLoading}
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                {settingsSection === 'notifications' && (
                  <div className="settings-card">
                    <h3 className="settings-section-title">Notification Preferences</h3>
                    <div className="notification-settings">
                      <div className="notification-group">
                        <h4>👥 Social Notifications</h4>
                        
                        <div className="notification-item">
                          <div className="notification-info">
                            <label className="notification-label">Follow Requests</label>
                            <p className="notification-desc">When someone wants to follow you</p>
                          </div>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.followRequests}
                              onChange={(e) => handleNotificationSettingsChange('followRequests', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                        
                        <div className="notification-item">
                          <div className="notification-info">
                            <label className="notification-label">New Followers</label>
                            <p className="notification-desc">When someone follows you</p>
                          </div>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.newFollowers}
                              onChange={(e) => handleNotificationSettingsChange('newFollowers', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                        
                        <div className="notification-item">
                          <div className="notification-info">
                            <label className="notification-label">Playlist Shares</label>
                            <p className="notification-desc">When someone shares a playlist with you</p>
                          </div>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.playlistShares}
                              onChange={(e) => handleNotificationSettingsChange('playlistShares', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="notification-group">
                        <h4>🎵 Music Notifications</h4>
                        
                        <div className="notification-item">
                          <div className="notification-info">
                            <label className="notification-label">Track Likes</label>
                            <p className="notification-desc">When someone likes your tracks</p>
                          </div>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.trackLikes}
                              onChange={(e) => handleNotificationSettingsChange('trackLikes', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                        
                        <div className="notification-item">
                          <div className="notification-info">
                            <label className="notification-label">Comments</label>
                            <p className="notification-desc">When someone comments on your content</p>
                          </div>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.comments}
                              onChange={(e) => handleNotificationSettingsChange('comments', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="notification-group">
                        <h4>💬 Communication</h4>
                        
                        <div className="notification-item">
                          <div className="notification-info">
                            <label className="notification-label">New Messages</label>
                            <p className="notification-desc">When you receive a new message</p>
                          </div>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.newMessages}
                              onChange={(e) => handleNotificationSettingsChange('newMessages', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="notification-group">
                        <h4>⚙️ System</h4>
                        
                        <div className="notification-item">
                          <div className="notification-info">
                            <label className="notification-label">System Updates</label>
                            <p className="notification-desc">Important updates and announcements</p>
                          </div>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={notificationSettings.systemUpdates}
                              onChange={(e) => handleNotificationSettingsChange('systemUpdates', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      className="btn-save" 
                      onClick={handleSaveNotificationSettings}
                      disabled={settingsLoading}
                    >
                      {settingsLoading ? 'Saving...' : 'Save Notification Preferences'}
                    </button>
                  </div>
                )}
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

      {/* Image Cropper Modal */}
      {showImageCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspect={1}
        />
      )}

      {/* Playlist Modal */}
      {selectedPlaylist && (
        <PlaylistModal
          playlist={selectedPlaylist}
          onClose={handleClosePlaylistModal}
        />
      )}

      {/* Mini Player - persists across navigation */}
      <MiniPlayer />
    </>
  );
}

export default HomePage;
