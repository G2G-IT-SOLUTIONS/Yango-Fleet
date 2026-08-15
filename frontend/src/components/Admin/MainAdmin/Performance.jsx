import React, { useState, useEffect, useMemo } from 'react';
import './Performance.css';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import TeamPerformanceDetail from './TeamPerformanceDetail';

// Icon components (keep as is)
const Icons = {
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Trophy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9V3h12v6" />
      <path d="M6 21h12" />
      <path d="M12 15v6" />
      <path d="M8 3v2h8V3" />
      <circle cx="12" cy="12" r="3" />
      <path d="M8 12v1a4 4 0 0 0 8 0v-1" />
    </svg>
  ),
  ChartBar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  ChevronRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
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

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    console.log('📊 Fetching performance data...');
    
    // Fetch ALL registrations using the new performance endpoint
    const regResponse = await fetch('/api/performance/registrations', {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Fetch all employees
    const empResponse = await fetch('/api/employees', {
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!regResponse.ok || !empResponse.ok) {
      throw new Error(`Failed to fetch data`);
    }

    const regData = await regResponse.json();
    const empData = await empResponse.json();

    if (regData.success) {
      setRegistrations(regData.data || []);
      console.log('✅ Registrations loaded:', regData.data?.length);
    } else {
      console.error('Registration API error:', regData.message);
      setRegistrations([]);
    }
    
    if (empData.success) {
      setEmployees(empData.employees || []);
      console.log('✅ Employees loaded:', empData.employees?.length);
    } else {
      console.error('Employee API error:', empData.message);
      setEmployees([]);
    }
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    setError('Failed to load performance data. Please try again.');
    setRegistrations([]);
    setEmployees([]);
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

  // STEP 1: Get all team leaders (employees with role = 'team_leader')
  const teamLeaders = useMemo(() => {
    return employees.filter(emp => emp.role === 'team_leader' && emp.is_active !== false);
  }, [employees]);

  // STEP 2: For each team leader, find their team members (employees with team_leader_id = leader.id)
  // STEP 3: For each team member, count their registrations from the registrations table
  // STEP 4: Sum all registrations for the team
const teamPerformance = useMemo(() => {
  console.log('📊 Calculating team performance...');
  console.log('📊 Team Leaders found:', teamLeaders.length);
  console.log('📊 Total Registrations:', filteredRegistrations.length);
  
  // Log the first registration to see the structure
  if (filteredRegistrations.length > 0) {
    console.log('📊 Sample registration structure:', Object.keys(filteredRegistrations[0]));
    console.log('📊 Sample sales_employee_id:', filteredRegistrations[0].sales_employee_id);
  }
  
  return teamLeaders.map(leader => {
    // Find all team members for this leader
    const members = employees.filter(emp => 
      emp.team_leader_id === leader.id && 
      emp.role === 'team_member' && 
      emp.is_active !== false
    );
    
    console.log(`📊 Leader ${leader.first_name} ${leader.last_name}: ${members.length} members`);
    
    // For each member, count their registrations
    const memberPerformance = members.map(member => {
      // Count registrations where sales_employee_id matches the member's id
      const count = filteredRegistrations.filter(reg => {
        // The registration has sales_employee_id field
        const matches = reg.sales_employee_id === member.id;
        if (matches) {
          console.log(`   ✅ Found registration for ${member.first_name} ${member.last_name}`);
        }
        return matches;
      }).length;
      
      console.log(`   📊 Member ${member.first_name} ${member.last_name}: ${count} registrations`);
      
      return {
        ...member,
        registrationCount: count
      };
    });
    
    // Sort members by performance (highest first)
    const sortedMembers = [...memberPerformance].sort((a, b) => 
      b.registrationCount - a.registrationCount
    );
    
    // Calculate team totals
    const totalRegistrations = memberPerformance.reduce((sum, m) => sum + m.registrationCount, 0);
    const avgPerMember = members.length > 0 ? totalRegistrations / members.length : 0;
    
    console.log(`📊 Team ${leader.first_name} ${leader.last_name}: ${totalRegistrations} total, ${avgPerMember.toFixed(1)} avg`);
    
    return {
      ...leader,
      members,
      memberPerformance: sortedMembers,
      totalRegistrations,
      avgPerMember,
      memberCount: members.length,
      teamId: leader.id,
      efficiencyScore: members.length > 0 ? Math.min((totalRegistrations / (members.length * 10)) * 100, 100) : 0
    };
  });
}, [teamLeaders, employees, filteredRegistrations]);

  // Sort teams by performance
  const sortedTeams = useMemo(() => {
    return [...teamPerformance].sort((a, b) => 
      b.totalRegistrations - a.totalRegistrations
    );
  }, [teamPerformance]);

  const topTeam = sortedTeams.length > 0 ? sortedTeams[0] : null;
  const totalRegistrations = filteredRegistrations.length;
  const totalMembers = employees.filter(e => e.role === 'team_member' && e.is_active !== false).length;

  console.log('📊 Top team:', topTeam?.first_name, topTeam?.last_name, '-', topTeam?.totalRegistrations, 'registrations');
  console.log('📊 Total registrations:', totalRegistrations);

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

  if (registrations.length === 0 || employees.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>No Data Available</h3>
        <p>Please register some cars and drivers to see performance data.</p>
        <button className="btn-retry" onClick={fetchData}>Refresh Data</button>
      </div>
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
        <div className="summary-card">
          <div className="summary-icon"><Icons.TrendingUp /></div>
          <div className="summary-content">
            <span className="summary-label">Avg Per Team</span>
            <span className="summary-value">
              {teamLeaders.length > 0 ? (totalRegistrations / teamLeaders.length).toFixed(1) : '0'}
            </span>
            <span className="summary-period">registrations</span>
          </div>
        </div>
      </div>

      {/* Filters */}
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
      </div>

      {/* Top Performer */}
      {topTeam && topTeam.totalRegistrations > 0 && (
        <div className="top-performer-section">
          <div className="top-performer-banner">
            <div className="banner-icon"><Icons.Trophy /></div>
            <div className="banner-content">
              <h3>Leading Team</h3>
              <p className="banner-team">{topTeam.first_name} {topTeam.last_name}</p>
              <div className="banner-stats">
                <span>{topTeam.totalRegistrations} registrations</span>
                <span>•</span>
                <span>{topTeam.memberCount} members</span>
                <span>•</span>
                <span>{topTeam.avgPerMember.toFixed(1)} avg per member</span>
              </div>
            </div>
            <div className="banner-efficiency">
              <div className="efficiency-ring">
                <svg viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="25" fill="none" stroke="#e8e9f0" strokeWidth="4"/>
                  <circle 
                    cx="30" 
                    cy="30" 
                    r="25" 
                    fill="none" 
                    stroke="#dc2626" 
                    strokeWidth="4"
                    strokeDasharray="157.08"
                    strokeDashoffset={157.08 - (topTeam.efficiencyScore / 100) * 157.08}
                    transform="rotate(-90 30 30)"
                  />
                </svg>
                <span className="efficiency-value">{Math.round(topTeam.efficiencyScore)}%</span>
              </div>
              <span className="efficiency-label">Efficiency</span>
            </div>
          </div>
        </div>
      )}

      {/* Team Performance Cards */}
      <div className="team-performance-section">
        <h2 className="section-title">Team Performance Overview</h2>
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
                    <span className="stat-label">Registrations</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{team.memberCount}</span>
                    <span className="stat-label">Members</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{team.avgPerMember.toFixed(1)}</span>
                    <span className="stat-label">Avg/Member</span>
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
                        background: `linear-gradient(90deg, ${sortedTeams.indexOf(team) === 0 ? '#dc2626' : sortedTeams.indexOf(team) === 1 ? '#f59e0b' : '#3b82f6'}, ${sortedTeams.indexOf(team) === 0 ? '#f87171' : sortedTeams.indexOf(team) === 1 ? '#fbbf24' : '#60a5fa'})`
                      }}
                    />
                  </div>
                </div>
                <div className="team-card-footer">
                  <span className="view-details">View Team Analytics <Icons.ChevronRight /></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Analytics Section */}
      <div className="analytics-section">
        <div className="analytics-header">
          <h3>Performance Distribution</h3>
          <div className="analytics-actions">
            <button className="analytics-btn active">
              <Icons.ChartBar />
            </button>
            <button className="analytics-btn">
              <Icons.TrendingUp />
            </button>
            <button className="analytics-btn">
              <Icons.Calendar />
            </button>
          </div>
        </div>
        <div className="analytics-content">
          <div className="analytics-table-container">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team Leader</th>
                  <th>Members</th>
                  <th>Registrations</th>
                  <th>Avg/Member</th>
                  <th>Efficiency</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map((team, index) => (
                  <tr key={team.teamId} className={index === 0 ? 'highlight-row' : ''}>
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
                    <td className="reg-count">{team.totalRegistrations}</td>
                    <td>{team.avgPerMember.toFixed(1)}</td>
                    <td>
                      <div className="efficiency-bar">
                        <div 
                          className="efficiency-bar-fill"
                          style={{ 
                            width: `${Math.min(team.efficiencyScore, 100)}%`,
                            background: team.efficiencyScore > 70 ? '#10b981' : team.efficiencyScore > 40 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="efficiency-text">{Math.round(team.efficiencyScore)}%</span>
                    </td>
                    <td>
                      <span className={`trend-indicator ${index === 0 ? 'up' : index < 3 ? 'stable' : 'down'}`}>
                        {index === 0 ? '↑' : index < 3 ? '→' : '↓'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;