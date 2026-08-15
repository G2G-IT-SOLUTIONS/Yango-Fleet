import React, { useState, useEffect } from 'react';
import './TeamLeaderDetail.css';
import ConfirmationDialog from '../ConfirmationDialog';

const TeamLeaderDetail = ({ leaderId, onBack, user }) => {
  const [leader, setLeader] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'team_leader'
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeaderDetails();
  }, [leaderId]);

  const fetchLeaderDetails = async () => {
  setLoading(true);
  setError('');
  try {
    // Fetch leader details
    const leaderResponse = await fetch(`/api/employees/${leaderId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    const leaderData = await leaderResponse.json();
    
    if (leaderData.success) {
      setLeader(leaderData.employee);
      setFormData({
        first_name: leaderData.employee.first_name || '',
        last_name: leaderData.employee.last_name || '',
        email: leaderData.employee.email || '',
        phone: leaderData.employee.phone || '',
        role: leaderData.employee.role || 'team_leader'
      });
    } else {
      setError('Failed to load leader details');
    }

    // Fetch team members
    const membersResponse = await fetch(`/api/employees?team_leader_id=${leaderId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    const membersData = await membersResponse.json();
    if (membersData.success) {
      setMembers(membersData.employees || []);
    }

    // Fetch ALL team members (not just those without a leader)
    // Then filter in the frontend
    const allMembersResponse = await fetch('/api/employees?role=team_member', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    const allMembersData = await allMembersResponse.json();
    
    console.log('All team members:', allMembersData); // Debug log
    
    if (allMembersData.success) {
      const allMembers = allMembersData.employees || [];
      
      // Filter out members who already have a team leader OR are already in this team
      const available = allMembers.filter(m => {
        // Member is available if:
        // 1. They don't have a team_leader_id (unassigned)
        // 2. OR they have a team_leader_id but it's not this leader
        // 3. They are active
        const hasNoLeader = !m.team_leader_id;
        const isNotInThisTeam = m.team_leader_id !== leaderId;
        const isActive = m.is_active !== false;
        
        return (hasNoLeader || isNotInThisTeam) && isActive;
      });
      
      console.log('Available members:', available); // Debug log
      setAvailableMembers(available);
    } else {
      console.error('Failed to fetch members:', allMembersData);
      setAvailableMembers([]);
    }
  } catch (error) {
    console.error('Error fetching leader details:', error);
    setError('Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing && leader) {
      setFormData({
        first_name: leader.first_name || '',
        last_name: leader.last_name || '',
        email: leader.email || '',
        phone: leader.phone || '',
        role: leader.role || 'team_leader'
      });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateLeader = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      const response = await fetch(`/api/employees/${leaderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setLeader(data.employee);
        setIsEditing(false);
        alert('Leader updated successfully!');
        fetchLeaderDetails();
      } else {
        setError(data.message || 'Failed to update leader');
      }
    } catch (error) {
      console.error('Error updating leader:', error);
      setError('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/employees/${leaderId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ password: passwordData.newPassword })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Password updated successfully!');
        setShowPasswordForm(false);
        setPasswordData({ newPassword: '', confirmPassword: '' });
      } else {
        alert(data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddMember = async (memberId) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/employees/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ team_leader_id: leaderId })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setShowAddMember(false);
        alert('Member added successfully!');
        fetchLeaderDetails();
      } else {
        alert(data.message || 'Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/employees/${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ team_leader_id: null })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setShowDeleteDialog(false);
        setSelectedMember(null);
        alert('Member removed successfully!');
        fetchLeaderDetails();
      } else {
        alert(data.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const search = searchTerm.toLowerCase();
    return (
      (member.first_name?.toLowerCase() || '').includes(search) ||
      (member.last_name?.toLowerCase() || '').includes(search) ||
      (member.email?.toLowerCase() || '').includes(search) ||
      (member.phone || '').includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="spinner"></div>
        <p>Loading leader details...</p>
      </div>
    );
  }

  if (!leader) {
    return (
      <div className="detail-error">
        <h2>Team Leader Not Found</h2>
        <button className="btn-back" onClick={onBack}>← Back to Team Leaders</button>
      </div>
    );
  }

  return (
    <div className="team-leader-detail-container">
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${selectedMember?.first_name || ''} ${selectedMember?.last_name || ''} from this team?`}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />

      {/* Header */}
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
        <div className="detail-actions">
          <button 
            className="btn-edit" 
            onClick={handleEditToggle}
            disabled={updating}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
          <button 
            className="btn-password" 
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            disabled={updating}
          >
            Reset Password
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Leader Profile */}
      <div className="leader-profile">
        <div className="profile-avatar-large">
          {leader.first_name?.[0] || ''}{leader.last_name?.[0] || ''}
        </div>
        <div className="profile-info">
          <h2>{leader.first_name || ''} {leader.last_name || ''}</h2>
          <p className="profile-role">{leader.role || 'Team Leader'}</p>
          <div className="profile-meta">
            <span>📧 {leader.email || '-'}</span>
            <span>📱 {leader.phone || '-'}</span>
            <span>👥 {members.length} Team Members</span>
            <span className={`status-badge ${leader.is_active ? 'active' : 'inactive'}`}>
              {leader.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="edit-form-container">
          <h3>Edit Team Leader</h3>
          <form onSubmit={handleUpdateLeader}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={handleEditToggle} disabled={updating}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={updating}>
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Reset Form */}
      {showPasswordForm && (
        <div className="edit-form-container">
          <h3>Reset Password</h3>
          <form onSubmit={handleUpdatePassword}>
            <div className="form-row">
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowPasswordForm(false)} disabled={updating}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={updating}>
                {updating ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Team Members Section */}
      <div className="members-section">
        <div className="members-header">
          <h3>Team Members ({members.length})</h3>
          <div className="members-actions">
            <button 
              className="btn-add-member" 
              onClick={() => setShowAddMember(true)}
              disabled={updating}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Member
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="members-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Members List */}
        {filteredMembers.length === 0 ? (
          <div className="members-empty">
            <p>No team members found</p>
            <button className="btn-add-member" onClick={() => setShowAddMember(true)}>
              Add Member
            </button>
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
                  <th>Registrations</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr key={member.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="member-name">
                        <div className="avatar-small">
                          {member.first_name?.[0] || ''}{member.last_name?.[0] || ''}
                        </div>
                        <span>{member.first_name || ''} {member.last_name || ''}</span>
                      </div>
                    </td>
                    <td>{member.email || '-'}</td>
                    <td>{member.phone || '-'}</td>
                    <td>{member.registration_count || 0}</td>
                    <td>
                      <span className={`status-badge ${member.is_active ? 'active' : 'inactive'}`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-action btn-remove"
                        onClick={() => {
                          setSelectedMember(member);
                          setShowDeleteDialog(true);
                        }}
                        disabled={updating}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="add-member-overlay" onClick={() => setShowAddMember(false)}>
          <div className="add-member-container" onClick={(e) => e.stopPropagation()}>
            <div className="add-member-header">
              <h3>Add Team Member</h3>
              <button className="add-member-close" onClick={() => setShowAddMember(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="add-member-body">
              {availableMembers.length === 0 ? (
                <p className="no-members-available">No available team members to add</p>
              ) : (
                <div className="available-members-list">
                  {availableMembers.map(member => (
                    <div key={member.id} className="available-member-item">
                      <div className="member-info">
                        <div className="avatar-small">
                          {member.first_name?.[0] || ''}{member.last_name?.[0] || ''}
                        </div>
                        <div>
                          <div className="member-name-text">
                            {member.first_name || ''} {member.last_name || ''}
                          </div>
                          <div className="member-email-text">{member.email || ''}</div>
                        </div>
                      </div>
                      <button 
                        className="btn-add-member-item"
                        onClick={() => handleAddMember(member.id)}
                        disabled={updating}
                      >
                        {updating ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeaderDetail;