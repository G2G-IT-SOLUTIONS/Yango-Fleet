import React, { useState, useEffect, useMemo } from 'react';
import './RegisteredCars.css';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';

const RegisteredCars = ({ user }) => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCar, setSelectedCar] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    fuelType: 'all',
    ownershipType: 'all',
    transmission: 'all',
    dateRange: 'all',
    syncStatus: 'all',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await fetch('/api/cars', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCars(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter cars
  const filteredCars = useMemo(() => {
    let result = [...cars];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      result = result.filter(car =>
        car.brand?.toLowerCase().includes(search) ||
        car.model?.toLowerCase().includes(search) ||
        car.license_plate_number?.toLowerCase().includes(search) ||
        car.vin?.toLowerCase().includes(search) ||
        car.color?.toLowerCase().includes(search) ||
        car.callsign?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(car => car.status === filters.status);
    }

    // Fuel type filter
    if (filters.fuelType !== 'all') {
      result = result.filter(car => car.fuel_type === filters.fuelType);
    }

    // Ownership type filter
    if (filters.ownershipType !== 'all') {
      result = result.filter(car => car.ownership_type === filters.ownershipType);
    }

    // Transmission filter
    if (filters.transmission !== 'all') {
      result = result.filter(car => car.transmission === filters.transmission);
    }

    // Sync status filter
    if (filters.syncStatus !== 'all') {
      const isSynced = filters.syncStatus === 'synced';
      result = result.filter(car => car.yango_synced === isSynced);
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
        result = result.filter(car => {
          const createdDate = parseISO(car.created_at);
          return isWithinInterval(createdDate, { start: startDate, end: endDate });
        });
      }
    }

    // Custom date range
    if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59);
      
      result = result.filter(car => {
        const createdDate = parseISO(car.created_at);
        return createdDate >= start && createdDate <= end;
      });
    }

    return result;
  }, [cars, searchTerm, filters]);

  const getStatusColor = (status) => {
    const colors = {
      'working': 'status-working',
      'not_working': 'status-not-working',
      'repairing': 'status-repairing',
      'no_driver': 'status-no-driver',
      'pending': 'status-pending',
      'unknown': 'status-unknown'
    };
    return colors[status] || 'status-unknown';
  };

  const getStatusLabel = (status) => {
    return status?.replace('_', ' ').toUpperCase() || 'UNKNOWN';
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleCarClick = (car) => {
    setSelectedCar(car);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setSelectedCar(null);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return format(parseISO(date), 'PPP');
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return format(parseISO(date), 'PPP p');
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading registered cars...</p>
      </div>
    );
  }

  return (
    <div className="registered-cars-container">
      {/* Header */}
      <div className="cars-header">
        <div className="header-top">
          <div>
            <h1 className="page-title">Registered Cars</h1>
            <p className="page-subtitle">View and manage all registered vehicles in the fleet</p>
          </div>
          <div className="header-stats">
            <span className="stat-badge">
              Total: {cars.length}
            </span>
            <span className="stat-badge synced">
              Synced: {cars.filter(c => c.yango_synced).length}
            </span>
            <span className="stat-badge not-synced">
              Not Synced: {cars.filter(c => !c.yango_synced).length}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="cars-stats">
        <div className="stat-card">
          <span className="stat-number">{cars.length}</span>
          <span className="stat-label">Total Cars</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{cars.filter(c => c.status === 'working').length}</span>
          <span className="stat-label">Working</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{cars.filter(c => c.status === 'not_working').length}</span>
          <span className="stat-label">Not Working</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{cars.filter(c => c.yango_synced).length}</span>
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
            placeholder="Search by brand, model, plate, VIN, color, or callsign..."
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
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="working">Working</option>
              <option value="not_working">Not Working</option>
              <option value="repairing">Repairing</option>
              <option value="no_driver">No Driver</option>
              <option value="pending">Pending</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Fuel Type</label>
            <select
              value={filters.fuelType}
              onChange={(e) => handleFilterChange('fuelType', e.target.value)}
            >
              <option value="all">All Fuel Types</option>
              <option value="petrol">Petrol</option>
              <option value="methane">Methane</option>
              <option value="propane">Propane</option>
              <option value="electricity">Electricity</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Ownership</label>
            <select
              value={filters.ownershipType}
              onChange={(e) => handleFilterChange('ownershipType', e.target.value)}
            >
              <option value="all">All Ownership</option>
              <option value="park">Park Property</option>
              <option value="leasing">Leasing</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Transmission</label>
            <select
              value={filters.transmission}
              onChange={(e) => handleFilterChange('transmission', e.target.value)}
            >
              <option value="all">All Transmission</option>
              <option value="mechanical">Mechanical</option>
              <option value="automatic">Automatic</option>
              <option value="robotic">Robotic</option>
              <option value="variator">Variator</option>
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
        Showing {filteredCars.length} of {cars.length} cars
      </div>

      {/* Cars List */}
      {filteredCars.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polyline points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18" r="2.5" />
            <circle cx="18.5" cy="18" r="2.5" />
          </svg>
          <h3>No Cars Found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="cars-table-container">
          <table className="cars-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Car</th>
                <th>Plate</th>
                <th>Color</th>
                <th>Year</th>
                <th>Status</th>
                <th>Fuel</th>
                <th>Yango Sync</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filteredCars.map((car, index) => (
                <tr key={car.id} className="clickable-row" onClick={() => handleCarClick(car)}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="car-name">
                      <span className="car-brand">{car.brand}</span>
                      <span className="car-model">{car.model}</span>
                    </div>
                    {car.callsign && <div className="car-callsign">{car.callsign}</div>}
                  </td>
                  <td>
                    <span className="plate-number">{car.license_plate_number}</span>
                  </td>
                  <td>{car.color || '-'}</td>
                  <td>{car.year || '-'}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(car.status)}`}>
                      {getStatusLabel(car.status)}
                    </span>
                  </td>
                  <td>{car.fuel_type ? car.fuel_type.charAt(0).toUpperCase() + car.fuel_type.slice(1) : '-'}</td>
                  <td>
                    <span className={`sync-badge ${car.yango_synced ? 'synced' : 'not-synced'}`}>
                      {car.yango_synced ? '✅ Synced' : '❌ Not Synced'}
                    </span>
                  </td>
                  <td>{formatDate(car.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Car Detail Modal */}
      {showDetail && selectedCar && (
        <div className="car-detail-overlay" onClick={closeDetail}>
          <div className="car-detail-container" onClick={(e) => e.stopPropagation()}>
            <div className="car-detail-header">
              <h2>Car Details</h2>
              <button className="car-detail-close" onClick={closeDetail}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="car-detail-body">
              <div className="detail-section">
                <h3>Basic Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Brand</span>
                    <span className="detail-value">{selectedCar.brand || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Model</span>
                    <span className="detail-value">{selectedCar.model || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Color</span>
                    <span className="detail-value">{selectedCar.color || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Year</span>
                    <span className="detail-value">{selectedCar.year || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Transmission</span>
                    <span className="detail-value">{selectedCar.transmission ? selectedCar.transmission.charAt(0).toUpperCase() + selectedCar.transmission.slice(1) : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">
                      <span className={`status-badge ${getStatusColor(selectedCar.status)}`}>
                        {getStatusLabel(selectedCar.status)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Identification</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">License Plate</span>
                    <span className="detail-value plate-highlight">{selectedCar.license_plate_number || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">VIN</span>
                    <span className="detail-value">{selectedCar.vin || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Body Number</span>
                    <span className="detail-value">{selectedCar.body_number || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Callsign</span>
                    <span className="detail-value">{selectedCar.callsign || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Registration & Licensing</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Registration Certificate</span>
                    <span className="detail-value">{selectedCar.registration_certificate || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Taxi License</span>
                    <span className="detail-value">{selectedCar.taxi_license_number || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Mileage</span>
                    <span className="detail-value">{selectedCar.mileage ? `${selectedCar.mileage.toLocaleString()} km` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Fuel Type</span>
                    <span className="detail-value">{selectedCar.fuel_type ? selectedCar.fuel_type.charAt(0).toUpperCase() + selectedCar.fuel_type.slice(1) : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ownership</span>
                    <span className="detail-value">{selectedCar.ownership_type ? selectedCar.ownership_type.charAt(0).toUpperCase() + selectedCar.ownership_type.slice(1) : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Park Property</span>
                    <span className="detail-value">{selectedCar.is_park_property ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Yango Integration</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Yango Vehicle ID</span>
                    <span className="detail-value">{selectedCar.yango_vehicle_id || 'Not synced'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Sync Status</span>
                    <span className="detail-value">
                      <span className={`sync-badge ${selectedCar.yango_synced ? 'synced' : 'not-synced'}`}>
                        {selectedCar.yango_synced ? '✅ Synced' : '❌ Not Synced'}
                      </span>
                    </span>
                  </div>
                  {selectedCar.yango_sync_error && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Sync Error</span>
                      <span className="detail-value error-text">{selectedCar.yango_sync_error}</span>
                    </div>
                  )}
                  {selectedCar.yango_last_synced_at && (
                    <div className="detail-item">
                      <span className="detail-label">Last Synced</span>
                      <span className="detail-value">{formatDateTime(selectedCar.yango_last_synced_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>Timestamps</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{formatDateTime(selectedCar.created_at)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Updated</span>
                    <span className="detail-value">{formatDateTime(selectedCar.updated_at)}</span>
                  </div>
                </div>
              </div>

              {selectedCar.comment && (
                <div className="detail-section">
                  <h3>Comment</h3>
                  <div className="comment-box">{selectedCar.comment}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisteredCars;