import React from "react";
import { useNavigate } from "react-router-dom";
import "./Mods.css";

function ModsExplore() {
  const navigate = useNavigate();

  const categories = [
    {
      id: 1,
      title: "🎨 Aesthetic Mods",
      items: ["Body Kit", "Custom Paint", "LED Lights", "Alloy Wheels", "Window Tinting"],
      priceRange: "₹5,000 - ₹50,000",
      image: "https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "⚡ Performance Upgrades",
      items: ["Engine Tuning", "Turbo Kit", "Exhaust System", "Air Intake", "Suspension"],
      priceRange: "₹15,000 - ₹2,00,000",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "🔊 Audio & Entertainment",
      items: ["Sound System", "Subwoofer", "Amplifier", "Android Head Unit", "Dash Cam"],
      priceRange: "₹8,000 - ₹80,000",
      image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80"
    },
    {
      id: 4,
      title: "🛡️ Safety & Comfort",
      items: ["Parking Sensors", "Reverse Camera", "Seat Covers", "Floor Mats", "Sunroof"],
      priceRange: "₹3,000 - ₹60,000",
      image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1400&q=80"
    }
  ];

  return (
    <div className="mods-container">
      <div className="mods-hero">
        <h1>⚙ Vehicle Modification — Explore Mods</h1>
        <p>Expert custom modifications, upgrades, and tuning to enhance performance and aesthetics.</p>
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => navigate("/mods/quote")}>Get a Custom Quote</button>
        </div>
      </div>

      <div className="mods-grid">
        {categories.map((cat) => (
          <div key={cat.id} className="mods-card">
            <div className="mods-card-image" style={{ backgroundImage: `url(${cat.image})` }} />
            <div className="mods-card-body">
              <h3>{cat.title}</h3>
              <ul className="mods-items">
                {cat.items.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
              <div className="mods-price">{cat.priceRange}</div>
              <div className="mods-actions">
                <button className="btn-secondary" onClick={() => navigate("/mods/quote", { state: { category: cat.title } })}>Get Quote</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mods-note">
        Prices are indicative and vary by make/model and part availability. We use genuine parts and provide warranty-backed service.
      </div>
    </div>
  );
}

export default ModsExplore;
