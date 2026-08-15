import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './SeeRegistered.css';

const SeeRegistered = ({ user }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // list, calendar, chart
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showReports, setShowReports] = useState(false);
  const [reportType, setReportType] = useState('monthly');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      // Filter by logged-in user's employee ID
      const employeeId = user?.id;
      const response = await fetch(`/api/registrations?employee_id=${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRegistrations(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    let result = [...registrations];

    // Status filter
    if (filter !== 'all') {
      result = result.filter(r => r.status === filter);
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(r => 
        r.brand?.toLowerCase().includes(term) ||
        r.model?.toLowerCase().includes(term) ||
        r.driver_first_name?.toLowerCase().includes(term) ||
        r.driver_last_name?.toLowerCase().includes(term) ||
        r.license_plate_number?.toLowerCase().includes(term) ||
        r.license_number?.toLowerCase().includes(term)
      );
    }

    // Date range filter
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59);
      
      result = result.filter(r => {
        const regDate = new Date(r.registration_date);
        return regDate >= start && regDate <= end;
      });
    }

    return result;
  }, [registrations, filter, searchTerm, dateRange]);

  // Get calendar data
  const getCalendarData = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return days.map(day => {
      const dayRegistrations = filteredRegistrations.filter(r => 
        isSameDay(parseISO(r.registration_date), day)
      );
      return {
        date: day,
        count: dayRegistrations.length,
        registrations: dayRegistrations
      };
    });
  };

  // Chart data
  const getChartData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = {};
    
    filteredRegistrations.forEach(r => {
      const month = format(parseISO(r.registration_date), 'MMM');
      if (!data[month]) data[month] = 0;
      data[month]++;
    });

    return monthNames.map(month => ({
      month,
      registrations: data[month] || 0
    }));
  };

  const getStatusChartData = () => {
    const statusCount = {};
    filteredRegistrations.forEach(r => {
      if (!statusCount[r.status]) statusCount[r.status] = 0;
      statusCount[r.status]++;
    });
    return Object.keys(statusCount).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: statusCount[key]
    }));
  };

  const getPerformanceData = () => {
    const dailyData = {};
    filteredRegistrations.forEach(r => {
      const date = format(parseISO(r.registration_date), 'yyyy-MM-dd');
      if (!dailyData[date]) dailyData[date] = 0;
      dailyData[date]++;
    });
    return Object.keys(dailyData).map(date => ({
      date,
      count: dailyData[date]
    })).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getEmployeePerformance = () => {
    const employeeData = {};
    filteredRegistrations.forEach(r => {
      const name = `${r.employee_first_name} ${r.employee_last_name}`;
      if (!employeeData[name]) employeeData[name] = 0;
      employeeData[name]++;
    });
    return Object.keys(employeeData).map(name => ({
      name,
      count: employeeData[name]
    })).sort((a, b) => b.count - a.count);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const COLORS = ['#dc2626', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  const downloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

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
      pdf.save(`registration-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Loading registrations...</p>
        </div>
      );
    }

    if (filteredRegistrations.length === 0) {
      return (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h3>No Registrations Found</h3>
          <p>Start by registering a new customer</p>
        </div>
      );
    }

    switch (viewMode) {
      case 'calendar':
        return renderCalendarView();
      case 'chart':
        return renderChartView();
      default:
        return renderListView();
    }
  };

  const renderListView = () => (
    <div className="registrations-grid">
      {filteredRegistrations.map((reg) => (
        <div key={reg.id} className="registration-card">
          <div className="card-header">
            <div className="card-info">
              <h4>{reg.brand} {reg.model}</h4>
              <span className="plate">{reg.license_plate_number}</span>
            </div>
            <span className={`status-badge ${getStatusColor(reg.status)}`}>
              {reg.status}
            </span>
          </div>
          <div className="card-body">
            <div className="driver-info">
              <span className="label">Driver:</span>
              <span className="value">{reg.driver_first_name} {reg.driver_last_name}</span>
            </div>
            <div className="driver-info">
              <span className="label">Registered By:</span>
              <span className="value">{reg.employee_first_name} {reg.employee_last_name}</span>
            </div>
            <div className="driver-info">
              <span className="label">Date:</span>
              <span className="value">{format(parseISO(reg.registration_date), 'PPP')}</span>
            </div>
            <div className="driver-info">
              <span className="label">License:</span>
              <span className="value">{reg.license_number || '-'}</span>
            </div>
            <div className="driver-info">
              <span className="label">Yango Synced:</span>
              <span className={`value ${reg.yango_synced ? 'synced' : 'not-synced'}`}>
                {reg.yango_synced ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCalendarView = () => {
    const calendarData = getCalendarData();
    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}>
            ←
          </button>
          <h3>{format(selectedDate, 'MMMM yyyy')}</h3>
          <button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}>
            →
          </button>
        </div>
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {calendarData.map((day, index) => (
            <div 
              key={index} 
              className={`calendar-day ${day.count > 0 ? 'has-event' : ''}`}
            >
              <span className="day-number">{format(day.date, 'd')}</span>
              {day.count > 0 && (
                <span className="day-count">{day.count}</span>
              )}
            </div>
          ))}
        </div>
        <div className="calendar-stats">
          <p>Total: {filteredRegistrations.length} registrations this month</p>
        </div>
      </div>
    );
  };

  const renderChartView = () => {
    const chartData = getChartData();
    const statusData = getStatusChartData();
    const performanceData = getPerformanceData();
    const employeePerformance = getEmployeePerformance();

    return (
      <div className="chart-view">
        <div className="chart-grid">
          <div className="chart-card">
            <h4>Monthly Registrations</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="registrations" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>Status Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card full-width">
            <h4>Daily Performance Trend</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#dc2626" fill="#fca5a5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card full-width">
            <h4>Employee Performance</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="see-registered-container">
      <div className="registered-header">
        <div className="header-top">
          <div>
            <h1 className="page-title">Registered Customers</h1>
            <p className="page-subtitle">View and manage all customer registrations</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-report" 
              onClick={() => setShowReports(!showReports)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v16h16" />
                <polyline points="4 15 9 9 13 13 21 4" />
              </svg>
              Reports
            </button>
            {showReports && (
              <button className="btn-download" onClick={downloadPDF}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by car, driver, plate, or license..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${filter === 'failed' ? 'active' : ''}`}
            onClick={() => setFilter('failed')}
          >
            Failed
          </button>
        </div>

        <div className="date-range">
          <label>
            From:
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            />
          </label>
          <label>
            To:
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            />
          </label>
          <button 
            className="btn-clear-dates"
            onClick={() => setDateRange({
              startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
              endDate: format(new Date(), 'yyyy-MM-dd')
            })}
          >
            Clear
          </button>
        </div>

        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
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
            className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <button 
            className={`view-btn ${viewMode === 'chart' ? 'active' : ''}`}
            onClick={() => setViewMode('chart')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20V14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Total Registrations</span>
          <span className="stat-value">{filteredRegistrations.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{filteredRegistrations.filter(r => r.status === 'completed').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{filteredRegistrations.filter(r => r.status === 'pending').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Yango Synced</span>
          <span className="stat-value">{filteredRegistrations.filter(r => r.yango_synced).length}</span>
        </div>
      </div>

      {/* Report Content */}
      {showReports && (
        <div id="report-content" className="report-content">
          <div className="report-header">
            <h2>Registration Report</h2>
            <p>Generated: {format(new Date(), 'PPPpp')}</p>
            <p>Period: {dateRange.startDate} to {dateRange.endDate}</p>
          </div>
          <div className="report-stats">
            <div className="report-stat">
              <span>Total Registrations</span>
              <strong>{filteredRegistrations.length}</strong>
            </div>
            <div className="report-stat">
              <span>Completed</span>
              <strong>{filteredRegistrations.filter(r => r.status === 'completed').length}</strong>
            </div>
            <div className="report-stat">
              <span>Pending</span>
              <strong>{filteredRegistrations.filter(r => r.status === 'pending').length}</strong>
            </div>
            <div className="report-stat">
              <span>Failed</span>
              <strong>{filteredRegistrations.filter(r => r.status === 'failed').length}</strong>
            </div>
          </div>
          <div className="report-charts">
            <div className="report-chart">
              <h4>Monthly Registrations</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="registrations" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="report-chart">
              <h4>Status Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getStatusChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getStatusChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default SeeRegistered;