import React, { useState, useEffect } from 'react';
import './TeamLeaders.css';
import AddTeamLeader from './AddTeamLeader';
import ConfirmationDialog from '../ConfirmationDialog';

const TeamLeaders = ({ user, onSelectLeader }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState(null);

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/employees?role=team_leader', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      console.log('Team Leaders API Response:', data); // Debug log
      
      // Handle different response formats
      let leadersData = [];
      
      // Check if response is successful
      if (response.ok) {
        // Try different response formats
        if (data.employees) {
          leadersData = data.employees;
        } else if (data.data) {
          leadersData = data.data;
        } else if (Array.isArray(data)) {
          leadersData = data;
        } else if (data.leaders) {
          leadersData = data.leaders;
        } else if (data.employee) {
          // Sometimes single employee is returned
          leadersData = [data.employee];
        } else {
          // If no specific key, check if the data itself is an array
          console.warn('Unknown response format:', data);
          leadersData = [];
        }
      } else {
        console.error('API Error:', data.message || 'Failed to fetch leaders');
        // Try to extract data even if success is false
        if (data.employees) leadersData = data.employees;
        else if (data.data) leadersData = data.data;
        else if (Array.isArray(data)) leadersData = data;
      }
      
      setLeaders(leadersData);
    } catch (error) {
      console.error('Error fetching leaders:', error);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaders = leaders.filter(leader => {
    const search = searchTerm.toLowerCase();
    return (
      (leader.first_name?.toLowerCase() || '').includes(search) ||
      (leader.last_name?.toLowerCase() || '').includes(search) ||
      (leader.email?.toLowerCase() || '').includes(search) ||
      (leader.phone || '').includes(searchTerm)
    );
  });

  const handleDelete = async () => {
    if (!selectedLeader) return;
    
    try {
      const response = await fetch(`/api/employees/${selectedLeader.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        setLeaders(leaders.filter(l => l.id !== selectedLeader.id));
        setShowDeleteDialog(false);
        setSelectedLeader(null);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete leader');
      }
    } catch (error) {
      console.error('Error deleting leader:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <div className="team-leaders-container">
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Team Leader"
        message={`Are you sure you want to delete ${selectedLeader?.first_name || ''} ${selectedLeader?.last_name || ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <div className="team-leaders-header">
        <div className="header-top">
          <div>
            <h1 className="page-title">Team Leaders</h1>
            <p className="page-subtitle">Manage all team leaders in the organization</p>
          </div>
          <button className="btn-add" onClick={() => setShowAddForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Team Leader
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-number">{leaders.length}</span>
          <span className="stat-label">Total Team Leaders</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{leaders.filter(l => l.is_active).length}</span>
          <span className="stat-label">Active Leaders</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">-</span>
          <span className="stat-label">Avg Team Size</span>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <AddTeamLeader 
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            fetchLeaders();
          }}
        />
      )}

      {/* Search & Filter */}
      <div className="search-filter-bar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <button 
            className="filter-btn active" 
            onClick={() => {/* Add filter logic */}}
          >
            All
          </button>
          <button 
            className="filter-btn"
            onClick={() => {/* Add filter logic */}}
          >
            Active
          </button>
          <button 
            className="filter-btn"
            onClick={() => {/* Add filter logic */}}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Leaders List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading team leaders...</p>
        </div>
      ) : filteredLeaders.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3>No Team Leaders Found</h3>
          <p>Click "Add New Team Leader" to create one</p>
        </div>
      ) : (
        <div className="leaders-table-container">
          <table className="leaders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Team Members</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaders.map((leader, index) => (
                <tr key={leader.id || index} className="clickable-row" onClick={() => onSelectLeader(leader.id)}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="leader-name">
                      <div className="avatar-small">
                        {leader.first_name?.[0] || ''}{leader.last_name?.[0] || ''}
                      </div>
                      <span>{leader.first_name || ''} {leader.last_name || ''}</span>
                    </div>
                  </td>
                  <td>{leader.email || '-'}</td>
                  <td>{leader.phone || '-'}</td>
                  <td>{leader.team_members_count || 0}</td>
                  <td>
                    <span className={`status-badge ${leader.is_active ? 'active' : 'inactive'}`}>
                      {leader.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-action btn-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLeader(leader.id);
                      }}
                    >
                      View
                    </button>
                    <button 
                      className="btn-action btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLeader(leader);
                        setShowDeleteDialog(true);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TeamLeaders;