import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import "./Repair.css";

function RepairSchedule() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle: "",
    registration: "",
    preferredDate: "",
    preferredTime: "",
    pickupDrop: true,
    issue: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    console.log("Repair schedule submitted:", form);
    
    // Add notification for repair schedule
    addNotification({
      type: 'booking',
      title: 'Repair Scheduled',
      message: `Your repair appointment for ${form.vehicle} has been scheduled for ${form.preferredDate} at ${form.preferredTime}.`,
      icon: '🔧',
    });
    
    setSubmitted(true);
    setTimeout(() => navigate("/"), 2000);
  };

  if (submitted) {
    return (
      <div className="repair-container">
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Repair Scheduled</h2>
          <p>We have received your repair request. Our team will confirm the slot shortly.</p>
          <button className="btn-primary" onClick={() => navigate("/")}>Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="repair-container">
      <div className="repair-hero">
        <h1>🔧 Schedule Repair</h1>
        <p>Comprehensive repair services with genuine parts and warranty.</p>
      </div>

      <form className="repair-form" onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Name *</label>
            <input name="name" value={form.name} onChange={onChange} required placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input name="phone" type="tel" value={form.phone} onChange={onChange} required placeholder="9XXXXXXXXX" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@email.com" />
          </div>
          <div className="form-group">
            <label>Registration No.</label>
            <input name="registration" value={form.registration} onChange={onChange} placeholder="GJ-01-AB-1234" />
          </div>
        </div>

        <div className="form-group">
          <label>Vehicle *</label>
          <input name="vehicle" value={form.vehicle} onChange={onChange} required placeholder="e.g., 2018 Honda City, Petrol" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Preferred Date *</label>
            <input name="preferredDate" type="date" value={form.preferredDate} onChange={onChange} required />
          </div>
          <div className="form-group">
            <label>Preferred Time *</label>
            <select name="preferredTime" value={form.preferredTime} onChange={onChange} required>
              <option value="">Select</option>
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

        <label className="checkbox">
          <input type="checkbox" name="pickupDrop" checked={form.pickupDrop} onChange={onChange} />
          Need free pickup & drop (within city limits)
        </label>

        <div className="form-group">
          <label>Issue Description</label>
          <textarea name="issue" rows="4" value={form.issue} onChange={onChange} placeholder="Describe the problem you're facing" />
        </div>

        <div className="actions-row">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary">Confirm Schedule</button>
        </div>
      </form>

      <div className="repair-grid">
        <div className="r-card">🧰 Multi-point Inspection</div>
        <div className="r-card">🛞 Brake & Suspension</div>
        <div className="r-card">⚙️ Engine & Transmission</div>
        <div className="r-card">🔋 Electrical & Battery</div>
        <div className="r-card">🧼 AC & Detailing</div>
        <div className="r-card">🪙 Warranty Coverage</div>
      </div>
    </div>
  );
}

export default RepairSchedule;
