import React, { useState, useEffect, useMemo } from 'react';
import './Bindings.css';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

const Bindings = ({ user }) => {
  const [bindings, setBindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBinding, setSelectedBinding] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    isActive: 'all',
    dateRange: 'all',
    syncStatus: 'all',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchBindings();
  }, []);

  const fetchBindings = async () => {
    try {
      const response = await fetch('/api/bindings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBindings(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bindings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter bindings
  const filteredBindings = useMemo(() => {
    let result = [...bindings];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(binding =>
        binding.car_brand?.toLowerCase().includes(search) ||
        binding.car_model?.toLowerCase().includes(search) ||
        binding.license_plate_number?.toLowerCase().includes(search) ||
        binding.driver_first_name?.toLowerCase().includes(search) ||
        binding.driver_last_name?.toLowerCase().includes(search) ||
        binding.driver_phone?.includes(search) ||
        binding.employee_first_name?.toLowerCase().includes(search) ||
        binding.employee_last_name?.toLowerCase().includes(search) ||
        binding.team_leader_first_name?.toLowerCase().includes(search) ||
        binding.team_leader_last_name?.toLowerCase().includes(search)
      );
    }

    // Active status filter
    if (filters.isActive !== 'all') {
      const isActive = filters.isActive === 'active';
      result = result.filter(binding => binding.is_active === isActive);
    }

    // Sync status filter
    if (filters.syncStatus !== 'all') {
      const isSynced = filters.syncStatus === 'synced';
      result = result.filter(binding => binding.yango_synced === isSynced);
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
        result = result.filter(binding => {
          const createdDate = parseISO(binding.created_at);
          return isWithinInterval(createdDate, { start: startDate, end: endDate });
        });
      }
    }

    // Custom date range
    if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59);
      
      result = result.filter(binding => {
        const createdDate = parseISO(binding.created_at);
        return createdDate >= start && createdDate <= end;
      });
    }

    return result;
  }, [bindings, searchTerm, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleBindingClick = (binding) => {
    setSelectedBinding(binding);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedBinding(null);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), 'PPP');
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return format(parseISO(date), 'PPP p');
  };

  const getBindingStatus = (binding) => {
    if (binding.is_active) {
      return 'active';
    } else {
      return 'inactive';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'status-active' : 'status-inactive';
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading car-driver bindings...</p>
      </div>
    );
  }

  return (
    <div className="bindings-container">
      {/* Header */}
      <div className="bindings-header">
        <div className="header-top">
          <div>
            <h1 className="page-title">Car-Driver Bindings</h1>
            <p className="page-subtitle">View and manage all car and driver associations</p>
          </div>
          <div className="header-stats">
            <span className="stat-badge">
              Total: {bindings.length}
            </span>
            <span className="stat-badge active">
              Active: {bindings.filter(b => b.is_active).length}
            </span>
            <span className="stat-badge inactive">
              Inactive: {bindings.filter(b => !b.is_active).length}
            </span>
            <span className="stat-badge synced">
              Synced: {bindings.filter(b => b.yango_synced).length}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bindings-stats">
        <div className="stat-card">
          <span className="stat-number">{bindings.length}</span>
          <span className="stat-label">Total Bindings</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{bindings.filter(b => b.is_active).length}</span>
          <span className="stat-label">Active Bindings</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{bindings.filter(b => !b.is_active).length}</span>
          <span className="stat-label">Inactive Bindings</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{bindings.filter(b => b.yango_synced).length}</span>
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
            placeholder="Search by car, driver, employee, or team leader..."
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
            <label>Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
        Showing {filteredBindings.length} of {bindings.length} bindings
      </div>

      {/* Bindings List */}
      {filteredBindings.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 3h5v5" />
            <path d="M8 3H3v5" />
            <path d="M21 3l-6 6" />
            <path d="M3 21l6-6" />
            <path d="M16 21h5v-5" />
            <path d="M8 21H3v-5" />
          </svg>
          <h3>No Bindings Found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="bindings-table-container">
          <table className="bindings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Car</th>
                <th>Driver</th>
                <th>Plate</th>
                <th>Registered By</th>
                <th>Team Leader</th>
                <th>Status</th>
                <th>Yango Sync</th>
                <th>Bound Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredBindings.map((binding, index) => {
                const status = getBindingStatus(binding);
                return (
                  <tr key={binding.id} className="clickable-row" onClick={() => handleBindingClick(binding)}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="car-info">
                        <span className="car-brand">{binding.car_brand}</span>
                        <span className="car-model">{binding.car_model}</span>
                      </div>
                    </td>
                    <td>
                      <div className="driver-info">
                        <div className="avatar-small">
                          {binding.driver_first_name?.[0] || ''}{binding.driver_last_name?.[0] || ''}
                        </div>
                        <span>{binding.driver_first_name} {binding.driver_last_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="plate-number">{binding.license_plate_number}</span>
                    </td>
                    <td>
                      <div className="employee-info">
                        {binding.employee_first_name && binding.employee_last_name ? (
                          <span>{binding.employee_first_name} {binding.employee_last_name}</span>
                        ) : (
                          <span className="unknown-text">Unknown</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="team-leader-info">
                        {binding.team_leader_first_name && binding.team_leader_last_name ? (
                          <span className="team-leader-name">
                            {binding.team_leader_first_name} {binding.team_leader_last_name}
                          </span>
                        ) : (
                          <span className="unassigned-text">Unassigned</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(status)}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`sync-badge ${binding.yango_synced ? 'synced' : 'not-synced'}`}>
                        {binding.yango_synced ? '✅ Synced' : '❌ Not Synced'}
                      </span>
                    </td>
                    <td>
                      <div className="date-info">
                        <span className="date-main">{formatDate(binding.bound_at)}</span>
                        {binding.unbound_at && (
                          <span className="date-unbound">Unbound: {formatDate(binding.unbound_at)}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Binding Detail Modal */}
      {showDetail && selectedBinding && (
        <div className="binding-detail-overlay" onClick={closeDetail}>
          <div className="binding-detail-container" onClick={(e) => e.stopPropagation()}>
            <div className="binding-detail-header">
              <h2>Binding Details</h2>
              <button className="binding-detail-close" onClick={closeDetail}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="binding-detail-body">
              {/* Binding Status */}
              <div className="detail-section">
                <div className="detail-status-header">
                  <div className="binding-status-large">
                    <span className={`status-badge-large ${selectedBinding.is_active ? 'active' : 'inactive'}`}>
                      {selectedBinding.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div>
                    <h3>Car-Driver Association</h3>
                    <p className="binding-id">ID: {selectedBinding.id}</p>
                  </div>
                </div>
              </div>

              {/* Car Information */}
              <div className="detail-section">
                <h3>Car Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Brand</span>
                    <span className="detail-value">{selectedBinding.car_brand || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Model</span>
                    <span className="detail-value">{selectedBinding.car_model || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">License Plate</span>
                    <span className="detail-value plate-highlight">{selectedBinding.license_plate_number || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Yango Vehicle ID</span>
                    <span className="detail-value">{selectedBinding.yango_vehicle_id || 'Not synced'}</span>
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              <div className="detail-section">
                <h3>Driver Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{selectedBinding.driver_first_name || ''} {selectedBinding.driver_last_name || ''}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{selectedBinding.driver_phone || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Yango Driver ID</span>
                    <span className="detail-value">{selectedBinding.yango_driver_id || 'Not synced'}</span>
                  </div>
                </div>
              </div>

              {/* Registration Information */}
              <div className="detail-section">
                <h3>Registration Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Registered By</span>
                    <span className="detail-value">
                      {selectedBinding.employee_first_name && selectedBinding.employee_last_name ? 
                        `${selectedBinding.employee_first_name} ${selectedBinding.employee_last_name}` : 
                        'Unknown'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Team Leader</span>
                    <span className="detail-value">
                      {selectedBinding.team_leader_first_name && selectedBinding.team_leader_last_name ? 
                        `${selectedBinding.team_leader_first_name} ${selectedBinding.team_leader_last_name}` : 
                        <span className="unassigned-text">Unassigned</span>
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Registration Date</span>
                    <span className="detail-value">{selectedBinding.registration_date ? formatDateTime(selectedBinding.registration_date) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Binding Details */}
              <div className="detail-section">
                <h3>Binding Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">
                      <span className={`status-badge ${selectedBinding.is_active ? 'status-active' : 'status-inactive'}`}>
                        {selectedBinding.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bound Date</span>
                    <span className="detail-value">{formatDateTime(selectedBinding.bound_at)}</span>
                  </div>
                  {selectedBinding.unbound_at && (
                    <div className="detail-item">
                      <span className="detail-label">Unbound Date</span>
                      <span className="detail-value">{formatDateTime(selectedBinding.unbound_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Yango Integration */}
              <div className="detail-section">
                <h3>Yango Integration</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Sync Status</span>
                    <span className="detail-value">
                      <span className={`sync-badge ${selectedBinding.yango_synced ? 'synced' : 'not-synced'}`}>
                        {selectedBinding.yango_synced ? '✅ Synced' : '❌ Not Synced'}
                      </span>
                    </span>
                  </div>
                  {selectedBinding.yango_sync_error && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Sync Error</span>
                      <span className="detail-value error-text">{selectedBinding.yango_sync_error}</span>
                    </div>
                  )}
                  {selectedBinding.yango_last_synced_at && (
                    <div className="detail-item">
                      <span className="detail-label">Last Synced</span>
                      <span className="detail-value">{formatDateTime(selectedBinding.yango_last_synced_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="detail-section">
                <h3>Timestamps</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{formatDateTime(selectedBinding.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bindings;