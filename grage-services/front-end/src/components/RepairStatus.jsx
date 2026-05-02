import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Repair.css";

function RepairStatus() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: "", ref: "", reg: "" });
  const [result, setResult] = useState(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // Simulate a lookup
    setResult({
      status: "In Progress",
      eta: "2 days",
      lastUpdate: "Diagnostics complete; parts ordered",
      ticket: form.ref || "RP-2026-00123"
    });
  };

  return (
    <div className="repair-container">
      <div className="repair-hero">
        <h1>🔧 Check Repair Status</h1>
        <p>Track your repair with your phone + reference ID or registration number.</p>
      </div>

      <form className="repair-form" onSubmit={onSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Phone *</label>
            <input name="phone" type="tel" value={form.phone} onChange={onChange} required placeholder="9XXXXXXXXX" />
          </div>
          <div className="form-group">
            <label>Reference ID</label>
            <input name="ref" value={form.ref} onChange={onChange} placeholder="e.g., RP-2026-00123" />
          </div>
        </div>

        <div className="form-group">
          <label>Or Registration No.</label>
          <input name="reg" value={form.reg} onChange={onChange} placeholder="GJ-01-AB-1234" />
        </div>

        <div className="actions-row">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Back</button>
          <button type="submit" className="btn-primary">Check Now</button>
        </div>
      </form>

      {result && (
        <div className="status-card">
          <h3>Current Status</h3>
          <div className="status-row"><strong>Ticket:</strong> {result.ticket}</div>
          <div className="status-row"><strong>State:</strong> {result.status}</div>
          <div className="status-row"><strong>ETA:</strong> {result.eta}</div>
          <div className="status-row"><strong>Last Update:</strong> {result.lastUpdate}</div>
        </div>
      )}
    </div>
  );
}

export default RepairStatus;
