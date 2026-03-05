// frontend/src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import HomePage from "./components/HomePage";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { getCurrentUser, isAuthenticated, logout } from "./services/authService";
import "./App.css";

function App() {
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
          // Redirect to home page (which contains the dashboard)
          setCurrentPage("landing");
        }
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentPage("landing");
    // Navigate to home page after successful login
    window.location.hash = '#/';
    // Navigate to dashboard after successful login
    window.location.hash = '#/dashboard';
  };

  const handleRegister = (user) => {
    setCurrentUser(user);
    setCurrentPage("dashboard");
    // Navigate to dashboard after successful registration
    window.location.hash = '#/dashboard';
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    setCurrentPage("landing");
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
                onLogin={handleLogin} 
                onBack={() => window.location.href = '/'} 
              />
            )
          } />
          
          {/* Register */}
          <Route path="/register" element={
            isAuthenticated() ? (
              <Navigate to="/" replace />
            ) : (
              <RegisterForm
                onRegister={handleRegister}
                onBack={() => window.location.href = '/'}
              />
            )
          } />
          
          {/* Dashboard/Home */}
          <Route path="/dashboard" element={
            isAuthenticated() ? (
              <HomePage user={currentUser} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
