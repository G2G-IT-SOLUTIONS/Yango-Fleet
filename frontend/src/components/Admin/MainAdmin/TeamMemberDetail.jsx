import React, { useState, useEffect } from 'react';
import './TeamMemberDetail.css';
import ConfirmationDialog from '../ConfirmationDialog';

const TeamMemberDetail = ({ memberId, onBack, user }) => {
  const [member, setMember] = useState(null);
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'team_member',
    team_leader_id: ''
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchMemberDetails();
  }, [memberId]);
const memberPerformance = useMemo(() => {
  return members.map(member => ({
    ...member,
    registrationCount: filteredRegistrations.filter(reg => 
      // Use sales_employee_id which is the correct field from the API
      reg.sales_employee_id === member.id
    ).length
  })).sort((a, b) => b.registrationCount - a.registrationCount);
}, [members, filteredRegistrations]);
  const fetchMemberDetails = async () => {
    setLoading(true);
    try {
      // Fetch member details
      const memberResponse = await fetch(`/api/employees/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const memberData = await memberResponse.json();
      if (memberData.success) {
        setMember(memberData.employee);
        setFormData({
          first_name: memberData.employee.first_name || '',
          last_name: memberData.employee.last_name || '',
          email: memberData.employee.email || '',
          phone: memberData.employee.phone || '',
          role: memberData.employee.role || 'team_member',
          team_leader_id: memberData.employee.team_leader_id || ''
        });
      }

      // Fetch team leaders
      const leadersResponse = await fetch('/api/employees?role=team_leader', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const leadersData = await leadersResponse.json();
      if (leadersData.success) {
        setTeamLeaders(leadersData.employees || []);
      }

      // Fetch member's registrations
      const registrationsResponse = await fetch(`/api/registrations?employee_id=${memberId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const registrationsData = await registrationsResponse.json();
      if (registrationsData.success) {
        setRegistrations(registrationsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setFormData({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || 'team_member',
        team_leader_id: member.team_leader_id || ''
      });
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/employees/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setMember(data.employee);
        setIsEditing(false);
        fetchMemberDetails();
      } else {
        alert(data.message || 'Failed to update member');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`/api/employees/${memberId}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ password: passwordData.newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        alert('Password reset successfully');
        setShowPasswordForm(false);
        setPasswordData({ newPassword: '', confirmPassword: '' });
      } else {
        alert(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Network error. Please try again.');
    }
  };

  const getFilteredRegistrations = () => {
    let filtered = [...registrations];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.brand?.toLowerCase().includes(search) ||
        r.model?.toLowerCase().includes(search) ||
        r.driver_first_name?.toLowerCase().includes(search) ||
        r.driver_last_name?.toLowerCase().includes(search) ||
        r.license_plate_number?.toLowerCase().includes(search)
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(r => new Date(r.registration_date) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(filterDate.getDate() - 7);
          filtered = filtered.filter(r => new Date(r.registration_date) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(filterDate.getMonth() - 1);
          filtered = filtered.filter(r => new Date(r.registration_date) >= filterDate);
          break;
        case 'year':
          filterDate.setFullYear(filterDate.getFullYear() - 1);
          filtered = filtered.filter(r => new Date(r.registration_date) >= filterDate);
          break;
        default:
          break;
      }
    }

    return filtered;
  };

  const getPerformanceStats = () => {
    const total = registrations.length;
    const completed = registrations.filter(r => r.status === 'completed').length;
    const pending = registrations.filter(r => r.status === 'pending').length;
    const failed = registrations.filter(r => r.status === 'failed').length;
    return { total, completed, pending, failed };
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="spinner"></div>
        <p>Loading member details...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="detail-error">
        <h2>Team Member Not Found</h2>
        <button className="btn-back" onClick={onBack}>← Back to Team Members</button>
      </div>
    );
  }

  const stats = getPerformanceStats();
  const filteredRegistrations = getFilteredRegistrations();

  return (
    <div className="team-member-detail-container">
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
          <button className="btn-edit" onClick={handleEditToggle}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
          <button className="btn-password" onClick={() => setShowPasswordForm(!showPasswordForm)}>
            Reset Password
          </button>
        </div>
      </div>

      {/* Member Profile */}
      <div className="member-profile">
        <div className="profile-avatar-large">
          {member.first_name?.[0]}{member.last_name?.[0]}
        </div>
        <div className="profile-info">
          <h2>{member.first_name} {member.last_name}</h2>
          <p className="profile-role">{member.role}</p>
          <div className="profile-meta">
            <span>📧 {member.email}</span>
            <span>📱 {member.phone}</span>
            <span>👤 Team Leader: {member.team_leader_first_name || 'Unassigned'}</span>
            <span className={`status-badge ${member.is_active ? 'active' : 'inactive'}`}>
              {member.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="edit-form-container">
          <h3>Edit Team Member</h3>
          <form onSubmit={handleUpdateMember}>
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
            <div className="form-group">
              <label>Team Leader</label>
              <select
                name="team_leader_id"
                value={formData.team_leader_id}
                onChange={handleFormChange}
              >
                <option value="">Select Team Leader</option>
                {teamLeaders.map(leader => (
                  <option key={leader.id} value={leader.id}>
                    {leader.first_name} {leader.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={handleEditToggle}>
                Cancel
              </button>
              <button type="submit" className="btn-save">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Reset Form */}
      {showPasswordForm && (
        <div className="edit-form-container">
          <h3>Reset Password</h3>
          <form onSubmit={handleResetPassword}>
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
              <button type="button" className="btn-cancel" onClick={() => setShowPasswordForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-save">
                Reset Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Performance Stats */}
      <div className="performance-stats">
        <h3>Performance Overview</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Registrations</span>
          </div>
          <div className="stat-card success">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card warning">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card danger">
            <span className="stat-number">{stats.failed}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
      </div>

      {/* Registrations */}
      <div className="registrations-section">
        <div className="registrations-header">
          <h3>Registrations</h3>
        </div>

        {/* Filters */}
        <div className="registrations-filters">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search registrations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="date-filter">
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="registrations-empty">
            <p>No registrations found</p>
          </div>
        ) : (
          <div className="registrations-table-container">
            <table className="registrations-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Car</th>
                  <th>Driver</th>
                  <th>Plate</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg, index) => (
                  <tr key={reg.id}>
                    <td>{index + 1}</td>
                    <td>{reg.brand} {reg.model}</td>
                    <td>{reg.driver_first_name} {reg.driver_last_name}</td>
                    <td>{reg.license_plate_number}</td>
                    <td>{new Date(reg.registration_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${reg.status}`}>
                        {reg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamMemberDetail;