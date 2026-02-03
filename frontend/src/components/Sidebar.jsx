// frontend/src/components/Sidebar.jsx
import React from "react";

function Sidebar({ currentPage, onNavigate, expanded, onToggle }) {
  const navItems = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "create", icon: "➕", label: "Create" },
    { id: "explore", icon: "🔍", label: "Explore" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
  ];

  return (
    <aside className={`sidebar ${expanded ? "expanded" : ""}`} id="sidebar">
      <div className="sidebar-header" onClick={onToggle}>
        <div className="sidebar-logo">V</div>
        <div className="logo-tooltip">VibeSync</div>
        <span className="sidebar-brand-text">VibeSync</span>
      </div>

      <div className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-btn ${currentPage === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        <button
          className={`nav-btn ${currentPage === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <span className="nav-icon">⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
