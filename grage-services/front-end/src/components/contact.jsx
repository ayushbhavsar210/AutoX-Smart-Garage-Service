import React, { useState } from 'react';
import './contact.css';
import { contactApi } from '../utils/apiService';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await contactApi.submit(formData);

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: ''
      });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('Contact form submit error:', err);
      setError('Could not send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <h1>Get in Touch with AutoX</h1>
        <p>We're here to help with all your vehicle needs 24/7</p>
      </div>

      <div className="contact-container">
        {/* Contact Form */}
        <div className="contact-form-section">
          <h2>Send Us a Message</h2>
          {submitted && <div className="success-msg">✓ Message sent successfully! We'll get back to you soon.</div>}
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
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
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="service">Service Interested In</label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleChange}
              >
                <option value="">Select a service</option>
                <option value="garage">Smart Garage Services</option>
                <option value="breakdown">Vehicle Breakdown Assistance</option>
                <option value="modification">Vehicle Modification</option>
                <option value="repair">Car & Bike Repair</option>
                <option value="emergency">Emergency Roadside Help</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us more about your inquiry..."
                rows="5"
              ></textarea>
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="contact-info-section">
          <h2>Contact Information</h2>
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon social phone" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M8.8 4.2 6.7 6.9c-.4.5-.5 1.2-.2 1.8 1.1 2.2 2.9 4 5.1 5.1.6.3 1.3.2 1.8-.2l2.7-2.1c.2-.2.5-.2.8-.1l2.7 1.1c.6.2 1 .8 1 1.4v2.7c0 .9-.7 1.6-1.6 1.6-8.4 0-15.2-6.8-15.2-15.2 0-.9.7-1.6 1.6-1.6h2.7c.6 0 1.1.4 1.4 1l1.1 2.7c.1.3 0 .6-.1.8Z" fill="white"/>
                </svg>
              </div>
              <h3>Phone</h3>
              <p><a href="tel:+919913828214">+91 9913828214</a></p>
            </div>
            <div className="info-card">
              <div className="info-icon social email" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="3" y="5" width="18" height="14" rx="2" fill="white"/>
                  <path d="M4 7.5 11.4 12c.38.24.86.24 1.24 0L20 7.5" stroke="#c53030" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Email</h3>
              <p><a href="mailto:autoxgarageservice@gmail.com">autoxgarageservice@gmail.com</a></p>
            </div>
            <div className="info-card">
              <div className="info-icon social whatsapp" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 4.5c-3.7 0-6.7 2.8-6.7 6.4 0 1.2.36 2.3.97 3.2l-.64 2.4 2.46-.63c.86.55 1.9.86 3 .86 3.7 0 6.7-2.8 6.7-6.4S15.7 4.5 12 4.5Z" stroke="white" strokeWidth="1.4" fill="none"/>
                  <path d="M9.7 9.2c-.1-.23-.2-.23-.3-.23h-.3c-.1 0-.3.04-.4.2-.1.14-.5.5-.5 1.2s.5 1.4.6 1.5c.1.2 1 1.6 2.5 2.2 1.2.48 1.5.39 1.7.36.3-.03.8-.32.9-.64.1-.32.1-.6.07-.65-.04-.06-.1-.1-.2-.17-.1-.08-.8-.4-.9-.44-.1-.04-.2-.07-.3.07-.1.14-.4.44-.5.53-.1.1-.2.1-.3.03-.1-.07-.7-.26-1.3-.82-.5-.46-.8-1.03-.9-1.2-.1-.18-.01-.27.06-.34.07-.07.2-.23.3-.34.1-.12.1-.2.2-.34.1-.14.03-.25 0-.34-.03-.08-.3-.76-.4-1.04Z" fill="white"/>
                </svg>
              </div>
              <h3>WhatsApp</h3>
              <p><a href="https://wa.me/919913828214" target="_blank" rel="noreferrer">Chat with us</a></p>
            </div>
            <div className="info-card">
              <div className="info-icon social instagram" aria-hidden>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <defs>
                    <linearGradient id="igGradient" x1="4" y1="20" x2="20" y2="4" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#feda75" />
                      <stop offset="50%" stopColor="#d62976" />
                      <stop offset="100%" stopColor="#4f5bd5" />
                    </linearGradient>
                  </defs>
                  <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#igGradient)" />
                  <circle cx="12" cy="12" r="4.25" stroke="white" strokeWidth="1.6" fill="none" />
                  <circle cx="17" cy="7" r="1.15" fill="white" />
                </svg>
              </div>
              <h3>Instagram</h3>
              <p>
                <a
                  href="https://www.instagram.com/autox2334"
                  target="_blank"
                  rel="noreferrer"
                >
                  @autox2334
                </a>
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon social twitter" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L2.99 21.75H.255l7.73-8.835L.461 2.25h6.826l4.822 6.383 5.945-6.383zM17.15 19.038h1.83L6.63 4.182H4.69l12.46 14.856z"/>
                </svg>
              </div>
              <h3>X (Twitter)</h3>
              <p>
                <a
                  href="https://x.com/AutoX115686"
                  target="_blank"
                  rel="noreferrer"
                >
                  @AutoX115686
                </a>
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon social facebook" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M14.5 8.25H16V5.5h-2.2c-2.3 0-3.8 1.35-3.8 3.6V11H8v2.5h2v5h2.75v-5h2.04L15.1 11h-2.35V9.35c0-.68.28-1.1 1.75-1.1Z"
                    fill="white"
                  />
                </svg>
              </div>
              <h3>Facebook</h3>
              <p>
                <a
                  href="https://www.facebook.com/share/1ASZ2KYutD/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Follow on Facebook
                </a>
              </p>
            </div>
            <div className="info-card">
              <div className="info-icon">🕐</div>
              <h3>Hours</h3>
              <p>24/7 Available</p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="contact-map-section">
          <h2>Visit Our Location</h2>
          <p>Find us on the map and visit our service center</p>
          <div className="map-container">
            <iframe
              title="AutoX Service Center Location"
              width="100%"
              height="450"
              style={{ border: 0, borderRadius: '12px' }}
              loading="lazy"
              allowFullScreen=""
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.618256968827!2d72.52521!3d23.03454!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e84e7f7f7f7f7%3A0x1234567890abcdef!2sAhmedabad%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1234567890"
            ></iframe>
          </div>
          <div className="map-info">
            <h3>AutoX Service Center</h3>
            <p>📍 Ahmedabad, Gujarat, India</p>
            <p>Open 24/7 for emergency services</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
