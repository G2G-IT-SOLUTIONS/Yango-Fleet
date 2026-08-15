import React from 'react';
import './Sidebar.css';
import customLogo from '../../assets/yango logo.png'; 

const Sidebar = ({ activePage, setActivePage, isOpen, toggleSidebar, user, onLogout }) => {
  const menuItems = [
    {
      id: 'register',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      label: 'Register Customer'
    },
    {
      id: 'registered',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      label: 'View Registrations'
    }
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar} />
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              {/* Replace SVG with custom logo image */}
              <img 
                src={customLogo} 
                alt="Logo" 
                className="brand-logo-image"
              />
            </div>
            <div className="brand-text">
              <span className="brand-name">Yango</span>
              <span className="brand-sub">Fleet</span>
            </div>
          </div>
          <button className="sidebar-close" onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {activePage === item.id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="user-details">
              <span className="user-fullname">{user?.first_name} {user?.last_name}</span>
              <span className="user-role-sidebar">{user?.role}</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;