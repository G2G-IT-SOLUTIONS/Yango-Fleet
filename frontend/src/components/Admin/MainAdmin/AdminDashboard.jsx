import React, { useState } from 'react';
import './AdminDashboard.css';
import AdminSidebar from './AdminSidebar';
import TeamLeaders from './TeamLeaders';
import TeamMembers from './TeamMembers';
import TeamLeaderDetail from './TeamLeaderDetail';
import TeamMemberDetail from './TeamMemberDetail';
import RegisteredCars from './RegisteredCars';
import RegisteredDrivers from './RegisteredDrivers';
import Bindings from './Bindings';
import Performance from './Performance';

const AdminDashboard = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState('team-leaders');
  const [activeSubPage, setActiveSubPage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigate = (page, subPage = null, id = null) => {
    setActivePage(page);
    setActiveSubPage(subPage);
    if (id) setSelectedId(id);
  };

  const renderContent = () => {
    // Handle detail views
    if (activePage === 'team-leader-detail' && selectedId) {
      return <TeamLeaderDetail leaderId={selectedId} onBack={() => handleNavigate('team-leaders')} user={user} />;
    }
    if (activePage === 'team-member-detail' && selectedId) {
      return <TeamMemberDetail memberId={selectedId} onBack={() => handleNavigate('team-members')} user={user} />;
    }

    // Handle main views
    switch (activePage) {
      case 'team-leaders':
        return <TeamLeaders user={user} onSelectLeader={(id) => handleNavigate('team-leader-detail', null, id)} />;
      case 'team-members':
        return <TeamMembers user={user} onSelectMember={(id) => handleNavigate('team-member-detail', null, id)} />;
      case 'registered-cars':
        return <RegisteredCars user={user} />;
      case 'registered-drivers':
        return <RegisteredDrivers user={user} />;
      case 'bindings':
        return <Bindings user={user} />;
      case 'performance':
        return <Performance user={user} />;
      default:
        return <TeamLeaders user={user} onSelectLeader={(id) => handleNavigate('team-leader-detail', null, id)} />;
    }
  };

  return (
    <div className={`admin-dashboard ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <AdminSidebar 
        activePage={activePage}
        activeSubPage={activeSubPage}
        setActivePage={setActivePage}
        setActiveSubPage={setActiveSubPage}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        user={user}
        onLogout={onLogout}
        onNavigate={handleNavigate}
      />
      <div className="admin-main-content">
        <header className="admin-dashboard-header">
          <button className="admin-toggle-btn" onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="admin-header-right">
            <div className="admin-user-info">
              <span className="admin-user-name">{user?.first_name} {user?.last_name}</span>
              <span className="admin-user-role">{user?.role}</span>
            </div>
          </div>
        </header>
        <div className="admin-content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;