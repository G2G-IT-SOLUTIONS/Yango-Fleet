
import React, { useState, useEffect, useMemo } from 'react';
import './Performance.css';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import TeamPerformanceDetail from './TeamPerformanceDetail';

// Icon components - Fixed and improved
const Icons = {
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Trophy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V3h12v6" />
      <path d="M6 21h12" />
      <path d="M12 15v6" />
      <path d="M8 3v2h8V3" />
      <circle cx="12" cy="12" r="3" />
      <path d="M8 12v1a4 4 0 0 0 8 0v-1" />
    </svg>
  ),
  ChartBar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  GridView: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  ListView: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
};

// Tooltip component
const Tooltip = ({ children, text }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div 
      className="tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && <span className="tooltip-text">{text}</span>}
    </div>
  );
};

const Performance = ({ user }) => {
  const [registrations, setRegistrations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [dateFilter, setDateFilter] = useState('month');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showTeamDetail, setShowTeamDetail] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'cards' or 'table'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📊 Fetching performance data...');
      
      const regResponse = await fetch('/api/performance/registrations', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const empResponse = await fetch('/api/employees', {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!regResponse.ok || !empResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const regData = await regResponse.json();
      const empData = await empResponse.json();

      if (regData.success) {
        setRegistrations(regData.data || []);
      }
      
      if (empData.success) {
        setEmployees(empData.employees || []);
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      setError('Failed to load performance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get date range
  const getDateRange = useMemo(() => {
    const now = new Date();
    let startDate, endDate;

    switch (dateFilter) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterMonth, 1);
        endDate = new Date(now.getFullYear(), quarterMonth + 3, 0);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    return { startDate, endDate };
  }, [dateFilter]);

  // Filter registrations by date
  const filteredRegistrations = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    return registrations.filter(reg => {
      if (!reg.registration_date) return false;
      try {
        const regDate = parseISO(reg.registration_date);
        return isWithinInterval(regDate, { start: startDate, end: endDate });
      } catch (e) {
        return false;
      }
    });
  }, [registrations, getDateRange]);

  // Get team leaders
  const teamLeaders = useMemo(() => {
    return employees.filter(emp => emp.role === 'team_leader' && emp.is_active !== false);
  }, [employees]);

  // Calculate team performance - UPDATED: includes team leader registrations
  const teamPerformance = useMemo(() => {
    return teamLeaders.map(leader => {
      // Get team members (excluding the leader)
      const members = employees.filter(emp => 
        emp.team_leader_id === leader.id && 
        emp.role === 'team_member' && 
        emp.is_active !== false
      );
      
      // Calculate registrations for each member
      const memberPerformance = members.map(member => {
        const count = filteredRegistrations.filter(reg => 
          reg.sales_employee_id === member.id
        ).length;
        return { ...member, registrationCount: count };
      });
      
      // Calculate registrations for the team leader
      const leaderRegistrationCount = filteredRegistrations.filter(reg => 
        reg.sales_employee_id === leader.id
      ).length;
      
      const sortedMembers = [...memberPerformance].sort((a, b) => 
        b.registrationCount - a.registrationCount
      );
      
      // Total registrations = leader's registrations + members' registrations
      const totalRegistrations = memberPerformance.reduce((sum, m) => sum + m.registrationCount, 0) + leaderRegistrationCount;
      
      return {
        ...leader,
        members,
        memberPerformance: sortedMembers,
        totalRegistrations,
        leaderRegistrationCount,
        memberCount: members.length,
        teamId: leader.id,
        activeMembers: memberPerformance.filter(m => m.registrationCount > 0).length
      };
    });
  }, [teamLeaders, employees, filteredRegistrations]);

  // Sort teams by total registrations (highest first)
  const sortedTeams = useMemo(() => {
    return [...teamPerformance].sort((a, b) => 
      b.totalRegistrations - a.totalRegistrations
    );
  }, [teamPerformance]);

  const topTeam = sortedTeams.length > 0 ? sortedTeams[0] : null;
  const totalRegistrations = filteredRegistrations.length;
  const totalMembers = employees.filter(e => e.role === 'team_member' && e.is_active !== false).length;

  const handleTeamClick = (teamId) => {
    setSelectedTeamId(teamId);
    setShowTeamDetail(true);
  };

  const handleBack = () => {
    setShowTeamDetail(false);
    setSelectedTeamId(null);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('performance-report');
    if (!element) return;

    setDownloadLoading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`performance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <h3>{error}</h3>
        <button className="btn-retry" onClick={fetchData}>Retry</button>
      </div>
    );
  }

  if (showTeamDetail && selectedTeamId) {
    const team = teamPerformance.find(t => t.teamId === selectedTeamId);
    return (
      <TeamPerformanceDetail 
        teamId={selectedTeamId}
        teamData={team}
        onBack={handleBack}
        user={user}
        registrations={registrations}
        employees={employees}
      />
    );
  }

  return (
    <div className="performance-container" id="performance-report">
      {/* Header */}
      <div className="performance-header">
        <div className="header-top">
          <div>
            <h1 className="page-title">Performance Analytics</h1>
            <p className="page-subtitle">Enterprise-wide team performance monitoring and analysis</p>
          </div>
          <div className="header-actions">
            <button className="btn-download" onClick={downloadPDF} disabled={downloadLoading}>
              {downloadLoading ? (
                <span className="spinner-small"></span>
              ) : (
                <>
                  <Icons.Download />
                  Export Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="executive-summary">
        <div className="summary-card primary">
          <div className="summary-icon"><Icons.Trophy /></div>
          <div className="summary-content">
            <span className="summary-label">Total Registrations</span>
            <span className="summary-value">{totalRegistrations}</span>
            <span className="summary-period">{dateFilter}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><Icons.Users /></div>
          <div className="summary-content">
            <span className="summary-label">Active Teams</span>
            <span className="summary-value">{teamLeaders.length}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><Icons.Users /></div>
          <div className="summary-content">
            <span className="summary-label">Team Members</span>
            <span className="summary-value">{totalMembers}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><Icons.Trophy /></div>
          <div className="summary-content">
            <span className="summary-label">Top Team</span>
            <span className="summary-value">{topTeam ? `${topTeam.first_name} ${topTeam.last_name}` : 'N/A'}</span>
            <span className="summary-period">{topTeam ? `${topTeam.totalRegistrations} registrations` : ''}</span>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Time Period</label>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div className="date-range-display">
          {format(getDateRange.startDate, 'MMM dd, yyyy')} - {format(getDateRange.endDate, 'MMM dd, yyyy')}
        </div>
        <div className="view-toggle-group">
          <Tooltip text="Card View">
            <button 
              className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              <Icons.GridView />
            </button>
          </Tooltip>
          <Tooltip text="Table View">
            <button 
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <Icons.ListView />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Team Performance */}
      <div className="team-performance-section">
        <h2 className="section-title">Team Performance Overview</h2>
        
        {viewMode === 'cards' ? (
          <div className="team-cards-grid">
            {sortedTeams.map((team) => (
              <div 
                key={team.teamId} 
                className="team-card"
                onClick={() => handleTeamClick(team.teamId)}
              >
                <div className="team-card-header">
                  <div className="team-card-rank">
                    #{sortedTeams.indexOf(team) + 1}
                  </div>
                  <div className="team-card-leader">
                    <div className="leader-avatar">
                      {team.first_name?.[0]}{team.last_name?.[0]}
                    </div>
                    <div>
                      <h4 className="leader-name">{team.first_name} {team.last_name}</h4>
                      <span className="leader-role">Team Leader</span>
                    </div>
                  </div>
                </div>
                <div className="team-card-body">
                  <div className="team-stats">
                    <div className="stat-item">
                      <span className="stat-value">{team.totalRegistrations}</span>
                      <span className="stat-label">Total Registrations</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{team.memberCount}</span>
                      <span className="stat-label">Members</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{team.leaderRegistrationCount}</span>
                      <span className="stat-label">Leader Regs</span>
                    </div>
                  </div>
                  <div className="team-progress-container">
                    <div className="team-progress-label">
                      <span>Performance</span>
                      <span>{Math.round((team.totalRegistrations / (topTeam?.totalRegistrations || 1)) * 100)}%</span>
                    </div>
                    <div className="team-progress-track">
                      <div 
                        className="team-progress-fill"
                        style={{ 
                          width: `${Math.min((team.totalRegistrations / (topTeam?.totalRegistrations || 1)) * 100, 100)}%`,
                          background: sortedTeams.indexOf(team) === 0 
                            ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' 
                            : 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                        }}
                      />
                    </div>
                  </div>
                  <div className="team-card-footer">
                    <span className="view-details">
                      View Team Analytics 
                      <span className="arrow-icon"><Icons.ArrowRight /></span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-view-container">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team Leader</th>
                  <th>Members</th>
                  <th>Leader Regs</th>
                  <th>Total Regs</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, index) => (
                  <tr 
                    key={team.teamId} 
                    className={index === 0 ? 'highlight-row' : ''}
                    onClick={() => handleTeamClick(team.teamId)}
                  >
                    <td>
                      <span className={`rank-badge ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td>
                      <div className="analyst-name">
                        <div className="analyst-avatar-small">
                          {team.first_name?.[0]}{team.last_name?.[0]}
                        </div>
                        {team.first_name} {team.last_name}
                      </div>
                    </td>
                    <td>{team.memberCount}</td>
                    <td className="reg-count">{team.leaderRegistrationCount}</td>
                    <td className="reg-count">{team.totalRegistrations}</td>
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

export default Performance;