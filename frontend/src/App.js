// frontend/src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import HomePage from "./components/HomePage";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { getCurrentUser, isAuthenticated, logout } from "./services/authService";
import "./App.css";

function App() {
  console.log('App component rendering'); // Debug log
  const [currentPage, setCurrentPage] = useState("landing"); // 'landing' | 'login' | 'register' | 'dashboard'
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const user = getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleRegister = (user) => {
    setCurrentUser(user);
    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user));
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
      <Routes>
        {/* Landing/Home */}
        <Route path="/" element={
          isAuthenticated() ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <div className="hero">
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
          )
        } />
        
        {/* Login */}
        <Route path="/login" element={
          isAuthenticated() ? (
            <Navigate to="/" replace />
          ) : (
            <LoginForm 
              onLogin={onLogin} 
              onBack={() => navigate('/')} 
            />
          )
        } />
        
        {/* Register */}
        <Route path="/register" element={
          isAuthenticated() ? (
            <Navigate to="/" replace />
          ) : (
            <RegisterForm
              onRegister={onRegister}
              onBack={() => navigate('/')}
            />
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
    </div>
  );
}

export default App;
