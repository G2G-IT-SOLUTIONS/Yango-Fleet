import React, { useState, useEffect } from 'react';
import './TeamMembers.css';
import AddTeamMember from './AddTeamMember';
import ConfirmationDialog from '../ConfirmationDialog';

const TeamMembers = ({ user, onSelectMember }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/employees?role=team_member', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setMembers(data.employees || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      member.first_name?.toLowerCase().includes(search) ||
      member.last_name?.toLowerCase().includes(search) ||
      member.email?.toLowerCase().includes(search) ||
      member.phone?.includes(searchTerm)
    );
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && member.is_active) ||
      (filterStatus === 'inactive' && !member.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/employees/${selectedMember.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      if (response.ok) {
        setMembers(members.filter(m => m.id !== selectedMember.id));
        setShowDeleteDialog(false);
        setSelectedMember(null);
      }
    } catch (error) {
      console.error('Error deleting member:', error);
    }
  };

  const getTeamLeaderName = (teamLeaderId) => {
    const leader = members.find(m => m.id === teamLeaderId);
    return leader ? `${leader.first_name} ${leader.last_name}` : 'Unassigned';
  };

  return (
    <div className="team-members-container">
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Team Member"
        message={`Are you sure you want to delete ${selectedMember?.first_name} ${selectedMember?.last_name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <div className="team-members-header">
        <div className="header-top">
          <div>
            <h1 className="page-title">Team Members</h1>
            <p className="page-subtitle">Manage all team members in the organization</p>
          </div>
          <button className="btn-add" onClick={() => setShowAddForm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Team Member
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-number">{members.length}</span>
          <span className="stat-label">Total Members</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{members.filter(m => m.is_active).length}</span>
          <span className="stat-label">Active Members</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{members.filter(m => !m.team_leader_id).length}</span>
          <span className="stat-label">Unassigned</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{members.filter(m => m.team_leader_id).length}</span>
          <span className="stat-label">With Team Leader</span>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <AddTeamMember 
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            fetchMembers();
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
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading team members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h3>No Team Members Found</h3>
          <p>Click "Add New Team Member" to create one</p>
        </div>
      ) : (
        <div className="members-table-container">
          <table className="members-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Team Leader</th>
                <th>Registrations</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member, index) => (
                <tr key={member.id} className="clickable-row" onClick={() => onSelectMember(member.id)}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="member-name">
                      <div className="avatar-small">
                        {member.first_name?.[0]}{member.last_name?.[0]}
                      </div>
                      <span>{member.first_name} {member.last_name}</span>
                    </div>
                  </td>
                  <td>{member.email}</td>
                  <td>{member.phone}</td>
                  <td>
                    {member.team_leader_id ? (
                      <span className="leader-name-text">
                        {member.team_leader_first_name} {member.team_leader_last_name}
                      </span>
                    ) : (
                      <span className="unassigned-text">Unassigned</span>
                    )}
                  </td>
                  <td>{member.registration_count || 0}</td>
                  <td>
                    <span className={`status-badge ${member.is_active ? 'active' : 'inactive'}`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-action btn-view"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMember(member.id);
                      }}
                    >
                      View
                    </button>
                    <button 
                      className="btn-action btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMember(member);
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

export default TeamMembers;