// frontend/src/components/Sidebar.jsx
import React from "react";

function Sidebar({ currentPage, onNavigate, expanded, onToggle, unreadCount = 0, onLogout }) {
  const navItems = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "create", icon: "➕", label: "Create" },
    { id: "friends", icon: "👥", label: "Friends" },
    { id: "notifications", icon: "🔔", label: "Notifications", badge: unreadCount > 0 ? unreadCount : null },
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
            <span className="nav-icon">
              {item.icon}
              {item.badge && <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>}
            </span>
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
        <button
          className="nav-btn logout-btn"
          onClick={onLogout}
          title="Logout"
        >
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
