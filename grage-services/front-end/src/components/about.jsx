import React from "react";
import { useNavigate } from "react-router-dom";
import './about.css';
import LazyImage from './LazyImage';

function About() {
  const navigate = useNavigate();
  const assetPath = (path) => encodeURI(path);

  const openCatalog = () => navigate('/service-catalog');

  const highlights = [
    { icon: "🚗", title: "15k+ Vehicles", text: "Serviced and repaired with OEM-grade parts and expert technicians." },
    { icon: "⏱", title: "30 min response", text: "Rapid roadside assistance across the city, day or night." },
    { icon: "⭐", title: "4.9 / 5 rating", text: "Trusted by owners for transparent pricing and reliable outcomes." },
  ];

  const values = [
    { icon: "🧠", title: "Expert Diagnostics", text: "Advanced scanning tools to pinpoint issues fast and accurately." },
    { icon: "🔧", title: "Quality Workmanship", text: "Certified mechanics following strict service SOPs and checklists." },
    { icon: "🛡", title: "Safety First", text: "Double-check QC on brakes, steering, and critical safety systems." },
    { icon: "🤝", title: "Transparent Updates", text: "Live status, photos, and approvals before any extra work." },
    { icon: "⚡", title: "Rapid Turnaround", text: "Smart bays and parts-ready flow to minimize vehicle downtime." },
    { icon: "🌱", title: "Eco Care", text: "Responsible oil disposal, water-saving washes, and clean facilities." },
  ];

  return (
    <div className="about-page">
      <div className="about-container">
        <div className="about-hero">
          <div className="about-copy">
            <p className="eyebrow">About AutoX</p>
            <h1>Trusted automotive partner for every mile</h1>
            <p className="lead">
              We keep your car road-ready with smart diagnostics, preventive maintenance, and 24/7 support.
            </p>
            <div className="about-actions">
              <button className="btn-primary" onClick={() => navigate('/services')}>Explore Services</button>
              <button className="btn-secondary" onClick={openCatalog}>Browse Catalog</button>
            </div>
          </div>
          <figure className="about-media">
            <div className="about-media-img">
              <LazyImage
                src={assetPath('/img/web-images/regular-services/pexels-19x14-8478233.jpg')}
                alt="Professional automotive car service"
                aspectRatio="4/3"
                priority={true}
                className="about-hero-img"
              />
              <div className="about-badge">Expert Care</div>
            </div>
          </figure>
        </div>

        {/* Highlights Section */}
        <div className="about-stats">
          {highlights.map((h, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-icon">{h.icon}</div>
              <div>
                <div className="stat-title">{h.title}</div>
                <div className="stat-text">{h.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Values Section */}
        <div className="about-values">
          <div className="values-header">
            <h2>Why Choose AutoX</h2>
            <p className="lead">We are committed to excellence in everything we do</p>
          </div>
          <div className="values-grid">
            {values.map((v, idx) => (
              <div key={idx} className="value-card">
                <div className="value-icon">{v.icon}</div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="about-cta">
          <div>
            <h3>Ready to experience premium automotive care?</h3>
            <p className="lead">Join thousands of satisfied customers who trust AutoX</p>
          </div>
          <div className="cta-actions">
            <button className="btn-primary" onClick={() => navigate('/services')}>Book Now</button>
            <button className="btn-secondary" onClick={() => navigate('/contact')}>Contact Us</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
