// src/components/TeamLeader/MembersRegistration.js
import React, { useState, useEffect } from 'react';
import './MembersRegistration.css';

const MembersRegistration = ({ user }) => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid' | 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch team members and their registrations
  useEffect(() => {
    fetchTeamData();
  }, []);

 // src/components/TeamLeader/MembersRegistration.js
// Update the fetchTeamData function

const fetchTeamData = async () => {
  try {
    setLoading(true);
    setError(null);

    // ✅ Use the new team leader endpoint
    const response = await fetch('/api/performance/team-leader/members', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    const data = await response.json();

    if (data.success) {
      // ✅ Data comes in the new format
      const { summary, members } = data.data;
      
      // Format members for display
      const formattedMembers = members.map(member => ({
        driver_id: member.id,
        driver_name: `${member.firstName} ${member.lastName}`,
        driver_phone: member.phone || 'N/A',
        driver_email: member.email || 'N/A',
        registration_count: member.totalRegistrations,
        registrations: member.registrations || [],
        created_at: member.memberSince || new Date().toISOString(),
        status: member.isActive ? 'active' : 'inactive'
      }));

      setMembers(formattedMembers);
      
      // Optionally update stats using the summary data
      // setStats(summary);
    } else {
      setError(data.message || 'Failed to load team members');
    }
  } catch (err) {
    console.error('Error fetching team data:', err);
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Update the fetchMemberDetails function
const fetchMemberDetails = async (memberId) => {
  try {
    setLoading(true);
    setError(null);
    
    // ✅ Use the new member registrations endpoint
    const response = await fetch(`/api/performance/team-leader/member/${memberId}/registrations`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    const data = await response.json();

    if (data.success) {
      const { member, registrations } = data.data;
      
      // Format registrations for display
      const formattedRegistrations = registrations.map(reg => ({
        id: reg.id,
        status: reg.status,
        created_at: reg.createdAt,
        car_brand: reg.car?.brand || 'N/A',
        car_model: reg.car?.model || 'N/A',
        car_license_plate: reg.car?.licensePlate || 'N/A',
        driver_first_name: reg.driver?.firstName || 'N/A',
        driver_last_name: reg.driver?.lastName || '',
        driver_phone: reg.driver?.phone || 'N/A',
        yango_synced: reg.yangoSynced || false
      }));

      setRegistrations(formattedRegistrations);
      setSelectedMember({
        driver_id: member?.id,
        driver_name: `${member?.firstName} ${member?.lastName}`,
        driver_phone: member?.phone || 'N/A',
        driver_email: member?.email || 'N/A',
        registration_count: member?.totalRegistrations || 0
      });
    } else {
      setError(data.message || 'Failed to load member details');
    }
  } catch (err) {
    console.error('Error fetching member details:', err);
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // View registration details
  const viewRegistrationDetails = (registration) => {
    setSelectedRegistration(registration);
    setShowDetailModal(true);
  };

  // Export data
  const exportData = (format = 'csv') => {
    const exportData = members.map(member => ({
      'Member Name': member.driver_name,
      'Phone': member.driver_phone,
      'Email': member.driver_email,
      'Registration Count': member.registration_count,
      'Status': member.status,
      'Registered On': new Date(member.created_at).toLocaleDateString()
    }));

    if (format === 'csv') {
      const headers = Object.keys(exportData[0]);
      const csvRows = [
        headers.join(','),
        ...exportData.map(row => headers.map(h => row[h]).join(','))
      ];
      const csvString = csvRows.join('\n');
      
      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team_members_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  // Filter members based on search
  const filteredMembers = members.filter(member =>
    member.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.driver_phone.includes(searchTerm) ||
    member.driver_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loading && members.length === 0) {
    return (
      <div className="members-loading">
        <div className="spinner"></div>
        <p>Loading team members...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="members-error">
        <div className="error-icon">⚠️</div>
        <h3>{error}</h3>
        <button className="btn-retry" onClick={fetchTeamData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="members-registration-container">
      {/* Header */}
      <div className="members-header">
        <div className="header-left">
          <h1 className="page-title">Team Members</h1>
          <p className="page-subtitle">
            Manage and track registrations for your team members
          </p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-export"
            onClick={() => exportData('csv')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button className="btn-refresh" onClick={fetchTeamData}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-value">{members.length}</span>
            <span className="stat-label">Total Members</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <span className="stat-value">
              {members.reduce((acc, m) => acc + m.registration_count, 0)}
            </span>
            <span className="stat-label">Total Registrations</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <span className="stat-value">
              {members.filter(m => m.status === 'active').length}
            </span>
            <span className="stat-label">Active Members</span>
          </div>
        </div>
      </div>

      {/* Search and View Controls */}
      <div className="members-controls">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search members by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
        </div>
      </div>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <div className="no-members">
          <div className="empty-icon">📭</div>
          <h3>No members found</h3>
          <p>
            {searchTerm ? 'Try adjusting your search criteria' : 'No team members have been registered yet'}
          </p>
        </div>
      ) : (
        <>
          {/* List View */}
          {viewMode === 'list' && (
            <div className="members-list">
              {filteredMembers.map((member) => (
                <div
                  key={member.driver_id}
                  className="member-list-item"
                  onClick={() => fetchMemberDetails(member.driver_id)}
                >
                  <div className="member-avatar">
                    <span>
                      {member.driver_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="member-info">
                    <div className="member-name">{member.driver_name}</div>
                    <div className="member-details">
                      <span>📱 {member.driver_phone}</span>
                      <span>📧 {member.driver_email}</span>
                      <span className="registration-badge">
                        {member.registration_count} registrations
                      </span>
                    </div>
                  </div>
                  <div className="member-status">
                    <span className={`status-badge ${member.status}`}>
                      {member.status}
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="members-grid">
              {filteredMembers.map((member) => (
                <div
                  key={member.driver_id}
                  className="member-grid-item"
                  onClick={() => fetchMemberDetails(member.driver_id)}
                >
                  <div className="grid-avatar">
                    <span>
                      {member.driver_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="grid-info">
                    <h4>{member.driver_name}</h4>
                    <p>📱 {member.driver_phone}</p>
                    <p>📧 {member.driver_email}</p>
                    <div className="grid-stats">
                      <span className="stat-badge">
                        📋 {member.registration_count}
                      </span>
                      <span className={`status-badge ${member.status}`}>
                        {member.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="members-table-container">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Registrations</th>
                    <th>Status</th>
                    <th>Registered On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.driver_id}>
                      <td className="table-member">
                        <div className="table-avatar">
                          <span>
                            {member.driver_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="table-name">{member.driver_name}</span>
                      </td>
                      <td>{member.driver_phone}</td>
                      <td>{member.driver_email}</td>
                      <td>
                        <span className="registration-count-badge">
                          {member.registration_count}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${member.status}`}>
                          {member.status}
                        </span>
                      </td>
                      <td>{new Date(member.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn-view-details"
                          onClick={() => fetchMemberDetails(member.driver_id)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Member Details Section */}
      {selectedMember && (
        <div className="member-details-section">
          <div className="details-header">
            <div className="details-title">
              <h2>{selectedMember.driver_name}'s Registrations</h2>
              <button
                className="btn-close-details"
                onClick={() => {
                  setSelectedMember(null);
                  setRegistrations([]);
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="registrations-list">
            {registrations.length === 0 ? (
              <div className="no-registrations">
                <p>No registrations found for this member</p>
              </div>
            ) : (
              registrations.map((registration, index) => (
                <div
                  key={registration.id || index}
                  className="registration-item"
                  onClick={() => viewRegistrationDetails(registration)}
                >
                  <div className="reg-header">
                    <span className="reg-number">
                      Registration #{index + 1}
                    </span>
                    <span className={`reg-status ${registration.status}`}>
                      {registration.status}
                    </span>
                  </div>
                  <div className="reg-details">
                    <div className="reg-detail">
                      <span className="detail-label">Car:</span>
                      <span className="detail-value">
                        {registration.car_brand} {registration.car_model}
                      </span>
                    </div>
                    <div className="reg-detail">
                      <span className="detail-label">License Plate:</span>
                      <span className="detail-value">
                        {registration.car_license_plate}
                      </span>
                    </div>
                    <div className="reg-detail">
                      <span className="detail-label">Date:</span>
                      <span className="detail-value">
                        {new Date(registration.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="reg-action">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Registration Detail Modal */}
      {showDetailModal && selectedRegistration && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registration Details</h3>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-group">
                  <label>Driver Name</label>
                  <p>{selectedRegistration.driver_first_name} {selectedRegistration.driver_last_name}</p>
                </div>
                <div className="detail-group">
                  <label>Phone</label>
                  <p>{selectedRegistration.driver_phone}</p>
                </div>
                <div className="detail-group">
                  <label>Car Brand</label>
                  <p>{selectedRegistration.car_brand}</p>
                </div>
                <div className="detail-group">
                  <label>Car Model</label>
                  <p>{selectedRegistration.car_model}</p>
                </div>
                <div className="detail-group">
                  <label>License Plate</label>
                  <p>{selectedRegistration.car_license_plate}</p>
                </div>
                <div className="detail-group">
                  <label>Status</label>
                  <p>
                    <span className={`status-badge ${selectedRegistration.status}`}>
                      {selectedRegistration.status}
                    </span>
                  </p>
                </div>
                <div className="detail-group">
                  <label>Registration Date</label>
                  <p>{new Date(selectedRegistration.created_at).toLocaleString()}</p>
                </div>
                <div className="detail-group">
                  <label>Yango Synced</label>
                  <p>
                    <span className={`sync-badge ${selectedRegistration.yango_synced ? 'synced' : 'pending'}`}>
                      {selectedRegistration.yango_synced ? '✅ Synced' : '⏳ Pending'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersRegistration;