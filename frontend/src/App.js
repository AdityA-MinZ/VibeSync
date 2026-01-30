import React, { useState } from 'react';
import './App.css';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import HomePage from './components/HomePage';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (email, password) => {
    if (email && password) {
      const user = {
        email: email,
        username: email.split('@')[0]
      };
      setCurrentUser(user);
      setCurrentPage('dashboard');
    }
  };

  const handleRegister = (username, email, password) => {
    if (username && email && password) {
      const user = {
        email: email,
        username: username
      };
      setCurrentUser(user);
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="navbar">
        <div className="logo">VibeSync</div>
        <div className="navbar-right">
          {!currentUser ? (
            <div className="nav-buttons">
              <button className="btn-login" onClick={() => setCurrentPage('login')}>
                Login
              </button>
              <button className="btn-register" onClick={() => setCurrentPage('register')}>
                Register
              </button>
            </div>
          ) : (
            <>
              <div className="nav-buttons">
                <button className="btn-login" onClick={() => setCurrentPage('dashboard')}>
                  Dashboard
                </button>
                <button className="btn-logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
              <div className="nav-profile">
                <div className="user-profile-btn">
                  <div className="avatar">{currentUser.username.charAt(0).toUpperCase()}</div>
                  <span>{currentUser.username}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Pages */}
      {currentPage === 'landing' && (
        <div className="hero">
          <h1>Connect, Share, Discover</h1>
          <p>Join VibeSync and immerse yourself in a world of music. Share your playlists, connect with friends, and discover new vibes together.</p>
          <button className="btn-register" onClick={() => setCurrentPage('register')}>
            Get Started
          </button>
        </div>
      )}

      {currentPage === 'login' && <LoginForm onLogin={handleLogin} />}
      
      {currentPage === 'register' && <RegisterForm onRegister={handleRegister} />}
      
      {currentPage === 'dashboard' && currentUser && <HomePage user={currentUser} />}
    </div>
  );
}

export default App;
