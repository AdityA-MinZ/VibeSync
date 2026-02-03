// frontend/src/components/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";

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
  const [liked, setLiked] = useState(new Set());
  const [currentPage, setCurrentPage] = useState("home");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalTrack, setModalTrack] = useState(null);

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

  useEffect(() => {
    // re-run masonry on changes
    setTimeout(() => {
      const cards = document.querySelectorAll(".card");
      cards.forEach((card) => {
        const img = card.querySelector(".card-image");
        const content = card.querySelector(".card-content");
        const actions = card.querySelector(".card-actions");
        if (!img || !content || !actions) return;
        const height =
          img.offsetHeight + content.offsetHeight + actions.offsetHeight;
        card.style.gridRowEnd = `span ${Math.ceil(height / 10)}`;
      });
    }, 100);
  }, [filteredData, sidebarExpanded]);

  const toggleLike = (trackId) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
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
      {/* Search bar */}
      <div
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
      </div>

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
            <div className="masonry-grid">
              {filteredData.map((track) => {
                const isLiked = liked.has(track.id);
                // random height like original
                const heights = [250, 300, 350, 400, 450];
                const randomHeight =
                  heights[Math.floor(Math.random() * heights.length)];
                return (
                  <div
                    key={track.id}
                    className="card"
                    style={{
                      gridRowEnd: `span ${Math.ceil(randomHeight / 10)}`,
                    }}
                  >
                    <div
                      className="card-image"
                      style={{ height: randomHeight }}
                    >
                      <img src={track.image} alt={track.title} />
                      <div className="genre-badge">{track.genre}</div>
                      <div className="play-overlay">
                        <div className="play-icon" />
                      </div>
                      <div className="card-overlay">
                        <div className="card-title">{track.title}</div>
                        <div className="card-artist">{track.artist}</div>
                      </div>
                    </div>
                    <div className="card-content">
                      <div className="card-title">{track.title}</div>
                      <div className="card-artist">{track.artist}</div>
                      <div className="card-stats">
                        <div className="stat-item">
                          <span>👍</span>
                          <span>{track.likes}</span>
                        </div>
                        <div className="stat-item">
                          <span>▶</span>
                          <span>{track.plays}</span>
                        </div>
                        <div className="stat-item">
                          <span>💬</span>
                          <span>{track.comments}</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className={`action-btn ${
                          isLiked ? "liked" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track.id);
                        }}
                      >
                        {isLiked ? "❤️ Like" : "🤍 Like"}
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => openModal(track)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Profile */}
        {currentPage === "profile" && (
          <div className="page-content active">
            <div className="page-header">
              <h1 className="page-title">Profile</h1>
              <p className="page-subtitle">
                Manage your account and preferences
              </p>
            </div>
            <div className="profile-card">
              <div className="profile-avatar-large">
                {(user.name || "A").charAt(0).toUpperCase()}
              </div>
              <h2>{user.name || "adi"}</h2>
              <p
                style={{
                  color: "#a0a8c8",
                  marginBottom: "1rem",
                }}
              >
                {user.email || "adi@gmail.com"}
              </p>
              <p style={{ color: "#a0a8c8" }}>Member Since: January 2026</p>
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="profile-stat-number">12</div>
                  <div className="profile-stat-label">Playlists</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-number">48</div>
                  <div className="profile-stat-label">Friends</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-number">324</div>
                  <div className="profile-stat-label">Hours Listened</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create */}
        {currentPage === "create" && (
          <div className="page-content active">
            <div className="page-header">
              <h1 className="page-title">Create</h1>
              <p className="page-subtitle">Upload and share your music</p>
            </div>
            <div className="settings-group">
              <h3>Upload New Track</h3>
              <div className="setting-item">
                <div>
                  <div style={{ fontWeight: 600 }}>Track Title</div>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Enter track name"
                    style={{ marginTop: "0.5rem" }}
                  />
                </div>
              </div>
              <div className="setting-item">
                <div style={{ width: "100%" }}>
                  <div style={{ fontWeight: 600 }}>Genre</div>
                  <select
                    className="auth-input"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <option>Electronic</option>
                    <option>Pop</option>
                    <option>Hip Hop</option>
                    <option>Rock</option>
                    <option>Jazz</option>
                    <option>Classical</option>
                  </select>
                </div>
              </div>
              <div className="setting-item">
                <div style={{ width: "100%" }}>
                  <div style={{ fontWeight: 600 }}>Description</div>
                  <textarea
                    className="auth-input"
                    placeholder="Describe your track..."
                    style={{ marginTop: "0.5rem", minHeight: 100 }}
                  />
                </div>
              </div>
              <div className="setting-item">
                <div style={{ width: "100%" }}>
                  <div style={{ fontWeight: 600 }}>Audio File</div>
                  <button
                    className="action-btn"
                    style={{
                      width: "100%",
                      marginTop: "0.5rem",
                      padding: "1rem",
                      background: "var(--color-accent)",
                      color: "#fff",
                    }}
                  >
                    Choose File
                  </button>
                </div>
              </div>
              <div className="setting-item">
                <div style={{ width: "100%" }}>
                  <div style={{ fontWeight: 600 }}>Cover Art</div>
                  <button
                    className="action-btn"
                    style={{
                      width: "100%",
                      marginTop: "0.5rem",
                      padding: "1rem",
                    }}
                  >
                    Upload Image
                  </button>
                </div>
              </div>
            </div>
            <button
              className="action-btn"
              style={{
                width: "100%",
                padding: "1rem",
                background: "var(--color-accent)",
                color: "#fff",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              Publish Track
            </button>
          </div>
        )}

        {/* Explore */}
        {currentPage === "explore" && (
          <div className="page-content active">
            <div className="page-header">
              <h1 className="page-title">Explore</h1>
              <p className="page-subtitle">
                Discover new music and trending artists
              </p>
            </div>
            <div className="explore-grid">
              {[
                { icon: "🔥", title: "Trending Now", desc: "Check out the hottest tracks of the week" },
                { icon: "🆕", title: "New Releases", desc: "Fresh music from your favorite artists" },
                { icon: "🎭", title: "Genres", desc: "Explore music by genre" },
                { icon: "⭐", title: "Top Charts", desc: "Most played tracks globally" },
                { icon: "🎨", title: "Mood & Activity", desc: "Music for every moment" },
                { icon: "🌍", title: "Around the World", desc: "Discover international hits" },
              ].map((card) => (
                <div key={card.title} className="explore-card">
                  <div className="explore-icon">{card.icon}</div>
                  <div className="explore-title">{card.title}</div>
                  <div className="explore-description">{card.desc}</div>
                </div>
              ))}
            </div>
          </div>
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
            <div className="notification-item">
              <div
                className="notification-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #ec4899, #8b5cf6)",
                }}
              >
                ❤️
              </div>
              <div className="notification-content">
                <div className="notification-text">
                  <strong>Luna Eclipse</strong> liked your playlist
                </div>
                <div className="notification-time">2 hours ago</div>
              </div>
            </div>
            <div className="notification-item">
              <div
                className="notification-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #06b6d4, #3b82f6)",
                }}
              >
                🎵
              </div>
              <div className="notification-content">
                <div className="notification-text">
                  New track added to <strong>Electronic Mix</strong>
                </div>
                <div className="notification-time">5 hours ago</div>
              </div>
            </div>
            <div className="notification-item">
              <div
                className="notification-icon"
                style={{
                  background:
                    "linear-gradient(135deg, #f59e0b, #ef4444)",
                }}
              >
                👥
              </div>
              <div className="notification-content">
                <div className="notification-text">
                  <strong>Street Sound</strong> started following you
                </div>
                <div className="notification-time">1 day ago</div>
              </div>
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
            <div className="settings-group">
              <h3>Account Settings</h3>
              <div className="setting-item">
                <div>
                  <div style={{ fontWeight: 600 }}>Email</div>
                  <div
                    style={{
                      color: "var(--color-text-secondary)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {user.email || "adi@gmail.com"}
                  </div>
                </div>
                <button className="action-btn">Edit</button>
              </div>
              <div className="setting-item">
                <div>
                  <div style={{ fontWeight: 600 }}>Password</div>
                  <div
                    style={{
                      color: "var(--color-text-secondary)",
                      fontSize: "0.875rem",
                    }}
                  >
                    ••••••••
                  </div>
                </div>
                <button className="action-btn">Change</button>
              </div>
            </div>
          </div>
        )}
      </div>

<<<<<<< HEAD
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
                  onClick={() =>
                    alert("Added to playlist (hook playlist logic)")
                  }
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
                  <span>👍</span>
                  <span>{formatNumber(modalTrack.likes)}</span>
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
            </div>
          </div>
        </div>
      )}
    </>
=======
      {/* Profile Section */}
      <div className="section-full">
        <h2>👤 Profile</h2>
        <div className="profile-details">
          <div className="profile-item">
            <label>Username</label>
            <div className="value">{user.username}</div>
          </div>
          <div className="profile-item">
            <label>Email</label>
            <div className="value">{user.email}</div>
          </div>
          <div className="profile-item">
            <label>Member Since</label>
            <div className="value">January 2026</div>
          </div>
          <div className="profile-item">
            <label>Favorite Genre</label>
            <div className="value">Heavy Metal</div>
          </div>
        </div>
      </div>

      {/* Playlists Section */}
      <div className="section-full">
        <h2>🎵 My Playlists</h2>
        <div className="playlist-list">
          <div className="list-item">
            <div className="list-item-icon">🎶</div>
            <div className="list-item-content">
              <div className="list-item-title">Chatpate Ganne</div>
              <div className="list-item-subtitle">24 tracks • 1.5 hours</div>
            </div>
            <button className="btn-action">Play</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">🔥</div>
            <div className="list-item-content">
              <div className="list-item-title">Party Playlist</div>
              <div className="list-item-subtitle">32 tracks • 2.1 hours</div>
            </div>
            <button className="btn-action">Play</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">🌙</div>
            <div className="list-item-content">
              <div className="list-item-title">Driving Playlist</div>
              <div className="list-item-subtitle">18 tracks • 1.2 hours</div>
            </div>
            <button className="btn-action">Play</button>
          </div>
        </div>
      </div>

      {/* Friends Section */}
      <div className="section-full">
        <h2>👥 Friends</h2>
        <div className="friends-list">
          <div className="list-item">
            <div className="list-item-icon">👤</div>
            <div className="list-item-content">
              <div className="list-item-title">W NICOLE</div>
              <div className="list-item-subtitle">Listening to Lo-Fi Beats</div>
            </div>
            <button className="btn-action">View Profile</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">👤</div>
            <div className="list-item-content">
              <div className="list-item-title">L HAUZEL</div>
              <div className="list-item-subtitle">Created a new playlist</div>
            </div>
            <button className="btn-action">View Profile</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">👤</div>
            <div className="list-item-content">
              <div className="list-item-title">ADITYA SAN</div>
              <div className="list-item-subtitle">Shared 5 new tracks</div>
            </div>
            <button className="btn-action">View Profile</button>
          </div>
        </div>
      </div>

      {/* Discover Users Section */}
      <div className="section-full">
        <h2>🔍 Discover Users</h2>
        <div className="users-list">
          <div className="list-item">
            <div className="list-item-icon">🎵</div>
            <div className="list-item-content">
              <div className="list-item-title">EZ Snippet</div>
              <div className="list-item-subtitle">128 playlists • 1.2K followers</div>
            </div>
            <button className="btn-action">Follow</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">🎸</div>
            <div className="list-item-content">
              <div className="list-item-title">Sohm</div>
              <div className="list-item-subtitle">56 playlists • 890 followers</div>
            </div>
            <button className="btn-action">Follow</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">🎤</div>
            <div className="list-item-content">
              <div className="list-item-title">Sufr</div>
              <div className="list-item-subtitle">94 playlists • 2.5K followers</div>
            </div>
            <button className="btn-action">Follow</button>
          </div>
        </div>
      </div>
    </div>
>>>>>>> fa60328df709e80d57b66fa79261c7bcd90ccb31
  );
}

export default HomePage;
