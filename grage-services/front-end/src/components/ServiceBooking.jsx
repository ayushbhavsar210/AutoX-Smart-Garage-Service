import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context';
import { useNotifications } from '../context/NotificationContext';
import { servicesApi } from '../utils/apiService';
import PaymentGateway from './PaymentGateway';
import './BookService.css';

function ServiceBooking() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBooking } = useBookings();
  const { addNotification } = useNotifications();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    vehicle: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  // Fetch service from database; if missing/inactive, show not found.
  useEffect(() => {
    let active = true;
    const loadService = async () => {
      setServiceLoading(true);
      try {
        const res = await servicesApi.getById(serviceId);
        const svc = res?.data || res;
        if (svc && svc.active !== false && active) {
          const basePrice = Number(svc.price ?? svc.basePrice ?? 0);
          const gst = Number(svc.gst ?? Math.round(basePrice * 0.18));
          setSelectedService({
            id: svc._id || svc.id,
            title: svc.title || svc.name || 'Service',
            icon: svc.icon || '🚗',
            price: basePrice,
            gst,
            description: svc.description || '',
            features: svc.features || [],
          });
          setServiceLoading(false);
          return;
        }
      } catch (err) {
        console.warn(`Service API call failed for serviceId: ${serviceId}`, err);
      }
      if (active) {
        setSelectedService(null);
        setServiceLoading(false);
      }
    };

    loadService();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Create booking in backend FIRST with pending status
      // Keep serviceId as string if it's not numeric (could be MongoDB ObjectId)
      const parsedServiceId = isNaN(Number(serviceId)) ? serviceId : Number(serviceId);
      
      const bookingPayload = {
        userId: user?.id,
        serviceId: parsedServiceId,
        serviceName: selectedService.title,
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        vehicleNumber: formData.vehicle,
        date: formData.preferredDate,
        timeSlot: formData.preferredTime,
        notes: formData.message,
        amount: Number(selectedService.price + selectedService.gst),
        paymentMethod: 'Razorpay',
        paymentStatus: 'Pending',
        status: 'pending',
      };

      const createResult = await createBooking(bookingPayload);
      
      if (!createResult.success) {
        addNotification({
          type: 'error',
          title: 'Booking Failed',
          message: `Could not create booking: ${createResult.error}`,
          icon: '❌',
        });
        return;
      }

      const createdBooking = createResult?.data;
      setBookingData(createdBooking);
      setShowPayment(true);
      
      // Add notification for booking initiation
      addNotification({
        type: 'booking',
        title: 'Booking Initiated',
        message: `${selectedService.title} booking created. Please complete payment.`,
        icon: '📋',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Booking Failed',
        message: error.message || 'Could not create booking',
        icon: '❌',
      });
    }
  };

  const handlePaymentComplete = async (paymentDetails) => {
    if (!bookingData?.id) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Booking data is missing',
        icon: '❌',
      });
      return;
    }

    try {
      // Payment is already verified and booking is updated on the backend
      // Just notify the user and redirect
      
      addNotification({
        type: 'payment',
        title: 'Payment Successful',
        message: `Payment of ₹${paymentDetails.amount} processed successfully`,
        icon: '💳',
      });
      
      addNotification({
        type: 'booking',
        title: 'Booking Confirmed',
        message: `Your ${selectedService.title} is scheduled for ${formData.preferredDate} at ${formData.preferredTime}`,
        icon: '✅',
      });

      setShowPayment(false);
      setSubmitted(true);

      // Redirect to payment success page
      setTimeout(() => {
        navigate(`/payment-success/${bookingData.id}`);
      }, 1500);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Could not complete booking',
        icon: '❌',
      });
    }
  };

  if (serviceLoading) {
    return (
      <div className="book-service-container">
        <div className="error-message">
          <h2>Loading Service...</h2>
          <p>Please wait while we fetch service details.</p>
        </div>
      </div>
    );
  }

  if (!selectedService) {
    return (
      <div className="book-service-container">
        <div className="error-message">
          <h2>Service Not Found</h2>
          <p>The service you're looking for doesn't exist.</p>
          <button className="btn-primary" onClick={() => navigate('/services')}>Back to Services</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="book-service-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Booking Confirmed! 🎉</h2>
          <p>Thank you for booking {selectedService.title} with AUTOX. Payment of ₹{(selectedService.price + selectedService.gst).toLocaleString()} has been processed successfully.</p>
          <p className="confirmation-ref">Confirmation email sent to: {formData.email}</p>
          <p className="confirmation-ref">Your booking has been confirmed and our team will contact you shortly to finalize details.</p>
          <button className="btn-primary" onClick={() => navigate('/services')}>Back to Services</button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-service-container">
      <div className="book-service-wrapper">
        <div className="book-header">
          <h1>{selectedService.icon} {selectedService.title} - Book Service</h1>
          <p>{selectedService.description}</p>
        </div>

        <div className="service-features-section">
          <h3>What's Included:</h3>
          <ul className="features-list">
            {selectedService.features.map((feature, index) => (
              <li key={index}>
                <span className="check-icon">✓</span> {feature}
              </li>
            ))}
          </ul>
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
                  placeholder="Your phone number"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Vehicle Information</h3>
            <div className="form-group">
              <label htmlFor="vehicle">Vehicle Details *</label>
              <input
                type="text"
                id="vehicle"
                name="vehicle"
                value={formData.vehicle}
                onChange={handleChange}
                placeholder="e.g., Honda Civic 2020, Maruti Swift 2022"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Appointment Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="preferredDate">Preferred Date *</label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
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
                  <option value="">Select a time slot</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="form-group">
              <label htmlFor="message">Special Requirements (Optional)</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Any specific requirements or concerns..."
                rows="5"
              ></textarea>
            </div>
          </div>

          <div className="price-summary-section">
            <h3>Payment Summary</h3>
            <div className="price-summary">
              <div className="summary-row">
                <span>Service Charge:</span>
                <span>₹{selectedService.price.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>GST (18%):</span>
                <span>₹{selectedService.gst.toLocaleString()}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>₹{(selectedService.price + selectedService.gst).toLocaleString()}</span>
              </div>
            </div>
            <p className="payment-note">Payment will be processed securely in the next step</p>
          </div>

          <div className="booking-info-box">
            <p>📞 <strong>Need immediate assistance?</strong></p>
            <p>Call us at <a href="tel:9913828214">9913828214</a> or WhatsApp at <a href="https://wa.me/919913828214" target="_blank" rel="noreferrer">+91 9913828214</a></p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/services')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Proceed to Payment
            </button>
          </div>
        </form>
      </div>

      {/* Payment Gateway Modal */}
      <PaymentGateway 
        amount={selectedService.price + selectedService.gst}
        serviceName={selectedService.title}
        isOpen={showPayment}
        bookingId={bookingData?.id}
        onPaymentComplete={handlePaymentComplete}
        onCancel={() => setShowPayment(false)}
      />
    </div>
  );
}

export default ServiceBooking;
