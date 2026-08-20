import React, { useState, useMemo } from 'react';
import './TeamPerformanceDetail.css';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Improved Icon components
const Icons = {
  GridView: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  ChartBar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  ),
  TrendingUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
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

const TeamPerformanceDetail = ({ teamId, teamData, onBack, user, registrations, employees }) => {
  const [viewType, setViewType] = useState('pivot');
  const [dateFilter, setDateFilter] = useState('month');
  const [downloadLoading, setDownloadLoading] = useState(false);

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
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    return { startDate, endDate };
  }, [dateFilter]);

  const filteredRegistrations = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    return registrations.filter(reg => {
      if (!reg.registration_date) return false;
      const regDate = parseISO(reg.registration_date);
      return isWithinInterval(regDate, { start: startDate, end: endDate });
    });
  }, [registrations, getDateRange]);

  const getTeamMembers = (leaderId) => {
    return employees.filter(emp => emp.team_leader_id === leaderId && emp.role === 'team_member' && emp.is_active !== false);
  };

  const members = getTeamMembers(teamId);
  
  const memberPerformance = useMemo(() => {
    return members.map(member => ({
      ...member,
      registrationCount: filteredRegistrations.filter(reg => 
        reg.sales_employee_id === member.id
      ).length
    })).sort((a, b) => b.registrationCount - a.registrationCount);
  }, [members, filteredRegistrations]);

  // Daily activity for chart
  const dailyActivity = useMemo(() => {
    const { startDate, endDate } = getDateRange;
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = filteredRegistrations.filter(reg => {
        if (!reg.registration_date) return false;
        return format(parseISO(reg.registration_date), 'yyyy-MM-dd') === dayStr;
      }).length;
      return { date: day, count };
    });
  }, [filteredRegistrations, getDateRange]);

  const totalRegistrations = memberPerformance.reduce((sum, m) => sum + m.registrationCount, 0);
  const avgPerMember = members.length > 0 ? totalRegistrations / members.length : 0;

  const downloadPDF = async () => {
    const element = document.getElementById('team-performance-report');
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
      pdf.save(`team-performance-${teamData?.first_name || 'team'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  const renderTooltip = (text) => (
    <Tooltip text={text}>
      <span className="tooltip-trigger">
        <Icons.Info />
      </span>
    </Tooltip>
  );

  return (
      <div className="team-performance-detail" id="team-performance-report">
      {/* Header */}
      <div className="detail-header">
        <button className="back-button" onClick={onBack}>
          <Icons.ArrowLeft />
          Back to Overview
        </button>
        <div className="detail-header-right">
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

      {/* Team Overview */}
      <div className="team-overview">
        <div className="team-profile">
          <div className="team-avatar-large">
            {teamData?.first_name?.[0]}{teamData?.last_name?.[0]}
          </div>
          <div className="team-info">
            <h1>{teamData?.first_name} {teamData?.last_name}</h1>
            <p className="team-role">Team Leader</p>
            <div className="team-meta-details">
              <span>👥 {members.length} Team Members</span>
              <span>📊 {totalRegistrations} Registrations</span>
              <span>📈 {avgPerMember.toFixed(1)} Avg/Member</span>
            </div>
          </div>
        </div>
        <div className="team-quick-stats">
          <div className="quick-stat">
            <span className="qs-value">{totalRegistrations}</span>
            <span className="qs-label">Total Registrations</span>
          </div>
          <div className="quick-stat">
            <span className="qs-value">{members.length}</span>
            <span className="qs-label">Team Members</span>
          </div>
          <div className="quick-stat">
            <span className="qs-value">{avgPerMember.toFixed(1)}</span>
            <span className="qs-label">Avg Per Member</span>
          </div>
          <div className="quick-stat">
            <span className="qs-value">{memberPerformance.filter(m => m.registrationCount > 0).length}</span>
            <span className="qs-label">Active Members</span>
          </div>
        </div>
      </div>

      {/* Filters with Icon-only View Toggle - LARGER ICONS */}
      <div className="detail-filters">
        <div className="filter-group">
          <label>Time Period</label>
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <div className="view-toggle">
          <Tooltip text="Pivot Table">
            <button 
              className={`view-btn ${viewType === 'pivot' ? 'active' : ''}`}
              onClick={() => setViewType('pivot')}
            >
              <Icons.GridView />
            </button>
          </Tooltip>
          <Tooltip text="Chart View ">
            <button 
              className={`view-btn ${viewType === 'chart' ? 'active' : ''}`}
              onClick={() => setViewType('chart')}
            >
              <Icons.ChartBar />
              
            </button>
          </Tooltip>
          <Tooltip text="Calendar View">
            <button 
              className={`view-btn ${viewType === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewType('calendar')}
            >
              <Icons.Calendar />
              
            </button>
          </Tooltip>
          <Tooltip text="Trend View ">
            <button 
              className={`view-btn ${viewType === 'trend' ? 'active' : ''}`}
              onClick={() => setViewType('trend')}
            >
              <Icons.TrendingUp />
              
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="detail-content">
        {/* Pivot View */}
        {viewType === 'pivot' && (
          <div className="pivot-section">
            <div className="section-header">
              <h3>Member Performance Ranking</h3>
              <span className="section-badge">{memberPerformance.length} Members</span>
            </div>
            <div className="pivot-table-container">
              <table className="pivot-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team Member</th>
                    <th>Registrations {renderTooltip('Number of registrations completed by this member')}</th>
                    <th>Performance {renderTooltip('Relative performance compared to the top performer')}</th>
                    <th>Status {renderTooltip('Active if has at least 1 registration')}</th>
                  </tr>
                </thead>
                <tbody>
                  {memberPerformance.map((member, index) => (
                    <tr key={member.id} className={index === 0 ? 'top-performer-row' : ''}>
                      <td>
                        <span className={`rank-number ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}`}>
                          {index + 1}
                        </span>
                      </td>
                      <td>
                        <div className="member-cell">
                          <div className="member-avatar">
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </div>
                          <div>
                            <div className="member-name">{member.first_name} {member.last_name}</div>
                            <div className="member-email">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="reg-count">{member.registrationCount}</td>
                      <td>
                        <div className="performance-bar-container">
                          <div 
                            className="performance-bar-fill"
                            style={{ 
                              width: `${Math.min((member.registrationCount / (memberPerformance[0]?.registrationCount || 1)) * 100, 100)}%`,
                              background: index === 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                            }}
                          />
                          <span className="performance-percent">
                            {Math.round((member.registrationCount / (memberPerformance[0]?.registrationCount || 1)) * 100)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`member-status ${member.registrationCount > 0 ? 'active' : 'inactive'}`}>
                          {member.registrationCount > 0 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chart View */}
        {viewType === 'chart' && (
          <div className="chart-section">
            <div className="section-header">
              <h3>Performance Distribution</h3>
              <span className="section-badge">{totalRegistrations} Total</span>
            </div>
            <div className="chart-container">
              <div className="bar-chart">
                {memberPerformance.map((member, index) => {
                  const maxCount = memberPerformance[0]?.registrationCount || 1;
                  const height = Math.max((member.registrationCount / maxCount) * 200, 10);
                  const percentage = Math.round((member.registrationCount / (memberPerformance[0]?.registrationCount || 1)) * 100);
                  
                  return (
                    <div key={member.id} className="bar-item">
                      <div 
                        className="bar" 
                        style={{ 
                          height: `${height}px`,
                          background: index === 0 ? 'linear-gradient(180deg, #f59e0b, #fbbf24)' : 
                                      index === 1 ? 'linear-gradient(180deg, #3b82f6, #60a5fa)' : 
                                      'linear-gradient(180deg, #8b5cf6, #a78bfa)'
                        }}
                      >
                        <span className="bar-value">{member.registrationCount}</span>
                      </div>
                      <div className="bar-label">
                        <span className="bar-initials">{member.first_name?.[0]}{member.last_name?.[0]}</span>
                        <span className="bar-fullname">{member.first_name} {member.last_name}</span>
                      </div>
                      <div className="bar-percentage">{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {viewType === 'calendar' && (
          <div className="calendar-section">
            <div className="section-header">
              <h3>Activity Calendar</h3>
              <span className="section-badge">{format(getDateRange.startDate, 'MMM dd')} - {format(getDateRange.endDate, 'MMM dd, yyyy')}</span>
            </div>
            <div className="calendar-grid">
              {dailyActivity.map((day, index) => {
                const dayRegistrations = memberPerformance.reduce((sum, member) => {
                  const count = registrations.filter(reg => 
                    reg.sales_employee_id === member.id && 
                    reg.registration_date &&
                    format(parseISO(reg.registration_date), 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd')
                  ).length;
                  return sum + count;
                }, 0);
                
                const isToday = format(day.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                
                return (
                  <div 
                    key={index} 
                    className={`calendar-day ${dayRegistrations > 0 ? 'has-activity' : ''} ${isToday ? 'today' : ''}`}
                    title={dayRegistrations > 0 ? `${dayRegistrations} registration(s) on ${format(day.date, 'MMM dd, yyyy')}` : `No activity on ${format(day.date, 'MMM dd, yyyy')}`}
                  >
                    <span className="cal-day-number">{format(day.date, 'd')}</span>
                    <span className="cal-day-name">{format(day.date, 'EEE')}</span>
                    {dayRegistrations > 0 && (
                      <span className="cal-day-count">{dayRegistrations}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot active"></span>
                <span>With Activity</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot inactive"></span>
                <span>No Activity</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot today"></span>
                <span>Today</span>
              </div>
            </div>
          </div>
        )}

        {/* Trend View */}
        {viewType === 'trend' && (
          <div className="trend-section">
            <div className="section-header">
              <h3>Team Progress Trend</h3>
              <span className="section-badge">{dailyActivity.length} Days</span>
            </div>
            <div className="trend-container">
              <div className="trend-chart">
                {dailyActivity.map((day, index) => {
                  const maxCount = Math.max(...dailyActivity.map(d => d.count), 1);
                  const height = Math.max((day.count / maxCount) * 180, 4);
                  
                  return (
                    <div key={index} className="trend-bar-item">
                      <div 
                        className="trend-bar"
                        style={{ 
                          height: `${height}px`,
                          background: day.count > 0 ? 'linear-gradient(180deg, #dc2626, #f87171)' : '#f0f1f5'
                        }}
                      >
                        {day.count > 0 && <span className="trend-bar-value">{day.count}</span>}
                      </div>
                      <div className="trend-bar-label">
                        <span className="trend-day">{format(day.date, 'd')}</span>
                        <span className="trend-month">{format(day.date, 'MMM')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="trend-summary">
                <div className="trend-stat">
                  <span className="trend-stat-label">Peak Day</span>
                  <span className="trend-stat-value">
                    {dailyActivity.reduce((max, d) => d.count > max.count ? d : max, { count: 0 }).count} registrations
                  </span>
                </div>
                <div className="trend-stat">
                  <span className="trend-stat-label">Average Daily</span>
                  <span className="trend-stat-value">
                    {(dailyActivity.reduce((sum, d) => sum + d.count, 0) / dailyActivity.length).toFixed(1)}
                  </span>
                </div>
                <div className="trend-stat">
                  <span className="trend-stat-label">Total Days</span>
                  <span className="trend-stat-value">{dailyActivity.filter(d => d.count > 0).length} active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPerformanceDetail;