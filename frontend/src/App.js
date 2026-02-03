// frontend/src/App.js
import React, { useState } from "react";
import HomePage from "./components/HomePage";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("landing"); // 'landing' | 'login' | 'register' | 'dashboard'
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setCurrentPage("dashboard");
  };

  const handleRegister = (user) => {
    setCurrentUser(user);
    setCurrentPage("dashboard");
  };

  return (
    <div className="app-root">
      {/* Simple top nav for auth pages */}
      {(currentPage === "landing" ||
        currentPage === "login" ||
        currentPage === "register") && (
        <nav className="top-nav">
          <div className="top-nav-brand">VibeSync</div>
          <div className="top-nav-actions">
            <button
              className="btn-link"
              onClick={() => setCurrentPage("login")}
            >
              Login
            </button>
            <button
              className="btn-primary"
              onClick={() => setCurrentPage("register")}
            >
              Sign Up
            </button>
          </div>
        </nav>
      )}

      {/* Pages */}
      {currentPage === "landing" && (
        <div className="hero">
          <h1>Connect, Share, Discover</h1>
          <p>
            Join VibeSync and immerse yourself in a world of music. Share your
            playlists, connect with friends, and discover new sounds tailored
            just for you.
          </p>
          <button
            className="btn-primary"
            onClick={() => setCurrentPage("register")}
          >
            Get Started
          </button>
        </div>
      )}

      {currentPage === "login" && (
        <LoginForm onLogin={handleLogin} onBack={() => setCurrentPage("landing")} />
      )}

      {currentPage === "register" && (
        <RegisterForm
          onRegister={handleRegister}
          onBack={() => setCurrentPage("landing")}
        />
      )}

      {currentPage === "dashboard" && currentUser && (
        <HomePage user={currentUser} />
      )}
    </div>
  );
}

export default App;
