

import React, { useState, useEffect } from 'react';
import './RegisterCustomer.css';
import ConfirmationDialog from './ConfirmationDialog';

// ============================================
// SEARCHABLE DROPDOWN COMPONENT
// ============================================

const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  required,
  error,
  name,
  disabled = false,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = React.useRef(null);

  const filteredOptions = options.filter(option =>
    option.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      {label && (
        <label>
          {label} {required && <span className="required-star">*</span>}
        </label>
      )}
      <div 
        className={`dropdown-input ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'selected-value' : 'placeholder'}>
          {loading ? 'Loading...' : (selectedOption ? selectedOption.label : placeholder || 'Select...')}
        </span>
        <span className="dropdown-arrow">▼</span>
      </div>
      {isOpen && !disabled && !loading && (
        <div className="dropdown-options">
          <input
            type="text"
            className="dropdown-search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={`dropdown-option ${option.value === value ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="dropdown-no-options">No options found</div>
            )}
          </div>
        </div>
      )}
      {error && <span className="error-message-text">{error}</span>}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const RegisterCustomer = ({ user }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  
  // NHTSA data
  const [brands, setBrands] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  
  // Backend options
  const [options, setOptions] = useState({
    colors: [],
    categories: [],
    licenseCountries: [],
    workRules: []
  });
  
  const [carData, setCarData] = useState({
    brand: '',
    model: '',
    color: '',
    year: '',
    license_plate_number: '',
    registration_certificate: '',
    category: '',
    comment: ''
  });

  const [driverData, setDriverData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    birth_date: '',
    license_country: '',
    license_number: '',
    license_issue_date: '',
    license_expiry_date: '',
    driving_experience_since: '',
    id_document_address: '',
    tax_identification_number: '',
    hire_date: '',
    comment: '',
    work_rule_id: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [carErrors, setCarErrors] = useState({});
  const [driverErrors, setDriverErrors] = useState({});

  // ============================================
  // FETCH BRANDS FROM NHTSA (Third-party)
  // ============================================
  
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoadingBrands(true);
        console.log('🚗 Fetching brands from NHTSA...');
        const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetAllMakes?format=json');
        const data = await response.json();
        
        if (data.Results) {
          const brandOptions = data.Results.map(item => ({
            value: item.Make_Name,
            label: item.Make_Name
          }));
          setBrands(brandOptions);
          console.log(`✅ Loaded ${brandOptions.length} brands from NHTSA`);
        }
      } catch (error) {
        console.error('❌ Error fetching brands:', error);
      } finally {
        setLoadingBrands(false);
      }
    };

    fetchBrands();
  }, []);

  // ============================================
  // FETCH MODELS FROM NHTSA (Third-party)
  // ============================================

  useEffect(() => {
    const fetchModels = async () => {
      if (!carData.brand) {
        setAvailableModels([]);
        return;
      }

      try {
        setModelsLoading(true);
        console.log(`🚗 Fetching models for ${carData.brand} from NHTSA...`);
        const response = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(carData.brand)}?format=json`
        );
        const data = await response.json();
        
        if (data.Results) {
          const modelOptions = data.Results.map(item => ({
            value: item.Model_Name,
            label: item.Model_Name
          }));
          setAvailableModels(modelOptions);
          console.log(`✅ Loaded ${modelOptions.length} models for ${carData.brand}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching models for ${carData.brand}:`, error);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [carData.brand]);

  // ============================================
  // FETCH OPTIONS FROM BACKEND
  // ============================================

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/options/all', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          const opts = data.data;
          setOptions({
            colors: opts.colors || [],
            categories: opts.categories || [],
            licenseCountries: opts.licenseCountries || [],
            workRules: opts.workRules || []
          });

          // Set default values if available
          if (opts.workRules && opts.workRules.length > 0) {
            setDriverData(prev => ({ 
              ...prev, 
              work_rule_id: opts.workRules[0].id 
            }));
          }
          if (opts.categories && opts.categories.length > 0) {
            setCarData(prev => ({ 
              ...prev, 
              category: opts.categories[0].value 
            }));
          }
          if (opts.licenseCountries && opts.licenseCountries.length > 0) {
            setDriverData(prev => ({ 
              ...prev, 
              license_country: opts.licenseCountries[0].value 
            }));
          }
          if (opts.colors && opts.colors.length > 0) {
            setCarData(prev => ({ 
              ...prev, 
              color: opts.colors[0].value 
            }));
          }
        } else {
          console.error('Failed to fetch options:', data.message);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // ============================================
  // VALIDATION
  // ============================================

  const validateCar = () => {
    const errors = {};
    if (!carData.brand) errors.brand = 'Brand is required';
    if (!carData.model) errors.model = 'Model is required';
    if (!carData.color) errors.color = 'Color is required';
    if (!carData.year) errors.year = 'Year is required';
    if (!carData.license_plate_number.trim()) errors.license_plate_number = 'License plate is required';
    if (!carData.registration_certificate.trim()) errors.registration_certificate = 'Registration certificate is required';
    if (!carData.category) errors.category = 'Category is required';
    return errors;
  };

  const validateDriver = () => {
    const errors = {};
    if (!driverData.first_name.trim()) errors.first_name = 'First name is required';
    if (!driverData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!driverData.phone.trim()) errors.phone = 'Phone is required';
    if (!driverData.license_number.trim()) errors.license_number = 'License number is required';
    if (!driverData.license_country) errors.license_country = 'License country is required';
    if (!driverData.work_rule_id) errors.work_rule_id = 'Work rule is required';
    return errors;
  };

  const isCarFormValid = () => {
    if (loading || loadingBrands) return false;
    return Object.keys(validateCar()).length === 0;
  };

  const isDriverFormValid = () => {
    if (loading) return false;
    return Object.keys(validateDriver()).length === 0;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleCarDropdownChange = (name, value) => {
    setCarData(prev => ({ ...prev, [name]: value }));
    if (carErrors[name]) setCarErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleCarInputChange = (e) => {
    const { name, value } = e.target;
    setCarData(prev => ({ ...prev, [name]: value }));
    if (carErrors[name]) setCarErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleDriverChange = (e) => {
    const { name, value } = e.target;
    setDriverData(prev => ({ ...prev, [name]: value }));
    if (driverErrors[name]) setDriverErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleDriverDropdownChange = (name, value) => {
    setDriverData(prev => ({ ...prev, [name]: value }));
    if (driverErrors[name]) setDriverErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleNext = () => {
    const errors = validateCar();
    if (Object.keys(errors).length > 0) {
      setCarErrors(errors);
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handlePreview = () => {
    const errors = validateDriver();
    if (Object.keys(errors).length > 0) {
      setDriverErrors(errors);
      return;
    }
    setShowPreview(true);
  };

  const handleConfirmRegistration = async () => {
    setIsSubmitting(true);
    setShowPreview(false);

    try {
      const registrationData = {
        car: carData,
        driver: driverData
      };

      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();
      
      if (data.success) {
        setRegistrationResult(data.data);
        setShowSuccess(true);
        setTimeout(() => handleReset(), 5000);
      } else {
        alert('Registration failed: ' + data.message);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCarData({
      brand: '',
      model: '',
      color: '',
      year: '',
      license_plate_number: '',
      registration_certificate: '',
      category: options.categories.length > 0 ? options.categories[0].value : '',
      comment: ''
    });
    setDriverData({
      first_name: '',
      middle_name: '',
      last_name: '',
      phone: '',
      email: '',
      address: '',
      birth_date: '',
      license_country: options.licenseCountries.length > 0 ? options.licenseCountries[0].value : '',
      license_number: '',
      license_issue_date: '',
      license_expiry_date: '',
      driving_experience_since: '',
      id_document_address: '',
      tax_identification_number: '',
      hire_date: '',
      comment: '',
      work_rule_id: options.workRules.length > 0 ? options.workRules[0].id : ''
    });
    setCurrentStep(1);
    setShowPreview(false);
    setShowSuccess(false);
    setRegistrationResult(null);
    setCarErrors({});
    setDriverErrors({});
    setAvailableModels([]);
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading registration options...</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="register-container">
        <div className="success-container">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="success-title">Registration Successful!</h2>
          <p className="success-message">
            The customer has been successfully registered.
          </p>
          {registrationResult && (
            <div className="success-details">
              <div className="detail-item">
                <span className="detail-label">Car:</span>
                <span className="detail-value">
                  {registrationResult.car?.brand} {registrationResult.car?.model}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Driver:</span>
                <span className="detail-value">
                  {registrationResult.driver?.first_name} {registrationResult.driver?.last_name}
                </span>
              </div>
            </div>
          )}
          <button className="btn-primary" onClick={handleReset}>
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <ConfirmationDialog
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmRegistration}
        title="Confirm Registration & Binding"
        message={`By confirming, you are binding ${carData.brand || 'this'} ${carData.model || 'car'} with ${driverData.first_name || 'this'} ${driverData.last_name || 'driver'}.`}
        confirmText="Confirm & Bind"
        cancelText="Cancel"
        type="info"
      />

      <div className="register-header">
        <div className="step-indicators">
          <div className={`step ${currentStep === 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Car Details</span>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep === 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Driver Details</span>
          </div>
        </div>
        <h1 className="page-title">Register New Customer</h1>
        <p className="page-subtitle">Enter the required car and driver information</p>
      </div>

      <div className="register-form-container">
        {currentStep === 1 && (
          <div className="form-step">
            <h2 className="form-section-title">Car Information</h2>
            <div className="form-grid">
              {/* Brand - From NHTSA API */}
              <div className="form-group">
                <SearchableDropdown
                  name="brand"
                  options={brands}
                  value={carData.brand}
                  onChange={(value) => handleCarDropdownChange('brand', value)}
                  placeholder="Select Brand"
                  label="Brand"
                  required
                  error={carErrors.brand}
                  loading={loadingBrands}
                />
              </div>

              {/* Model - From NHTSA API (filtered by brand) */}
              <div className="form-group">
                <SearchableDropdown
                  name="model"
                  options={availableModels}
                  value={carData.model}
                  onChange={(value) => handleCarDropdownChange('model', value)}
                  placeholder={carData.brand ? "Select Model" : "Select Brand First"}
                  label="Model"
                  required
                  error={carErrors.model}
                  disabled={!carData.brand}
                  loading={modelsLoading}
                />
              </div>

              {/* Color - From Backend */}
              <div className="form-group">
                <SearchableDropdown
                  name="color"
                  options={options.colors}
                  value={carData.color}
                  onChange={(value) => handleCarDropdownChange('color', value)}
                  placeholder="Select Color"
                  label="Color"
                  required
                  error={carErrors.color}
                />
              </div>

              <div className="form-group">
                <label>Year *</label>
                <input
                  type="number"
                  name="year"
                  value={carData.year}
                  onChange={handleCarInputChange}
                  placeholder="e.g., 2023"
                  className={carErrors.year ? 'error' : ''}
                  min="1900"
                  max="2024"
                />
                {carErrors.year && <span className="error-message-text">{carErrors.year}</span>}
              </div>

              <div className="form-group">
                <label>License Plate *</label>
                <input
                  type="text"
                  name="license_plate_number"
                  value={carData.license_plate_number}
                  onChange={handleCarInputChange}
                  placeholder="e.g., AA-12345"
                  className={carErrors.license_plate_number ? 'error' : ''}
                />
                {carErrors.license_plate_number && <span className="error-message-text">{carErrors.license_plate_number}</span>}
              </div>

              <div className="form-group">
                <label>Registration Certificate *</label>
                <input
                  type="text"
                  name="registration_certificate"
                  value={carData.registration_certificate}
                  onChange={handleCarInputChange}
                  placeholder="Certificate number"
                  className={carErrors.registration_certificate ? 'error' : ''}
                />
                {carErrors.registration_certificate && <span className="error-message-text">{carErrors.registration_certificate}</span>}
              </div>

              {/* Category - From Backend */}
              <div className="form-group">
                <SearchableDropdown
                  name="category"
                  options={options.categories}
                  value={carData.category}
                  onChange={(value) => handleCarDropdownChange('category', value)}
                  placeholder="Select Category"
                  label="Category"
                  required
                  error={carErrors.category}
                />
              </div>

              <div className="form-group full-width">
                <label>Comment</label>
                <textarea
                  name="comment"
                  value={carData.comment}
                  onChange={handleCarInputChange}
                  placeholder="Additional comments..."
                  rows="2"
                  className={carErrors.comment ? 'error' : ''}
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-next" 
                onClick={handleNext}
                disabled={!isCarFormValid()}
              >
                Next
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-step">
            <h2 className="form-section-title">Driver Information</h2>
            <div className="form-grid">
              {/* First Name - Text input */}
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="first_name"
                  value={driverData.first_name}
                  onChange={handleDriverChange}
                  placeholder="First name"
                  className={driverErrors.first_name ? 'error' : ''}
                />
                {driverErrors.first_name && <span className="error-message-text">{driverErrors.first_name}</span>}
              </div>

              {/* Middle Name - Text input */}
              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={driverData.middle_name}
                  onChange={handleDriverChange}
                  placeholder="Middle name"
                />
              </div>

              {/* Last Name - Text input */}
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="last_name"
                  value={driverData.last_name}
                  onChange={handleDriverChange}
                  placeholder="Last name"
                  className={driverErrors.last_name ? 'error' : ''}
                />
                {driverErrors.last_name && <span className="error-message-text">{driverErrors.last_name}</span>}
              </div>

              {/* Phone - Text input */}
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={driverData.phone}
                  onChange={handleDriverChange}
                  placeholder="e.g., +251911111111"
                  className={driverErrors.phone ? 'error' : ''}
                />
                {driverErrors.phone && <span className="error-message-text">{driverErrors.phone}</span>}
              </div>

              {/* Email - Text input */}
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={driverData.email}
                  onChange={handleDriverChange}
                  placeholder="driver@example.com"
                />
              </div>

              {/* Address - Text input */}
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={driverData.address}
                  onChange={handleDriverChange}
                  placeholder="Full address"
                />
              </div>

              {/* Birth Date - Date input */}
              <div className="form-group">
                <label>Birth Date</label>
                <input
                  type="date"
                  name="birth_date"
                  value={driverData.birth_date}
                  onChange={handleDriverChange}
                />
              </div>

              {/* License Country - From Backend */}
              <div className="form-group">
                <SearchableDropdown
                  name="license_country"
                  options={options.licenseCountries}
                  value={driverData.license_country}
                  onChange={(value) => handleDriverDropdownChange('license_country', value)}
                  placeholder="Select Country"
                  label="License Country"
                  required
                  error={driverErrors.license_country}
                />
              </div>

              {/* License Number - Text input */}
              <div className="form-group">
                <label>License Number *</label>
                <input
                  type="text"
                  name="license_number"
                  value={driverData.license_number}
                  onChange={handleDriverChange}
                  placeholder="License number"
                  className={driverErrors.license_number ? 'error' : ''}
                />
                {driverErrors.license_number && <span className="error-message-text">{driverErrors.license_number}</span>}
              </div>

              {/* License Issue Date - Date input */}
              <div className="form-group">
                <label>License Issue Date</label>
                <input
                  type="date"
                  name="license_issue_date"
                  value={driverData.license_issue_date}
                  onChange={handleDriverChange}
                />
              </div>

              {/* License Expiry Date - Date input */}
              <div className="form-group">
                <label>License Expiry Date</label>
                <input
                  type="date"
                  name="license_expiry_date"
                  value={driverData.license_expiry_date}
                  onChange={handleDriverChange}
                />
              </div>

              {/* Driving Experience Since - Date input */}
              <div className="form-group">
                <label>Driving Experience Since</label>
                <input
                  type="date"
                  name="driving_experience_since"
                  value={driverData.driving_experience_since}
                  onChange={handleDriverChange}
                />
              </div>

              {/* ID Document Address - Text input */}
              <div className="form-group">
                <label>ID Document Address</label>
                <input
                  type="text"
                  name="id_document_address"
                  value={driverData.id_document_address}
                  onChange={handleDriverChange}
                  placeholder="ID document address"
                />
              </div>

              {/* Tax Identification Number - Text input */}
              <div className="form-group">
                <label>Tax Identification Number</label>
                <input
                  type="text"
                  name="tax_identification_number"
                  value={driverData.tax_identification_number}
                  onChange={handleDriverChange}
                  placeholder="TIN"
                />
              </div>

              {/* Hire Date - Date input */}
              <div className="form-group">
                <label>Hire Date</label>
                <input
                  type="date"
                  name="hire_date"
                  value={driverData.hire_date}
                  onChange={handleDriverChange}
                />
              </div>

              {/* Comment - Text area */}
              <div className="form-group full-width">
                <label>Comment</label>
                <textarea
                  name="comment"
                  value={driverData.comment}
                  onChange={handleDriverChange}
                  placeholder="Additional comments about the driver..."
                  rows="2"
                  className={driverErrors.comment ? 'error' : ''}
                />
              </div>

              {/* Work Rule - From Yango API (via backend) */}
              <div className="form-group">
                <SearchableDropdown
                  name="work_rule_id"
                  options={options.workRules.map(rule => ({
                    value: rule.id,
                    label: rule.name
                  }))}
                  value={driverData.work_rule_id}
                  onChange={(value) => handleDriverDropdownChange('work_rule_id', value)}
                  placeholder="Select Work Rule"
                  label="Work Rule"
                  required
                  error={driverErrors.work_rule_id}
                />
                <div className="field-hint">
                  <span>ⓘ Work rule determines driver's payment terms and working conditions</span>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-back" onClick={handleBack}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                Previous
              </button>
              <button 
                type="button" 
                className="btn-preview" 
                onClick={handlePreview}
                disabled={isSubmitting || !isDriverFormValid()}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    Next
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="preview-overlay">
          <div className="preview-container">
            <div className="preview-header">
              <h3>Review & Confirm Registration</h3>
              <button className="preview-close" onClick={() => setShowPreview(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="preview-body">
              <div className="preview-section">
                <h4>Car Information</h4>
                <div className="preview-grid">
                  <div className="preview-item">
                    <span className="preview-label">Brand:</span>
                    <span className="preview-value">{carData.brand || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Model:</span>
                    <span className="preview-value">{carData.model || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Color:</span>
                    <span className="preview-value">{carData.color || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Year:</span>
                    <span className="preview-value">{carData.year || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Plate:</span>
                    <span className="preview-value">{carData.license_plate_number || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Category:</span>
                    <span className="preview-value">
                      {options.categories.find(c => c.value === carData.category)?.label || carData.category || '-'}
                    </span>
                  </div>
                  {carData.comment && (
                    <div className="preview-item full-width">
                      <span className="preview-label">Comment:</span>
                      <span className="preview-value">{carData.comment}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="preview-section">
                <h4>Driver Information</h4>
                <div className="preview-grid">
                  <div className="preview-item">
                    <span className="preview-label">Name:</span>
                    <span className="preview-value">
                      {driverData.first_name} {driverData.middle_name} {driverData.last_name}
                    </span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Phone:</span>
                    <span className="preview-value">{driverData.phone || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Email:</span>
                    <span className="preview-value">{driverData.email || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Address:</span>
                    <span className="preview-value">{driverData.address || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Birth Date:</span>
                    <span className="preview-value">{driverData.birth_date || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">License:</span>
                    <span className="preview-value">{driverData.license_number || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">License Issue:</span>
                    <span className="preview-value">{driverData.license_issue_date || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">License Expiry:</span>
                    <span className="preview-value">{driverData.license_expiry_date || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Experience Since:</span>
                    <span className="preview-value">{driverData.driving_experience_since || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">License Country:</span>
                    <span className="preview-value">{driverData.license_country || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">ID Document Address:</span>
                    <span className="preview-value">{driverData.id_document_address || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">TIN:</span>
                    <span className="preview-value">{driverData.tax_identification_number || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Hire Date:</span>
                    <span className="preview-value">{driverData.hire_date || '-'}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-label">Work Rule:</span>
                    <span className="preview-value">
                      {options.workRules.find(r => r.id === driverData.work_rule_id)?.name || '-'}
                    </span>
                  </div>
                  {driverData.comment && (
                    <div className="preview-item full-width">
                      <span className="preview-label">Comment:</span>
                      <span className="preview-value">{driverData.comment}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="preview-binding-message">
                <div className="binding-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 3h5v5" />
                    <path d="M8 3H3v5" />
                    <path d="M21 3l-6 6" />
                    <path d="M3 21l6-6" />
                    <path d="M16 21h5v-5" />
                    <path d="M8 21H3v-5" />
                  </svg>
                </div>
                <p className="binding-text">
                  <strong>By confirming, you are binding</strong> 
                  <span className="binding-highlight">{carData.brand || 'this'} {carData.model || 'car'}</span> 
                  with 
                  <span className="binding-highlight">{driverData.first_name || 'this'} {driverData.last_name || 'driver'}</span>
                </p>
              </div>

              <div className="preview-actions">
                <button className="preview-btn-cancel" onClick={() => setShowPreview(false)}>
                  Cancel
                </button>
                <button className="preview-btn-confirm" onClick={handleConfirmRegistration}>
                  Confirm & Bind
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterCustomer;