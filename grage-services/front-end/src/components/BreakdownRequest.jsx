import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from '../context/AuthContext';
import { breakdownApi } from '../utils/apiService';
import "./Breakdown.css";

function BreakdownRequest() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicle: "",
    location: "",
    issue: "",
    shareLocation: true,
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      await breakdownApi.createCall({
        userId: Number(user?.id) > 0 ? Number(user.id) : 1,
        location: form.location,
        customerName: form.name,
        phone: form.phone,
        vehicle: form.vehicle,
        issue: form.issue,
      });
    
    // Add notification for breakdown request
    addNotification({
      type: 'service',
      title: 'Breakdown Request Received',
      message: `Emergency assistance requested for ${form.vehicle} at ${form.location}. Help is on the way!`,
      icon: '🚨',
    });
    
      setSubmitted(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      setSubmitError(error?.message || 'Failed to submit breakdown request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="breakdown-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Request Received</h2>
          <p>Our team has been notified and will call you shortly.</p>
          <button className="btn-primary" onClick={() => navigate("/")}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="breakdown-container">
      <div className="breakdown-hero">
        <h1>🆘 Request Roadside Assistance</h1>
        <p>Tell us where you are and what happened — we’ll handle the rest.</p>
      </div>

      <form className="breakdown-form" onSubmit={handleSubmit}>
        {submitError ? <div className="status-message error">❌ {submitError}</div> : null}
        <div className="form-row">
          <div className="form-group">
            <label>Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} required placeholder="9XXXXXXXXX" />
          </div>
        </div>

        <div className="form-group">
          <label>Vehicle *</label>
          <input name="vehicle" value={form.vehicle} onChange={handleChange} required placeholder="e.g., 2019 Maruti Swift, GJ-01-AB-1234" />
        </div>

        <div className="form-group">
          <label>Location *</label>
          <input name="location" value={form.location} onChange={handleChange} required placeholder="Nearest landmark / Address / Share link" />
        </div>

        <div className="form-group">
          <label>What happened?</label>
          <textarea name="issue" rows="4" value={form.issue} onChange={handleChange} placeholder="Flat tire, engine not starting, out of fuel, etc." />
        </div>

        <label className="checkbox">
          <input type="checkbox" name="shareLocation" checked={form.shareLocation} onChange={handleChange} />
          Share live location with our agent
        </label>

        <div className="actions-row">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Request Help'}</button>
        </div>
      </form>

      <div className="breakdown-grid">
        <div className="b-card">🪫 Battery Jump-start</div>
        <div className="b-card">🛞 Tire Change / Puncture</div>
        <div className="b-card">⛽ Emergency Fuel</div>
        <div className="b-card">🪝 Towing Service</div>
        <div className="b-card">🔧 Quick Mechanical Fix</div>
        <div className="b-card">📑 Accident Assistance</div>
      </div>
    </div>
  );
}

export default BreakdownRequest;
