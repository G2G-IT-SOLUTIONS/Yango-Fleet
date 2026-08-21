import React, { useState, useEffect } from 'react';
import './RegisterCustomer.css';
import ConfirmationDialog from './ConfirmationDialog';
import AlertModal from '../AlertModal';

// ============================================
// SEARCHABLE DROPDOWN COMPONENT
// ============================================
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 34;

  return Array.from(
    { length: 35 },
    (_, index) => {
      const year = currentYear - index;
      return {
        value: String(year),
        label: String(year)
      };
    }
  );
};

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
// VEHICLE TYPE SELECTION COMPONENT
// ============================================

const VehicleTypeSelection = ({ onSelect, selectedType, onNext, onSkip }) => {
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageErrors, setImageErrors] = useState({});

    useEffect(() => {
        const fetchVehicleTypes = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/options/vehicle-types', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
                const data = await response.json();
                
                if (data.success) {
                    setVehicleTypes(data.data || []);
                } else {
                    setError('Failed to load vehicle types');
                }
            } catch (error) {
                console.error('Error fetching vehicle types:', error);
                setError('Network error. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchVehicleTypes();
    }, []);

    const handleImageError = (typeId) => {
        setImageErrors(prev => ({ ...prev, [typeId]: true }));
    };

    const getImageUrl = (imageName) => {
        if (!imageName) return null;
        if (imageName.startsWith('http')) return imageName;
        return `http://localhost:5000/assets/vehicle-types/${imageName}`;
    };

    const getVehicleIcon = (name) => {
        const icons = {
            'Yango Driver Car': '🚗',
            'Sedan': '🚗',
            'SUV': '🚙',
            'Hatchback': '🚗',
            'Truck': '🚛',
            'Van': '🚐',
            'Luxury': '🏎️',
            'Electric': '⚡',
        };
        return icons[name] || '🚗';
    };

    if (loading) {
        return (
            <div className="vehicle-type-loading">
                <div className="spinner"></div>
                <p>Loading vehicle types...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vehicle-type-error">
                <div className="error-icon">⚠️</div>
                <h3>{error}</h3>
                <button className="btn-retry" onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="vehicle-type-selection">


            <div className="vehicle-type-grid">
                {vehicleTypes.map((type) => {
                    const imageUrl = getImageUrl(type.image);
                    const hasImageError = imageErrors[type.id];
                    
                    return (
                        <div
                            key={type.id}
                            className={`vehicle-type-card ${selectedType?.id === type.id ? 'selected' : ''}`}
                            onClick={() => onSelect(type)}
                        >
                            <div className="vehicle-type-image-container">
                                {imageUrl && !hasImageError ? (
                                    <img 
                                        src={imageUrl}
                                        alt={type.name}
                                        className="vehicle-type-image"
                                        onError={() => handleImageError(type.id)}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="vehicle-type-icon">
                                        <span style={{ fontSize: '48px' }}>
                                            {getVehicleIcon(type.name)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="vehicle-type-info">
                                <h4>{type.name}</h4>
                                {type.description && <p>{type.description}</p>}
                            </div>
                            {selectedType?.id === type.id && (
                                <div className="vehicle-type-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="vehicle-type-actions">
               
                <button
                    className="btn-vehicle-type-next"
                    onClick={onNext}
                    disabled={!selectedType}
                >
                    Next
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

const RegisterCustomer = ({ user }) => {
  // ==========================================
  // STEP -1: Vehicle Type Selection State
  // ==========================================
  const [vehicleTypeStep, setVehicleTypeStep] = useState(true);
  const [selectedVehicleType, setSelectedVehicleType] = useState(null);
  
  // ==========================================
  // Alert Modal State
  // ==========================================
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const showAlert = (title, message, type = 'error') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertModal({ isOpen: false, title: '', message: '', type: 'error' });
  };

  // ==========================================
  // STEP 0: Pre-Validation State
  // ==========================================
  const [preValidationStep, setPreValidationStep] = useState(false);
  const [preValidationData, setPreValidationData] = useState({
    phone: ''
  });
  const [preValidationErrors, setPreValidationErrors] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const [preValidationResult, setPreValidationResult] = useState(null);

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
  const yearOptions = getYearOptions();
  
  const [carData, setCarData] = useState({
    brand: '',
    model: '',
    color: '',
    year: '',
    license_plate_number: '',
    comment: '',
    vehicle_type_id: ''
  });

  const [driverData, setDriverData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    license_country: '',
    license_number: '',
    license_issue_date: '',
    license_expiry_date: '',
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
  // VEHICLE TYPE SELECTION HANDLERS
  // ============================================

  const handleVehicleTypeSelect = (type) => {
    setSelectedVehicleType(type);
    setCarData(prev => ({
      ...prev,
      vehicle_type_id: type.id
    }));
  };

  const handleVehicleTypeNext = () => {
    if (selectedVehicleType) {
      setVehicleTypeStep(false);
      setPreValidationStep(true);
    }
  };

  const handleVehicleTypeSkip = () => {
    setVehicleTypeStep(false);
    setPreValidationStep(true);
  };

  // ============================================
  // PRE-VALIDATION: Check Phone and License Plate
  // ============================================

  const validatePreValidation = () => {
    const errors = {};
    if (!preValidationData.phone && !preValidationData.license_plate) {
      errors.general = 'Please enter either Phone Number to check';
    }
    if (preValidationData.phone) {
      const phone = preValidationData.phone.trim();
      if (!phone.startsWith('+251')) {
        errors.phone = 'Phone number must start with +251';
      }
    }
    return errors;
  };

  const handlePreValidationCheck = async () => {
    const errors = validatePreValidation();
    if (Object.keys(errors).length > 0) {
      setPreValidationErrors(errors);
      return;
    }

    setIsChecking(true);
    setPreValidationErrors({});
    setPreValidationResult(null);

    try {
      const response = await fetch('/api/registrations/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          phone: preValidationData.phone || undefined,
          license_plate: preValidationData.license_plate || undefined
        })
      });

      const data = await response.json();

      // ==========================================
      // CASE 1: WORKING DRIVER - BLOCKED
      // ==========================================
      if (data.mode === 'blocked' || data.conflict_type === 'active_driver') {
        setPreValidationResult({
          available: false,
          message: data.message || 'This driver is already working in Yango.',
          mode: 'blocked',
          work_status: data.work_status
        });
        return;
      }

      // ==========================================
      // CASE 2: FIRED/NOT_WORKING - UPDATE MODE
      // ==========================================
      if (data.mode === 'update' || data.conflict_type === 'update_driver') {
        setPreValidationResult({
          available: true,
          message: data.message || 'Driver exists but is not active. You can update their information.',
          mode: 'update',
          work_status: data.work_status,
          driver_id: data.driver_id,
          existing_driver: data.driver_data
        });

        if (preValidationData.phone) {
          setDriverData(prev => ({ ...prev, phone: preValidationData.phone }));
        }
        if (preValidationData.license_plate) {
          setCarData(prev => ({ ...prev, license_plate_number: preValidationData.license_plate }));
        }

        setPreValidationStep(false);
        return;
      }

      // ==========================================
      // CASE 3: NEW DRIVER - CREATE MODE
      // ==========================================
      if (data.mode === 'create' || data.success === true) {
        setPreValidationResult({
          available: true,
          message: 'No existing records found. Proceed to create.',
          mode: 'create'
        });

        if (preValidationData.phone) {
          setDriverData(prev => ({ ...prev, phone: preValidationData.phone }));
        }
        if (preValidationData.license_plate) {
          setCarData(prev => ({ ...prev, license_plate_number: preValidationData.license_plate }));
        }

        setPreValidationStep(false);
        return;
      }

      // ==========================================
      // CASE 4: CAR CONFLICT
      // ==========================================
      if (data.conflict_type === 'active_car') {
        setPreValidationResult({
          available: false,
          message: data.message || 'This car is already bound to a driver.',
          mode: 'blocked',
          conflict_type: 'active_car'
        });
        return;
      }

      // ==========================================
      // CASE 5: FALLBACK
      // ==========================================
      setPreValidationResult({
        available: false,
        message: data.message || 'Something went wrong. Please try again.',
        conflicts: data.conflicts
      });

    } catch (error) {
      console.error('Pre-validation error:', error);
      setPreValidationErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsChecking(false);
    }
  };

  const handlePreValidationChange = (e) => {
    const { name, value } = e.target;

    setPreValidationData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'phone') {
      if (value && !value.startsWith('+251')) {
        setPreValidationErrors(prev => ({
          ...prev,
          phone: 'Phone number must start with +251'
        }));
      } else {
        setPreValidationErrors(prev => ({
          ...prev,
          phone: undefined
        }));
      }
    }

    if (preValidationErrors.general) {
      setPreValidationErrors(prev => ({
        ...prev,
        general: undefined
      }));
    }
  };

  // ============================================
  // VALIDATION
  // ============================================

  const validateCar = () => {
    const errors = {};
    if (!carData.brand) errors.brand = 'Make is required';
    if (!carData.model) errors.model = 'Model is required';
    if (!carData.color) errors.color = 'Color is required';
    if (!carData.year) errors.year = 'Year is required';
    if (!carData.license_plate_number.trim()) errors.license_plate_number = 'License plate is required';
    return errors;
  };

  const validateDriver = () => {
    const errors = {};
    if (!driverData.first_name.trim()) errors.first_name = 'First name is required';
    if (!driverData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!driverData.phone.trim()) errors.phone = 'Phone is required';
    if (!driverData.license_number.trim()) errors.license_number = 'License number is required';
    if (!driverData.license_country) errors.license_country = 'License country is required';
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

  // ============================================
  // handleConfirmRegistration
  // ============================================

  const handleConfirmRegistration = async () => {
    setIsSubmitting(true);
    setShowPreview(false);

    try {
        const registrationData = {
            car: carData,
            driver: driverData,
            mode: preValidationResult?.mode || 'create'
        };

        const isUpdate = preValidationResult?.mode === 'update';
        
        const url = isUpdate 
            ? `/api/registrations/${preValidationResult.driver_id}/update`
            : '/api/registrations';

        console.log('📤 Sending request to:', url);
        console.log('📤 With data:', registrationData);

        const response = await fetch(url, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(registrationData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            let errorMessage = errorData.message || 'Registration failed';
            
            if (errorData.error && errorData.error.includes('one_active_driver_per_car')) {
                errorMessage = 'This car is already assigned to another driver. Please select a different car.';
            }
            
            showAlert('Registration Failed', errorMessage, 'error');
            setIsSubmitting(false);
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            setRegistrationResult(data.data);
            setShowSuccess(true);
            setTimeout(() => handleReset(), 5000);
        } else {
            showAlert('Registration Failed', data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Registration Failed', 'An unexpected error occurred. Please try again.', 'error');
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
      comment: '',
      vehicle_type_id: ''
    });
    setDriverData({
      first_name: '',
      last_name: '',
      phone: '',
      birth_date: '',
      license_country: options.licenseCountries.length > 0 ? options.licenseCountries[0].value : '',
      license_number: '',
      license_issue_date: '',
      license_expiry_date: '',
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
    setVehicleTypeStep(true);
    setSelectedVehicleType(null);
    setPreValidationStep(false);
    setPreValidationData({ phone: '', license_plate: '' });
    setPreValidationResult(null);
    setPreValidationErrors({});
  };

  const handleGoBackToCheck = () => {
    setPreValidationStep(true);
    setPreValidationResult(null);
    setPreValidationData({ phone: '', license_plate: '' });
  };

  // ============================================
  // RENDER: Vehicle Type Selection Step
  // ============================================

  if (vehicleTypeStep) {
    return (
      <div className="register-container">
        <div className="register-header">
          <h1 className="page-title">Select Vehicle Type</h1>
          <p className="page-subtitle">Choose the type of vehicle you want to register</p>
        </div>

        <VehicleTypeSelection
          onSelect={handleVehicleTypeSelect}
          selectedType={selectedVehicleType}
          onNext={handleVehicleTypeNext}
          onSkip={handleVehicleTypeSkip}
        />
      </div>
    );
  }

  // ============================================
  // RENDER: Pre-Validation Step
  // ============================================

  if (preValidationStep) {
    return (
      <div className="register-container">
        <div className="register-header">
          <button className="btn-back-to-vehicle-type" onClick={() => {
            setVehicleTypeStep(true);
            setPreValidationStep(false);
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <h1 className="page-title">Check Availability</h1>
          <p className="page-subtitle">Enter phone number or license plate to check if already registered</p>
        </div>

        <div className="pre-validation-container">
          <div className="pre-validation-card">
            <div className="pre-validation-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            
            <div className="pre-validation-form">
              <div className="pre-validation-hint">
                <span>Enter either phone number or license plate number to check if already registered in Yango</span>
              </div>

              <div className="pre-validation-fields">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={preValidationData.phone}
                    onChange={handlePreValidationChange}
                    placeholder="e.g., +251911111111"
                    className={preValidationErrors.phone ? 'error' : ''}
                  />
                  {preValidationErrors.phone && (
                    <span className="error-message-text">{preValidationErrors.phone}</span>
                  )}
                </div>

                <div className="form-group">
                  {preValidationErrors.license_plate && (
                    <span className="error-message-text">{preValidationErrors.license_plate}</span>
                  )}
                </div>
              </div>

              {preValidationErrors.general && (
                <div className="pre-validation-error">
                  <span className="error-message-text">{preValidationErrors.general}</span>
                </div>
              )}

              {preValidationResult && preValidationResult.mode === 'blocked' && (
                <div className="pre-validation-error blocked-error">
                  <div className="error-icon">🚫</div>
                  <div className="error-content">
                    <strong>{preValidationResult.message}</strong>
                    {preValidationResult.work_status && (
                      <div className="status-badge status-working">
                        Status: {preValidationResult.work_status}
                      </div>
                    )}
                    <p className="error-hint">This driver cannot be registered. Please contact support.</p>
                  </div>
                </div>
              )}

              {preValidationResult && preValidationResult.mode === 'update' && (
                <div className="pre-validation-success update-mode">
                  <div className="success-icon">✏️</div>
                  <div className="success-content">
                    <strong>{preValidationResult.message}</strong>
                    {preValidationResult.work_status && (
                      <div className="status-badge status-inactive">
                        Current Status: {preValidationResult.work_status}
                      </div>
                    )}
                    <p className="update-hint">You are updating an existing driver's information.</p>
                  </div>
                </div>
              )}

              {preValidationResult && preValidationResult.mode === 'create' && (
                <div className="pre-validation-success create-mode">
                  <div className="success-icon">✅</div>
                  <div className="success-content">
                    <strong>{preValidationResult.message}</strong>
                    <p className="create-hint">You are creating a new driver registration.</p>
                  </div>
                </div>
              )}

              {preValidationResult && !preValidationResult.available && !preValidationResult.mode && (
                <div className="pre-validation-error">
                  <div className="error-icon">⚠️</div>
                  <div className="error-content">
                    <strong>{preValidationResult.message}</strong>
                    {preValidationResult.conflicts && (
                      <div className="conflict-details">
                        {preValidationResult.conflicts.phone && (
                          <div>📱 Phone number already registered</div>
                        )}
                        {preValidationResult.conflicts.license_plate && (
                          <div>🚗 License plate already registered</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                className="btn-check-availability"
                onClick={handlePreValidationCheck}
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <span className="spinner"></span>
                    Checking...
                  </>
                ) : (
                  'Check Availability'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: Loading State
  // ============================================

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading registration options...</p>
      </div>
    );
  }

  // ============================================
  // RENDER: Success State
  // ============================================

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

  // ============================================
  // RENDER: Main Registration Form
  // ============================================

  return (
    <>
      <div className="register-container">
        {/* Back to check button */}
        <button className="btn-back-to-check" onClick={handleGoBackToCheck}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Check
        </button>

        {/* Show mode indicator */}
        {preValidationResult?.mode === 'update' && (
          <div className="mode-indicator update-indicator">
            <span className="mode-icon">✏️</span>
            <span className="mode-text">Update Mode - Updating existing driver</span>
          </div>
        )}
        {preValidationResult?.mode === 'create' && (
          <div className="mode-indicator create-indicator">
            <span className="mode-icon">✨</span>
            <span className="mode-text">Create Mode - New driver registration</span>
          </div>
        )}

        <ConfirmationDialog
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onConfirm={handleConfirmRegistration}
          title={preValidationResult?.mode === 'update' ? "Confirm Update & Binding" : "Confirm Registration & Binding"}
          message={preValidationResult?.mode === 'update' 
            ? `By confirming, you are updating ${carData.brand || 'this'} ${carData.model || 'car'} with ${driverData.first_name || 'this'} ${driverData.last_name || 'driver'}.`
            : `By confirming, you are binding ${carData.brand || 'this'} ${carData.model || 'car'} with ${driverData.first_name || 'this'} ${driverData.last_name || 'driver'}.`
          }
          confirmText={preValidationResult?.mode === 'update' ? "Confirm Update" : "Confirm & Bind"}
          cancelText="Cancel"
          type={preValidationResult?.mode === 'update' ? "warning" : "info"}
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
          <h1 className="page-title">
            {preValidationResult?.mode === 'update' ? 'Update Customer' : 'Register New Customer'}
          </h1>
          <p className="page-subtitle">
            {preValidationResult?.mode === 'update' 
              ? 'Update the car and driver information'
              : 'Enter the required car and driver information'
            }
          </p>
        </div>

        <div className="register-form-container">
          {currentStep === 1 && (
            <div className="form-step">
              <h2 className="form-section-title">Car Information</h2>
              
              {selectedVehicleType && (
                <div className="selected-vehicle-type-banner">
                  <span className="selected-vehicle-label">Selected Vehicle Type:</span>
                  <span className="selected-vehicle-name">{selectedVehicleType.name}</span>
                  <button 
                    className="btn-change-vehicle-type"
                    onClick={() => {
                      setVehicleTypeStep(true);
                      setPreValidationStep(false);
                      setCurrentStep(1);
                    }}
                  >
                    Change
                  </button>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <SearchableDropdown
                    name="brand"
                    options={brands}
                    value={carData.brand}
                    onChange={(value) => handleCarDropdownChange('brand', value)}
                    placeholder="Select Brand"
                    label="Make"
                    required
                    error={carErrors.brand}
                    loading={loadingBrands}
                  />
                </div>

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
                  <SearchableDropdown
                    name="year"
                    value={carData.year}
                    options={yearOptions}
                    onChange={(value) => handleCarDropdownChange('year', value)}
                    placeholder="Select year"
                    required
                    error={carErrors.year}
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
                    placeholder="e.g., ETH...."
                    className={carErrors.license_plate_number ? 'error' : ''}
                  />
                  {carErrors.license_plate_number && <span className="error-message-text">{carErrors.license_plate_number}</span>}
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

                <div className="form-group">
                  <label>Birth Date</label>
                  <input
                    type="date"
                    name="birth_date"
                    value={driverData.birth_date}
                    onChange={handleDriverChange}
                  />
                </div>

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

                <div className="form-group">
                  <label>License Issue Date</label>
                  <input
                    type="date"
                    name="license_issue_date"
                    value={driverData.license_issue_date}
                    onChange={handleDriverChange}
                  />
                </div>

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
                <h3>
                  {preValidationResult?.mode === 'update' ? 'Review & Confirm Update' : 'Review & Confirm Registration'}
                </h3>
                <button className="preview-close" onClick={() => setShowPreview(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="preview-body">
                {/* ... preview content ... */}
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
                    <strong>By confirming, you are {preValidationResult?.mode === 'update' ? 'updating' : 'binding'}</strong> 
                    <span className="binding-highlight">{carData.brand || 'this'} {carData.model || 'car'}</span> 
                    with 
                    <span className="binding-highlight">{driverData.first_name || 'this'} {driverData.last_name || 'driver'}</span>
                  </p>
                  {preValidationResult?.mode === 'update' && (
                    <p className="binding-note">⚠️ This will update the existing driver's information in Yango.</p>
                  )}
                </div>

                <div className="preview-actions">
                  <button className="preview-btn-cancel" onClick={() => setShowPreview(false)}>
                    Cancel
                  </button>
                  <button className="preview-btn-confirm" onClick={handleConfirmRegistration}>
                    {preValidationResult?.mode === 'update' ? 'Confirm Update' : 'Confirm & Bind'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alert Modal */}
      <AlertModal 
        isOpen={alertModal.isOpen}
        onClose={closeAlert}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </>
  );
};

export default RegisterCustomer;