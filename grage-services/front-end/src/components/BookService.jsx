import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useBookings } from '../context';
import { useNotifications } from '../context/NotificationContext';
import './BookService.css';

function BookService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    vehicle: '',
    serviceType: 'general-checkup',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const serviceTypes = [
    { value: 'general-checkup', label: '🔍 General Checkup' },
    { value: 'oil-change', label: '🛢️ Oil & Filter Change' },
    { value: 'brake-service', label: '🛑 Brake Service' },
    { value: 'tire-service', label: '🛞 Tire Maintenance' },
    { value: 'battery-check', label: '🔋 Battery Check' },
    { value: 'full-service', label: '⚙️ Full Service' },
    { value: 'custom', label: '📋 Custom Request' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create booking object
    const bookingData = {
      customerId: user?.id || Date.now(),
      customerName: formData.name,
      email: formData.email,
      phone: formData.phone,
      serviceId: Number.isFinite(Number(formData.serviceType)) ? Number(formData.serviceType) : null,
      serviceName: serviceTypes.find(st => st.value === formData.serviceType)?.label || formData.serviceType,
      vehicleNumber: formData.vehicle,
      date: formData.preferredDate,
      timeSlot: formData.preferredTime,
      notes: formData.message,
      status: 'pending',
      amount: 500
    };

    // Use BookingContext to create booking
    const result = await createBooking(bookingData);
    
    if (result.success) {
      // Add notification for new booking
      addNotification({
        type: 'booking',
        title: 'Booking Confirmed',
        message: `Your ${bookingData.serviceName} is scheduled for ${formData.preferredDate}`,
        icon: '✅',
      });
      
      console.log('Booking submitted:', result.data);
      setSubmitted(true);
      setTimeout(() => {
        navigate(user ? '/customer/dashboard' : '/');
      }, 2000);
    } else {
      alert('Booking failed: ' + result.error);
    }
  };

  if (submitted) {
    return (
      <div className="book-service-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Booking Confirmed! 🎉</h2>
          <p>Thank you for booking with AUTOX. We've received your request and will contact you shortly.</p>
          <p className="confirmation-ref">Confirmation email sent to: {formData.email}</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-service-container">
      <div className="book-service-wrapper">
        <div className="book-header">
          <h1>🚗 Smart Garage Services - Book Service</h1>
          <p>Full vehicle diagnostics, maintenance, and scheduled servicing by certified technicians.</p>
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9XXXXXXXXX"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Vehicle & Service Details</h3>
            <div className="form-group">
              <label htmlFor="vehicle">Vehicle Details *</label>
              <input
                type="text"
                id="vehicle"
                name="vehicle"
                value={formData.vehicle}
                onChange={handleChange}
                placeholder="e.g., 2020 Honda City, Registration: GJ-01-AB-1234"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="serviceType">Service Type *</label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                required
              >
                {serviceTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Preferred Appointment</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="preferredDate">Preferred Date *</label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferredTime">Preferred Time *</label>
                <select
                  id="preferredTime"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select time slot</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="17:00">05:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label htmlFor="message">Additional Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Any specific concerns or requests? (Optional)"
                rows="4"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" className="btn-primary">Confirm Booking</button>
          </div>
        </form>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✓</div>
            <h4>Certified Technicians</h4>
            <p>Expert mechanics with years of experience</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h4>Complete Diagnostics</h4>
            <p>Full vehicle inspection and health check</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📞</div>
            <h4>Free Pickup & Drop</h4>
            <p>Convenient service at your doorstep</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h4>Quality Guaranteed</h4>
            <p>All parts covered under warranty</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookService;
