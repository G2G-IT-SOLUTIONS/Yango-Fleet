import React, { useState, useEffect, useMemo } from 'react';
import './RegisteredDrivers.css';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

const RegisteredDrivers = ({ user }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    licenseCountry: 'all',
    dateRange: 'all',
    syncStatus: 'all',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setDrivers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter drivers
  const filteredDrivers = useMemo(() => {
    let result = [...drivers];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(driver =>
        driver.first_name?.toLowerCase().includes(search) ||
        driver.last_name?.toLowerCase().includes(search) ||
        driver.phone?.includes(search) ||
        driver.email?.toLowerCase().includes(search) ||
        driver.license_number?.toLowerCase().includes(search) ||
        driver.address?.toLowerCase().includes(search)
      );
    }

    // License country filter
    if (filters.licenseCountry !== 'all') {
      result = result.filter(driver => driver.license_country === filters.licenseCountry);
    }

    // Sync status filter
    if (filters.syncStatus !== 'all') {
      const isSynced = filters.syncStatus === 'synced';
      result = result.filter(driver => driver.yango_synced === isSynced);
    }

    // Date range filter
    if (filters.dateRange !== 'all' && filters.dateRange !== 'custom') {
      const now = new Date();
      let startDate, endDate;

      switch (filters.dateRange) {
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
        case 'year':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        default:
          startDate = null;
          endDate = null;
      }

      if (startDate && endDate) {
        result = result.filter(driver => {
          const createdDate = parseISO(driver.created_at);
          return isWithinInterval(createdDate, { start: startDate, end: endDate });
        });
      }
    }

    // Custom date range
    if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59);
      
      result = result.filter(driver => {
        const createdDate = parseISO(driver.created_at);
        return createdDate >= start && createdDate <= end;
      });
    }

    return result;
  }, [drivers, searchTerm, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDriverClick = (driver) => {
    setSelectedDriver(driver);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedDriver(null);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), 'PPP');
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return format(parseISO(date), 'PPP p');
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading registered drivers...</p>
      </div>
    );
  }

  return (
    <div className="registered-drivers-container">
      {/* Header */}
      <div className="drivers-header">
        <div className="header-top">
          <div>
            <h1 className="page-title">Registered Drivers</h1>
            <p className="page-subtitle">View and manage all registered drivers in the fleet</p>
          </div>
          <div className="header-stats">
            <span className="stat-badge">
              Total: {drivers.length}
            </span>
            <span className="stat-badge synced">
              Synced: {drivers.filter(d => d.yango_synced).length}
            </span>
            <span className="stat-badge not-synced">
              Not Synced: {drivers.filter(d => !d.yango_synced).length}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="drivers-stats">
        <div className="stat-card">
          <span className="stat-number">{drivers.length}</span>
          <span className="stat-label">Total Drivers</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{drivers.filter(d => d.license_expiry_date && new Date(d.license_expiry_date) > new Date()).length}</span>
          <span className="stat-label">Valid License</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{drivers.filter(d => d.license_expiry_date && new Date(d.license_expiry_date) < new Date()).length}</span>
          <span className="stat-label">Expired License</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{drivers.filter(d => d.yango_synced).length}</span>
          <span className="stat-label">Yango Synced</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        {/* Search */}
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, phone, email, license, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="filter-row">
          <div className="filter-group">
            <label>License Country</label>
            <select
              value={filters.licenseCountry}
              onChange={(e) => handleFilterChange('licenseCountry', e.target.value)}
            >
              <option value="all">All Countries</option>
              <option value="eth">Ethiopia</option>
              <option value="usa">USA</option>
              <option value="uk">UK</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Yango Sync</label>
            <select
              value={filters.syncStatus}
              onChange={(e) => handleFilterChange('syncStatus', e.target.value)}
            >
              <option value="all">All</option>
              <option value="synced">Synced</option>
              <option value="not-synced">Not Synced</option>
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div className="filter-row date-filters">
          <div className="filter-group">
            <label>Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {filters.dateRange === 'custom' && (
            <>
              <div className="filter-group">
                <label>From</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>To</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <button
                className="btn-apply-dates"
                onClick={() => setFilters(prev => ({ ...prev, dateRange: 'custom' }))}
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        Showing {filteredDrivers.length} of {drivers.length} drivers
      </div>

      {/* Drivers List */}
      {filteredDrivers.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h3>No Drivers Found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="drivers-table-container">
          <table className="drivers-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>License</th>
                <th>Age</th>
                <th>License Status</th>
                <th>Yango Sync</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver, index) => {
                const isLicenseValid = driver.license_expiry_date && new Date(driver.license_expiry_date) > new Date();
                return (
                  <tr key={driver.id} className="clickable-row" onClick={() => handleDriverClick(driver)}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="driver-name">
                        <div className="avatar-small">
                          {driver.first_name?.[0] || ''}{driver.last_name?.[0] || ''}
                        </div>
                        <div>
                          <div className="driver-fullname">{driver.first_name} {driver.last_name}</div>
                          {driver.middle_name && <div className="driver-middle">{driver.middle_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{driver.phone || '-'}</td>
                    <td>{driver.email || '-'}</td>
                    <td>
                      <div className="license-info">
                        <span className="license-number">{driver.license_number || '-'}</span>
                        <span className="license-country">{driver.license_country?.toUpperCase() || '-'}</span>
                      </div>
                    </td>
                    <td>{calculateAge(driver.birth_date)}</td>
                    <td>
                      <span className={`license-status-badge ${isLicenseValid ? 'valid' : 'expired'}`}>
                        {isLicenseValid ? '✅ Valid' : '❌ Expired'}
                      </span>
                    </td>
                    <td>
                      <span className={`sync-badge ${driver.yango_synced ? 'synced' : 'not-synced'}`}>
                        {driver.yango_synced ? '✅ Synced' : '❌ Not Synced'}
                      </span>
                    </td>
                    <td>{formatDate(driver.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Driver Detail Modal */}
      {showDetail && selectedDriver && (
        <div className="driver-detail-overlay" onClick={closeDetail}>
          <div className="driver-detail-container" onClick={(e) => e.stopPropagation()}>
            <div className="driver-detail-header">
              <h2>Driver Details</h2>
              <button className="driver-detail-close" onClick={closeDetail}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="driver-detail-body">
              {/* Personal Information */}
              <div className="detail-section">
                <div className="detail-profile-header">
                  <div className="detail-avatar-large">
                    {selectedDriver.first_name?.[0] || ''}{selectedDriver.last_name?.[0] || ''}
                  </div>
                  <div>
                    <h3>{selectedDriver.first_name} {selectedDriver.middle_name ? selectedDriver.middle_name + ' ' : ''}{selectedDriver.last_name}</h3>
                    <span className={`license-status-badge ${selectedDriver.license_expiry_date && new Date(selectedDriver.license_expiry_date) > new Date() ? 'valid' : 'expired'}`}>
                      {selectedDriver.license_expiry_date && new Date(selectedDriver.license_expiry_date) > new Date() ? '✅ Valid License' : '❌ Expired License'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Contact Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{selectedDriver.phone || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{selectedDriver.email || '-'}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">{selectedDriver.address || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Birth Date</span>
                    <span className="detail-value">{formatDate(selectedDriver.birth_date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Age</span>
                    <span className="detail-value">{calculateAge(selectedDriver.birth_date)} years</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Hire Date</span>
                    <span className="detail-value">{formatDate(selectedDriver.hire_date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Experience Since</span>
                    <span className="detail-value">{formatDate(selectedDriver.driving_experience_since)}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Experience</span>
                    <span className="detail-value">
                      {selectedDriver.driving_experience_since ? 
                        `${calculateAge(selectedDriver.driving_experience_since)} years` : 
                        '-'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>License Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">License Number</span>
                    <span className="detail-value license-highlight">{selectedDriver.license_number || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Country</span>
                    <span className="detail-value">{selectedDriver.license_country?.toUpperCase() || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Issue Date</span>
                    <span className="detail-value">{formatDate(selectedDriver.license_issue_date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Expiry Date</span>
                    <span className="detail-value">{formatDate(selectedDriver.license_expiry_date)}</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">License Status</span>
                    <span className="detail-value">
                      {selectedDriver.license_expiry_date ? 
                        (new Date(selectedDriver.license_expiry_date) > new Date() ? 
                          <span className="status-valid">✅ Valid</span> : 
                          <span className="status-expired">❌ Expired</span>
                        ) : 
                        '-'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Identification</h3>
                <div className="detail-grid">
                  <div className="detail-item full-width">
                    <span className="detail-label">ID Document Address</span>
                    <span className="detail-value">{selectedDriver.id_document_address || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tax Identification Number</span>
                    <span className="detail-value">{selectedDriver.tax_identification_number || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Yango Integration</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Yango Driver ID</span>
                    <span className="detail-value">{selectedDriver.yango_driver_id || 'Not synced'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Sync Status</span>
                    <span className="detail-value">
                      <span className={`sync-badge ${selectedDriver.yango_synced ? 'synced' : 'not-synced'}`}>
                        {selectedDriver.yango_synced ? '✅ Synced' : '❌ Not Synced'}
                      </span>
                    </span>
                  </div>
                  {selectedDriver.yango_sync_error && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Sync Error</span>
                      <span className="detail-value error-text">{selectedDriver.yango_sync_error}</span>
                    </div>
                  )}
                  {selectedDriver.yango_last_synced_at && (
                    <div className="detail-item">
                      <span className="detail-label">Last Synced</span>
                      <span className="detail-value">{formatDateTime(selectedDriver.yango_last_synced_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Timestamps</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{formatDateTime(selectedDriver.created_at)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Updated</span>
                    <span className="detail-value">{formatDateTime(selectedDriver.updated_at)}</span>
                  </div>
                </div>
              </div>

              {selectedDriver.comment && (
                <div className="detail-section">
                  <h3>Comment</h3>
                  <div className="comment-box">{selectedDriver.comment}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredDrivers;