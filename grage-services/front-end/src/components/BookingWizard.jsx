import React, { useState, useCallback } from 'react';
import './BookingWizard.css';
import { useBookings } from '../context';
import { useAuth } from '../context/AuthContext';
import { servicesApi, vehiclesApi } from '../utils/apiService';
import { postPaymentRequest } from '../utils/paymentRequest';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const MERCHANT_NAME = 'AutoX Garage';

const BookingWizard = ({ preselectedServiceId = null }) => {
  const { createBooking } = useBookings();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('new');
  const [bookingData, setBookingData] = useState({
    // Step 1: Service Selection
    serviceId: '',
    serviceName: '',
    servicePrice: 0,
    
    // Step 2: Vehicle Details
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleNumber: '',
    vehicleYear: '',
    
    // Step 3: Date & Time
    bookingDate: '',
    bookingTime: '',
    preferredSlot: '',
    
    // Step 4: Payment Method
    paymentMethod: 'Razorpay',
    
    // Additional info
    specialInstructions: '',
  });

  const [errors, setErrors] = useState({});

  const loadSavedVehicles = useCallback(async () => {
    try {
      const response = await vehiclesApi.listMine({
        userId: user?.userId || user?.id || '',
        userObjectId: user?._id || '',
        email: user?.email || '',
        customerName: user?.name || user?.fullName || '',
        mobile: user?.phone || '',
      });
      const vehicles = Array.isArray(response?.data) ? response.data : [];
      setSavedVehicles(vehicles);
    } catch (_error) {
      setSavedVehicles([]);
    }
  }, [user?.userId, user?.id, user?._id, user?.email, user?.name, user?.fullName, user?.phone]);

  React.useEffect(() => {
    loadSavedVehicles();
  }, [loadSavedVehicles]);

  React.useEffect(() => {
    if (currentStep === 2) {
      loadSavedVehicles();
    }
  }, [currentStep, loadSavedVehicles]);

  const steps = [
    { number: 1, title: 'Select Service', icon: '🔧' },
    { number: 2, title: 'Vehicle Details', icon: '🚗' },
    { number: 3, title: 'Date & Time', icon: '📅' },
    { number: 4, title: 'Payment Method', icon: '💳' },
    { number: 5, title: 'Confirmation', icon: '✓' },
  ];

  React.useEffect(() => {
    let mounted = true;

    const formatDuration = (minutesValue) => {
      const minutes = Number(minutesValue || 0);
      if (!Number.isFinite(minutes) || minutes <= 0) return 'Estimated on inspection';
      if (minutes < 60) return `${minutes} mins`;
      const hours = minutes / 60;
      if (Number.isInteger(hours)) return `${hours} hour${hours > 1 ? 's' : ''}`;
      return `${hours.toFixed(1)} hours`;
    };

    const loadServices = async () => {
      try {
        setServicesLoading(true);
        setServicesError('');
        const response = await servicesApi.list();
        const list = response?.data || response || [];
        const normalized = list
          .filter((item) => item.active !== false)
          .map((item) => ({
            id: item._id || item.id,
            name: item.name || item.title || 'Service',
            icon: item.icon || '🔧',
            price: Number(item.basePrice ?? item.price ?? 0),
            duration: formatDuration(item.estimatedDurationMinutes),
            description: item.description || 'Professional service by certified technicians',
            features: Array.isArray(item.features) ? item.features : [],
          }));

        if (mounted) {
          setServices(normalized);
        }
      } catch (error) {
        if (mounted) {
          setServices([]);
          setServicesError(error.message || 'Failed to load services');
        }
      } finally {
        if (mounted) {
          setServicesLoading(false);
        }
      }
    };

    loadServices();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!preselectedServiceId || services.length === 0) return;
    const selected = services.find((item) => String(item.id) === String(preselectedServiceId));
    if (selected) {
      handleServiceSelect(selected);
      setCurrentStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedServiceId, services]);

  const vehicleTypes = ['Car', 'Bike', 'SUV', 'Truck', 'Other'];
  const defaultBrandSuggestions = {
    Car: ['Maruti Suzuki', 'Hyundai', 'Honda', 'Tata', 'Mahindra', 'Toyota', 'Kia'],
    Bike: ['Hero', 'Honda', 'Bajaj', 'TVS', 'Yamaha', 'Royal Enfield', 'KTM'],
    SUV: ['Mahindra', 'Tata', 'Toyota', 'Hyundai', 'Kia', 'MG'],
    Truck: ['Ashok Leyland', 'Tata', 'Eicher', 'BharatBenz', 'Mahindra'],
    Other: ['Other'],
  };
  const defaultModelSuggestions = {
    'maruti suzuki': ['Swift', 'Baleno', 'WagonR', 'Dzire', 'Ertiga'],
    hyundai: ['i20', 'Creta', 'Venue', 'Verna', 'Exter'],
    honda: ['City', 'Amaze', 'Activa', 'Shine', 'Unicorn'],
    tata: ['Nexon', 'Punch', 'Altroz', 'Harrier', 'Tiago'],
    mahindra: ['Scorpio', 'XUV700', 'Bolero', 'Thar'],
    toyota: ['Innova', 'Fortuner', 'Glanza', 'Urban Cruiser'],
    kia: ['Seltos', 'Sonet', 'Carens'],
    hero: ['Splendor', 'HF Deluxe', 'Glamour', 'Xtreme'],
    bajaj: ['Pulsar', 'Platina', 'CT 110', 'Dominar'],
    tvs: ['Apache', 'Jupiter', 'Ntorq', 'Raider'],
    yamaha: ['FZ', 'R15', 'MT-15', 'Ray ZR'],
    'royal enfield': ['Classic 350', 'Hunter 350', 'Meteor 350', 'Bullet 350'],
    ktm: ['Duke 200', 'Duke 390', 'RC 200', 'RC 390'],
    'ashok leyland': ['Dost', 'Partner', 'Bada Dost'],
    eicher: ['Pro 2049', 'Pro 3015', 'Pro 2110'],
    bharatbenz: ['1217C', '2823R', '3528CM'],
    mg: ['Hector', 'Astor', 'Gloster'],
  };
  const timeSlots = [
    '09:00 AM - 11:00 AM',
    '11:00 AM - 01:00 PM',
    '01:00 PM - 03:00 PM',
    '03:00 PM - 05:00 PM',
    '05:00 PM - 07:00 PM',
  ];
  const paymentMethods = ['Razorpay'];

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleServiceSelect = (service) => {
    setBookingData(prev => ({
      ...prev,
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
    }));
    if (errors.serviceId) {
      setErrors(prev => ({ ...prev, serviceId: '' }));
    }
  };

  const handleVehicleSelection = (value) => {
    setSelectedVehicleId(value);

    if (value === 'new') {
      setBookingData((prev) => ({
        ...prev,
        vehicleType: '',
        vehicleBrand: '',
        vehicleModel: '',
        vehicleNumber: '',
        vehicleYear: '',
      }));
      return;
    }

    const selected = savedVehicles.find((vehicle) => String(vehicle.id) === String(value));
    if (!selected) return;

    setBookingData((prev) => ({
      ...prev,
      vehicleType: selected.vehicle_type || selected.vehicleType || 'Car',
      vehicleBrand: selected.vehicle_company || selected.vehicleCompany || selected.make || '',
      vehicleModel: selected.vehicle_model || selected.vehicleModel || selected.model || '',
      vehicleNumber: selected.vehicle_number || selected.vehicleNumber || selected.plate || '',
      vehicleYear: selected.vehicle_year || selected.year || '',
    }));
  };

  const savedBrandSuggestions = Array.from(
    new Set(
      savedVehicles
        .map((vehicle) => vehicle.vehicle_company || vehicle.vehicleCompany || vehicle.make || '')
        .map((item) => String(item).trim())
        .filter(Boolean)
    )
  );

  const selectedType = bookingData.vehicleType || 'Other';
  const staticBrandsForType = defaultBrandSuggestions[selectedType] || defaultBrandSuggestions.Other;
  const brandSuggestions = Array.from(new Set([...savedBrandSuggestions, ...staticBrandsForType]));

  const selectedBrandNormalized = String(bookingData.vehicleBrand || '').trim().toLowerCase();
  const savedModelSuggestions = Array.from(
    new Set(
      savedVehicles
        .filter((vehicle) => {
          const make = String(vehicle.vehicle_company || vehicle.vehicleCompany || vehicle.make || '').trim().toLowerCase();
          return selectedBrandNormalized && make === selectedBrandNormalized;
        })
        .map((vehicle) => vehicle.vehicle_model || vehicle.vehicleModel || vehicle.model || '')
        .map((item) => String(item).trim())
        .filter(Boolean)
    )
  );
  const staticModelsForBrand = defaultModelSuggestions[selectedBrandNormalized] || [];
  const modelSuggestions = Array.from(new Set([...savedModelSuggestions, ...staticModelsForBrand]));

  const vehicleNumberSuggestions = Array.from(
    new Set(
      savedVehicles
        .map((vehicle) => vehicle.vehicle_number || vehicle.vehicleNumber || vehicle.plate || '')
        .map((item) => String(item).trim().toUpperCase())
        .filter(Boolean)
    )
  );

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!bookingData.serviceId) {
          newErrors.serviceId = 'Please select a service';
        }
        break;

      case 2:
        if (!bookingData.vehicleType) {
          newErrors.vehicleType = 'Vehicle type is required';
        }
        if (!bookingData.vehicleBrand) {
          newErrors.vehicleBrand = 'Vehicle brand is required';
        }
        if (!bookingData.vehicleModel) {
          newErrors.vehicleModel = 'Vehicle model is required';
        }
        if (!bookingData.vehicleNumber) {
          newErrors.vehicleNumber = 'Vehicle number is required';
        }
        break;

      case 3:
        if (!bookingData.bookingDate) {
          newErrors.bookingDate = 'Booking date is required';
        }
        if (!bookingData.preferredSlot) {
          newErrors.preferredSlot = 'Please select a time slot';
        }
        break;

      case 4:
        if (!bookingData.paymentMethod) {
          newErrors.paymentMethod = 'Please select a payment method';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (isProcessing) return;

    const resetWizard = () => {
      setBookingData({
        serviceId: '',
        serviceName: '',
        servicePrice: 0,
        vehicleType: '',
        vehicleBrand: '',
        vehicleModel: '',
        vehicleNumber: '',
        vehicleYear: '',
        bookingDate: '',
        bookingTime: '',
        preferredSlot: '',
        paymentMethod: 'Razorpay',
        specialInstructions: '',
      });
      setSelectedVehicleId('new');
      setCurrentStep(1);
    };

    const submitBooking = async (paymentDetails) => {
      const selectedStartSlot = bookingData.preferredSlot?.split(' - ')[0] || '09:00 AM';
      const [timePart, period] = selectedStartSlot.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const slotDate = bookingData.bookingDate ? new Date(bookingData.bookingDate) : new Date();
      slotDate.setHours(hours, Number(minutes || 0), 0, 0);
      const scheduledAt = slotDate.toISOString();

      const result = await createBooking({
        userId: user?.userId || user?.id,
        serviceId: bookingData.serviceId,
        serviceName: bookingData.serviceName,
        customerName: user?.name || user?.fullName || user?.email || 'Customer',
        email: user?.email || '',
        phone: user?.phone || '',
        date: bookingData.bookingDate,
        timeSlot: bookingData.preferredSlot,
        scheduledAt,
        notes: bookingData.specialInstructions,
        amount: bookingData.servicePrice,
        paymentMethod: 'Razorpay',
        paymentStatus: 'completed',
        paymentDate: new Date().toISOString(),
        transactionId: paymentDetails?.razorpay_payment_id || '',
        razorpayOrderId: paymentDetails?.razorpay_order_id || '',
        razorpayPaymentId: paymentDetails?.razorpay_payment_id || '',
        razorpaySignature: paymentDetails?.razorpay_signature || '',
        vehicleNumber: bookingData.vehicleNumber,
        vehicleCompany: bookingData.vehicleBrand,
        vehicleModel: bookingData.vehicleModel,
        vehicleType: bookingData.vehicleType,
      });

      if (!result.success) {
        throw new Error(result.error || 'Booking failed after successful payment');
      }

      return result.data?.id || 'N/A';
    };

    try {
      setIsProcessing(true);

      const amount = Number(bookingData.servicePrice);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Invalid booking amount for payment');
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay checkout script');
      }

      const createPaymentResult = await postPaymentRequest('/create-payment', {
        service_name: bookingData.serviceName,
        email: user?.email || undefined,
        amount,
      });

      const orderData = createPaymentResult.data;

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: 'INR',
        name: MERCHANT_NAME,
        description: `${bookingData.serviceName} | ${MERCHANT_NAME}`,
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || user?.fullName || user?.email || 'Customer',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async (response) => {
          try {
            await postPaymentRequest('/verify-payment', {
              service_name: bookingData.serviceName,
              email: user?.email || undefined,
              amount,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const bookingId = await submitBooking(response);
            alert(`Payment successful and booking confirmed! Booking ID: ${bookingId}`);
            resetWizard();
          } catch (verificationError) {
            alert(verificationError.message || 'Payment verification failed');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        const errorMessage = response?.error?.description || 'Payment failed';
        setIsProcessing(false);
        alert(errorMessage);
      });
      razorpay.open();
    } catch (error) {
      setIsProcessing(false);
      alert(error.message || 'Unable to start payment process');
    }
  };

  const getProgressPercentage = () => {
    return ((currentStep - 1) / (steps.length - 1)) * 100;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Select a Service</h2>
            <p className="step-description">Choose the service you need for your vehicle</p>

            {servicesLoading && <p className="step-description">Loading services...</p>}
            {!servicesLoading && servicesError && <p className="error">{servicesError}</p>}
            {!servicesLoading && !servicesError && services.length === 0 && (
              <p className="step-description">No active services available right now.</p>
            )}
            
            <div className="services-grid-booking">
              {services.map(service => (
                <div
                  key={service.id}
                  className={`service-card-booking ${bookingData.serviceId === service.id ? 'selected' : ''}`}
                  onClick={() => handleServiceSelect(service)}
                >
                  <div className="service-card-header">
                    <div className="service-icon-large">{service.icon}</div>
                    {bookingData.serviceId === service.id && (
                      <div className="selected-badge">Selected ✓</div>
                    )}
                  </div>
                  <div className="service-card-body">
                    <h3>{service.name}</h3>
                    <p className="service-desc">{service.description}</p>
                    <div className="service-features-list">
                      {service.features.slice(0, 2).map((feature, idx) => (
                        <span key={idx} className="feature-tag">✓ {feature}</span>
                      ))}
                    </div>
                    <div className="service-meta">
                      <div className="service-price-large">₹{service.price}</div>
                      <div className="service-duration-badge">
                        <span className="duration-icon">⏱</span>
                        {service.duration}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.serviceId && <span className="error">{errors.serviceId}</span>}
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>Vehicle Details</h2>
            <p className="step-description">Enter your vehicle information</p>

            <div className="saved-vehicle-bar">
              <div className="form-group full-width">
                <label>Select Vehicle</label>
                <select value={selectedVehicleId} onChange={(e) => handleVehicleSelection(e.target.value)}>
                  <option value="new">Add a New Vehicle</option>
                  {savedVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {(vehicle.vehicle_number || vehicle.plate || '—')} - {(vehicle.vehicle_company || vehicle.make || '')} {(vehicle.vehicle_model || vehicle.model || '')}
                    </option>
                  ))}
                </select>
                {savedVehicles.length === 0 && (
                  <p className="vehicle-empty-note">No saved vehicles found for your account.</p>
                )}
              </div>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Vehicle Type *</label>
                <select
                  value={bookingData.vehicleType}
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  className={errors.vehicleType ? 'error-input' : ''}
                >
                  <option value="">Select vehicle type</option>
                  {vehicleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.vehicleType && <span className="error">{errors.vehicleType}</span>}
              </div>

              <div className="form-group">
                <label>Vehicle Brand *</label>
                <input
                  type="text"
                  value={bookingData.vehicleBrand}
                  onChange={(e) => handleInputChange('vehicleBrand', e.target.value)}
                  placeholder="e.g., Maruti, Honda"
                  list="vehicle-brand-suggestions"
                  autoComplete="off"
                  className={errors.vehicleBrand ? 'error-input' : ''}
                />
                <datalist id="vehicle-brand-suggestions">
                  {brandSuggestions.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>
                {errors.vehicleBrand && <span className="error">{errors.vehicleBrand}</span>}
              </div>

              <div className="form-group">
                <label>Vehicle Model *</label>
                <input
                  type="text"
                  value={bookingData.vehicleModel}
                  onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                  placeholder="e.g., Swift, City"
                  list="vehicle-model-suggestions"
                  autoComplete="off"
                  className={errors.vehicleModel ? 'error-input' : ''}
                />
                <datalist id="vehicle-model-suggestions">
                  {modelSuggestions.map((model) => (
                    <option key={model} value={model} />
                  ))}
                </datalist>
                {errors.vehicleModel && <span className="error">{errors.vehicleModel}</span>}
              </div>

              <div className="form-group">
                <label>Vehicle Number *</label>
                <input
                  type="text"
                  value={bookingData.vehicleNumber}
                  onChange={(e) => handleInputChange('vehicleNumber', e.target.value.toUpperCase())}
                  placeholder="e.g., MH12AB1234"
                  list="vehicle-number-suggestions"
                  autoComplete="off"
                  className={errors.vehicleNumber ? 'error-input' : ''}
                />
                <datalist id="vehicle-number-suggestions">
                  {vehicleNumberSuggestions.map((vehicleNumber) => (
                    <option key={vehicleNumber} value={vehicleNumber} />
                  ))}
                </datalist>
                {errors.vehicleNumber && <span className="error">{errors.vehicleNumber}</span>}
              </div>

              <div className="form-group">
                <label>Manufacturing Year</label>
                <input
                  type="number"
                  value={bookingData.vehicleYear}
                  onChange={(e) => handleInputChange('vehicleYear', e.target.value)}
                  placeholder="e.g., 2020"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                />
              </div>

              <div className="form-group full-width">
                <label>Special Instructions</label>
                <textarea
                  value={bookingData.specialInstructions}
                  onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                  placeholder="Any specific issues or requirements..."
                  rows="3"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>Select Date & Time</h2>
            <p className="step-description">Choose your preferred date and time slot</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Booking Date *</label>
                <input
                  type="date"
                  value={bookingData.bookingDate}
                  onChange={(e) => handleInputChange('bookingDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.bookingDate ? 'error-input' : ''}
                />
                {errors.bookingDate && <span className="error">{errors.bookingDate}</span>}
              </div>

              <div className="form-group full-width">
                <label>Preferred Time Slot *</label>
                <div className="time-slots-grid">
                  {timeSlots.map(slot => (
                    <div
                      key={slot}
                      className={`time-slot ${bookingData.preferredSlot === slot ? 'selected' : ''}`}
                      onClick={() => handleInputChange('preferredSlot', slot)}
                    >
                      {slot}
                    </div>
                  ))}
                </div>
                {errors.preferredSlot && <span className="error">{errors.preferredSlot}</span>}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>Payment Method</h2>
            <p className="step-description">Select your preferred payment method</p>
            
            <div className="payment-methods">
              {paymentMethods.map(method => (
                <div
                  key={method}
                  className={`payment-card ${bookingData.paymentMethod === method ? 'selected' : ''}`}
                  onClick={() => handleInputChange('paymentMethod', method)}
                >
                  <div className="payment-icon">
                    {method === 'Razorpay' && '💳'}
                  </div>
                  <span>{method}</span>
                </div>
              ))}
            </div>
            {errors.paymentMethod && <span className="error">{errors.paymentMethod}</span>}
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h2>Confirm Your Booking</h2>
            <p className="step-description">Please review your booking details</p>
            
            <div className="confirmation-details">
              <div className="confirmation-section">
                <h3>🔧 Service Details</h3>
                <div className="detail-row">
                  <span>Service:</span>
                  <strong>{bookingData.serviceName}</strong>
                </div>
                <div className="detail-row">
                  <span>Price:</span>
                  <strong>₹{bookingData.servicePrice}</strong>
                </div>
              </div>

              <div className="confirmation-section">
                <h3>🚗 Vehicle Information</h3>
                <div className="detail-row">
                  <span>Type:</span>
                  <strong>{bookingData.vehicleType}</strong>
                </div>
                <div className="detail-row">
                  <span>Vehicle:</span>
                  <strong>{bookingData.vehicleBrand} {bookingData.vehicleModel}</strong>
                </div>
                <div className="detail-row">
                  <span>Number:</span>
                  <strong>{bookingData.vehicleNumber}</strong>
                </div>
                {bookingData.vehicleYear && (
                  <div className="detail-row">
                    <span>Year:</span>
                    <strong>{bookingData.vehicleYear}</strong>
                  </div>
                )}
              </div>

              <div className="confirmation-section">
                <h3>📅 Schedule</h3>
                <div className="detail-row">
                  <span>Date:</span>
                  <strong>{new Date(bookingData.bookingDate).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</strong>
                </div>
                <div className="detail-row">
                  <span>Time Slot:</span>
                  <strong>{bookingData.preferredSlot}</strong>
                </div>
              </div>

              <div className="confirmation-section">
                <h3>💳 Payment</h3>
                <div className="detail-row">
                  <span>Method:</span>
                  <strong>{bookingData.paymentMethod}</strong>
                </div>
              </div>

              {bookingData.specialInstructions && (
                <div className="confirmation-section">
                  <h3>📝 Special Instructions</h3>
                  <p>{bookingData.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="booking-wizard">
      <div className="wizard-container">
        <div className="wizard-header">
          <h1>Book Your Service</h1>
          <p>Complete the steps below to book your vehicle service</p>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          <span className="progress-text">
            Step {currentStep} of {steps.length}
          </span>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {steps.map((step, index) => (
            <div key={step.number} className="stepper-item">
              <div className={`stepper-step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}>
                <div className="step-number">
                  {currentStep > step.number ? '✓' : step.icon}
                </div>
                <div className="step-title">{step.title}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`stepper-line ${currentStep > step.number ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="wizard-content">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="wizard-footer">
          <button
            className="btn btn-secondary"
            onClick={handleBack}
              disabled={currentStep === 1 || isProcessing}
          >
            ← Back
          </button>

          {currentStep < 5 ? (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={isProcessing}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing Payment...' : 'Pay & Confirm Booking ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
