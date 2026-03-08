// frontend/src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import HomePage from "./components/HomePage";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { getCurrentUser, isAuthenticated, logout } from "./services/authService";
import { MusicPlayerProvider } from "./context/MusicPlayerContext";
import "./App.css";

function App() {
  console.log('App component rendering'); // Debug log
  const [currentPage, setCurrentPage] = useState("landing"); // 'landing' | 'login' | 'register' | 'dashboard'
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      console.log('App.js - checkAuth called');
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      console.log('App.js - token in localStorage:', !!token);
      console.log('App.js - user in localStorage:', !!user);
      console.log('App.js - token value:', token?.slice(0, 20) + '...');
      console.log('App.js - token type:', typeof token);
      
      // Clean up invalid tokens
      if (token === 'undefined' || token === 'null' || !token) {
        console.log('App.js - clearing invalid token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthLoading(false);
        return;
      }
      
      if (isAuthenticated()) {
        const user = getCurrentUser();
        if (user) {
          console.log('App.js - setting current user:', user);
          setCurrentUser(user);
        }
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (response) => {
    console.log('App.js - handleLogin called with response:', response);
    console.log('App.js - storing token:', !!response.token);
    console.log('App.js - token value:', response.token?.slice(0, 20) + '...');
    
    // Validate token and user before storing
    if (!response || !response.token || response.token === 'undefined' || response.token === 'null') {
      console.error('App.js - Invalid response or token in handleLogin');
      return;
    }
    
    if (!response.user) {
      console.error('App.js - No user data in login response');
      return;
    }
    
    setCurrentUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const handleRegister = (response) => {
    console.log('App.js - handleRegister called with response:', response);
    console.log('App.js - storing token:', !!response.token);
    console.log('App.js - token value:', response.token?.slice(0, 20) + '...');
    
    // Validate token and user before storing
    if (!response || !response.token || response.token === 'undefined' || response.token === 'null') {
      console.error('App.js - Invalid response or token in handleRegister');
      return;
    }
    
    if (!response.user) {
      console.error('App.js - No user data in register response');
      return;
    }
    
    setCurrentUser(response.user);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    logout();
  };

  if (authLoading) {
    return (
      <div className="app-root">
        <div className="loading-state">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppContent 
        currentUser={currentUser}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  );
}

function AppContent({ currentUser, onLogin, onRegister, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="app">
      {/* Routes */}
      <MusicPlayerProvider>
        <Routes>
        {/* Landing/Home */}
        <Route path="/" element={
          isAuthenticated() ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <div className="hero">
              <div className="hero-video-background">
                <img 
                  src="https://img.youtube.com/vi/xnsxllY5VPw/maxresdefault.jpg" 
                  alt="VibeSync Background"
                  className="hero-bg-image"
                />
              </div>
              <div className="hero-content">
                <h1>Connect, Share, Discover</h1>
                <p>
                  Join VibeSync and immerse yourself in a world of music. Share your
                  playlists, connect with friends, and discover new sounds tailored
                  just for you.
                </p>
                <div className="hero-actions">
                  <Link to="/login" className="btn-primary">
                    Login
                  </Link>
                  <span style={{ margin: '0 1rem' }}></span>
                  <Link to="/register" className="btn-primary">
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          )
        } />
        
        {/* Login */}
        <Route path="/login" element={
          isAuthenticated() ? (
            <Navigate to="/" replace />
          ) : (
            <div className="auth-page">
              <div className="auth-video-background">
                <iframe
                  src="https://www.youtube.com/embed/xnsxllY5VPw?autoplay=1&mute=1&loop=1&playlist=xnsxllY5VPw"
                  title="VibeSync Background"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <LoginForm 
                onLogin={onLogin} 
                onBack={() => navigate('/')} 
              />
            </div>
          )
        } />
        
        {/* Register */}
        <Route path="/register" element={
          isAuthenticated() ? (
            <Navigate to="/" replace />
          ) : (
            <div className="auth-page">
              <div className="auth-video-background">
                <iframe
                  src="https://www.youtube.com/embed/xnsxllY5VPw?autoplay=1&mute=1&loop=1&playlist=xnsxllY5VPw"
                  title="VibeSync Background"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <RegisterForm
                onRegister={onRegister}
                onBack={() => navigate('/')}
              />
            </div>
          )
        } />
        
        {/* Dashboard/Home */}
        <Route path="/dashboard" element={
          isAuthenticated() ? (
            <HomePage user={currentUser} onLogout={onLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
      </MusicPlayerProvider>
    </div>
  );
}

export default App;
