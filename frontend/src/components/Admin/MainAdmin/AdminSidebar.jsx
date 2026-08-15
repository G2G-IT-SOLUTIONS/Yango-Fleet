import React, { useState } from 'react';
import './AdminSidebar.css';
import customLogo from '../../../assets/yango logo.png';

const AdminSidebar = ({ 
  activePage, 
  activeSubPage,
  setActivePage, 
  setActiveSubPage,
  isOpen, 
  toggleSidebar, 
  user, 
  onLogout,
  onNavigate 
}) => {
  const [expandedMenu, setExpandedMenu] = useState('team');

  const toggleMenu = (menu) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  const menuItems = [
    {
      id: 'team',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label: 'Manage Sales Team',
      subItems: [
        { id: 'team-leaders', label: 'Sales Team Leaders' },
        { id: 'team-members', label: 'Sales Team Members' }
      ]
    },
    {
      id: 'registered-cars',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polyline points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18" r="2.5" />
          <circle cx="18.5" cy="18" r="2.5" />
        </svg>
      ),
      label: 'Registered Cars',
      subItems: null
    },
    {
      id: 'registered-drivers',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: 'Registered Drivers',
      subItems: null
    },
    {
      id: 'bindings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 3h5v5" />
          <path d="M8 3H3v5" />
          <path d="M21 3l-6 6" />
          <path d="M3 21l6-6" />
          <path d="M16 21h5v-5" />
          <path d="M8 21H3v-5" />
        </svg>
      ),
      label: 'Bindings',
      subItems: null
    },
    {
      id: 'performance',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20V14" />
        </svg>
      ),
      label: 'Performance',
      subItems: null
    }
  ];

  const handleItemClick = (item) => {
    if (item.subItems) {
      toggleMenu(item.id);
    } else {
      onNavigate(item.id);
    }
  };

  const handleSubItemClick = (subItem) => {
    onNavigate(subItem.id);
  };

  return (
    <>
      <div className={`admin-sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar} />
      <aside className={`admin-sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <div className="admin-brand-icon">
              <img src={customLogo} alt="Logo" className="admin-brand-logo-image" />
            </div>
            <div className="admin-brand-text">
              <span className="admin-brand-name">Yango</span>
              <span className="admin-brand-sub">Fleet Admin</span>
            </div>
          </div>
          <button className="admin-sidebar-close" onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.id} className="admin-nav-item-wrapper">
              <button
                className={`admin-nav-item ${activePage === item.id ? 'active' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span className="admin-nav-label">{item.label}</span>
                {item.subItems && (
                  <span className={`admin-nav-arrow ${expandedMenu === item.id ? 'expanded' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                )}
              </button>
              {item.subItems && expandedMenu === item.id && (
                <div className="admin-nav-submenu">
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      className={`admin-nav-subitem ${activePage === subItem.id ? 'active' : ''}`}
                      onClick={() => handleSubItemClick(subItem)}
                    >
                      <span className="admin-nav-subitem-indicator" />
                      <span className="admin-nav-subitem-label">{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-user-avatar">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="admin-user-details">
              <span className="admin-user-fullname">{user?.first_name} {user?.last_name}</span>
              <span className="admin-user-role-sidebar">{user?.role}</span>
            </div>
          </div>
          <button className="admin-sidebar-logout" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;