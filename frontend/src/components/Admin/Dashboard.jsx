import React, { useState } from 'react';
import './Dashboard.css';
import Sidebar from './Sidebar';
import RegisterCustomer from './RegisterCustomer';
import SeeRegistered from './SeeRegistered';
import ConfirmationDialog from './ConfirmationDialog';

const Dashboard = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState('register');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const renderContent = () => {
    switch (activePage) {
      case 'register':
        return <RegisterCustomer user={user} />;
      case 'registered':
        return <SeeRegistered user={user} />;
      default:
        return <RegisterCustomer user={user} />;
    }
  };

  return (
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showLogoutDialog}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
      />

      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        user={user}
        onLogout={handleLogoutClick}
      />
      <div className="main-content">
        <header className="dashboard-header">
          <button className="toggle-btn" onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.first_name} {user?.last_name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <button className="logout-btn" onClick={handleLogoutClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        </header>
        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;