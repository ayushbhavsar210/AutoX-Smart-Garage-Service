import React from "react";
import { useNavigate } from "react-router-dom";
import "./Emergency.css";

function EmergencyInfo() {
  const navigate = useNavigate();

  const services = [
    { icon: "🪝", title: "Towing Service", desc: "Safe towing to the nearest partner workshop" },
    { icon: "🪫", title: "Battery Jump-start", desc: "On-site jump-start and battery test" },
    { icon: "🛞", title: "Tire Assistance", desc: "Puncture repair and tire change" },
    { icon: "⛽", title: "Emergency Fuel", desc: "Fuel delivery to get you moving" },
    { icon: "🔧", title: "Quick Fix", desc: "Minor mechanical fixes done on spot" },
    { icon: "📑", title: "Accident Support", desc: "On-ground coordination and guidance" },
  ];

  return (
    <div className="emg-container">
      <div className="emg-hero">
        <h1>Emergency Roadside Assistance — What We Do</h1>
        <p>Support for accidents, mechanical failures, stuck vehicles, and more. Available 24/7.</p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate("/emergency/sos")}>Request SOS</button>
        </div>
      </div>

      <div className="info-grid">
        {services.map((s, i) => (
          <div key={i} className="info-card">
            <div className="info-icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="emg-faq">
        <h2>Quick FAQ</h2>
        <div className="faq-item">
          <h4>How fast can you reach me?</h4>
          <p>Typically within 20–45 minutes depending on your location and traffic.</p>
        </div>
        <div className="faq-item">
          <h4>What should I do while waiting?</h4>
          <p>Move to a safe area, turn on hazard lights, and keep your phone accessible.</p>
        </div>
        <div className="faq-item">
          <h4>Is the service 24/7?</h4>
          <p>Yes, emergency support is available round the clock.</p>
        </div>
      </div>

      <div className="cta-center">
        <button className="btn-primary" onClick={() => navigate("/emergency/sos")}>🚨 Emergency SOS</button>
      </div>
    </div>
  );
}

export default EmergencyInfo;
