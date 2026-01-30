import React from 'react';

function HomePage({ user }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user.username}</h1>
      </div>

      {/* Quick Stats Cards */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2><span className="card-icon">🎵</span> Playlists</h2>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>12</span>
          </div>
          <div className="card-content">Your curated music collections</div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2><span className="card-icon">👥</span> Friends</h2>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>48</span>
          </div>
          <div className="card-content">Connected music lovers</div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2><span className="card-icon">🎧</span> Listening</h2>
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>324</span>
          </div>
          <div className="card-content">Hours of music enjoyed</div>
        </div>
      </div>

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
            <div className="value">Electronic</div>
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
              <div className="list-item-title">Chill Vibes</div>
              <div className="list-item-subtitle">24 tracks • 1.5 hours</div>
            </div>
            <button className="btn-action">Play</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">🔥</div>
            <div className="list-item-content">
              <div className="list-item-title">Workout Beats</div>
              <div className="list-item-subtitle">32 tracks • 2.1 hours</div>
            </div>
            <button className="btn-action">Play</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">🌙</div>
            <div className="list-item-content">
              <div className="list-item-title">Night Drive</div>
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
              <div className="list-item-title">Alex Johnson</div>
              <div className="list-item-subtitle">Listening to Lo-Fi Beats</div>
            </div>
            <button className="btn-action">View Profile</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">👤</div>
            <div className="list-item-content">
              <div className="list-item-title">Sarah Williams</div>
              <div className="list-item-subtitle">Created a new playlist</div>
            </div>
            <button className="btn-action">View Profile</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">👤</div>
            <div className="list-item-content">
              <div className="list-item-title">Mike Chen</div>
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
              <div className="list-item-title">DJ MusicMaster</div>
              <div className="list-item-subtitle">128 playlists • 1.2K followers</div>
            </div>
            <button className="btn-action">Follow</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">🎸</div>
            <div className="list-item-content">
              <div className="list-item-title">Indie Explorer</div>
              <div className="list-item-subtitle">56 playlists • 890 followers</div>
            </div>
            <button className="btn-action">Follow</button>
          </div>
          <div className="list-item">
            <div className="list-item-icon">🎤</div>
            <div className="list-item-content">
              <div className="list-item-title">Hip Hop Head</div>
              <div className="list-item-subtitle">94 playlists • 2.5K followers</div>
            </div>
            <button className="btn-action">Follow</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
