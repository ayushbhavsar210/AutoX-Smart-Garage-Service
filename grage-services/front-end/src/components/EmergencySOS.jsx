import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Emergency.css";

function EmergencySOS() {
  const navigate = useNavigate();
  const supportNumber = "+919913828214";
  const [location, setLocation] = useState(null);
  const [mechanicAssigned, setMechanicAssigned] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hardcoded locations for demo
  const defaultCustomerLocation = { latitude: 23.0225, longitude: 72.5714 }; // Ahmedabad
  const mechanicLocations = [
    { latitude: 23.0304, longitude: 72.5797, distance: 1.2 },
    { latitude: 23.0195, longitude: 72.5650, distance: 0.8 },
    { latitude: 23.0280, longitude: 72.5820, distance: 1.5 },
  ];

  useEffect(() => {
    fetchLocationAndAssignMechanic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLocationAndAssignMechanic = () => {
    if (!navigator.geolocation) {
      setLocation(defaultCustomerLocation);
      assignMechanic(defaultCustomerLocation);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(locationData);
        setLoading(false);
        assignMechanic(locationData);
      },
      () => {
        setLocation(defaultCustomerLocation);
        setLoading(false);
        assignMechanic(defaultCustomerLocation);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const assignMechanic = (locationData) => {
    const nearestMechanic = mechanicLocations[Math.floor(Math.random() * mechanicLocations.length)];
    const etaMinutes = Math.round((nearestMechanic.distance / 30) * 60) + Math.floor(Math.random() * 5) + 3;
    
    const mechanicData = {
      name: ["Rajesh", "Amit", "Vikram", "Suresh"][Math.floor(Math.random() * 4)],
      phone: "9" + Math.floor(Math.random() * 900000000 + 100000000),
      rating: (4 + Math.random()).toFixed(1),
      location: {
        latitude: nearestMechanic.latitude,
        longitude: nearestMechanic.longitude,
      },
      distance: nearestMechanic.distance,
      eta: etaMinutes,
    };

    setTimeout(() => {
      setMechanicAssigned(mechanicData);
      setShowMap(true);
    }, 1000);
  };

  const getMapUrl = () => {
    if (!location) return "";
    return `https://maps.google.com/maps?q=${location.latitude},${location.longitude}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  };

  return (
    <div className="emg-container">
      <div className="emg-hero">
        <h1>🚘 Emergency Roadside Help</h1>
        <p>Immediate assistance for accidents, mechanical failures, and emergency towing services.</p>
      </div>

      <div className="emg-card">
        <h2>Emergency SOS</h2>

        {loading && <div className="status-message info">📍 Locating you...</div>}

        {mechanicAssigned && (
          <div className="mechanic-card">
            <h3>Emergency Responder Assigned</h3>
            <div className="mechanic-info">
              <p><strong>Name:</strong> {mechanicAssigned.name}</p>
              <p><strong>Phone:</strong> {mechanicAssigned.phone}</p>
              <p><strong>Rating:</strong> ⭐ {mechanicAssigned.rating}</p>
              <p><strong>Distance:</strong> {mechanicAssigned.distance} km away</p>
              <p><strong>ETA:</strong> {mechanicAssigned.eta} minutes</p>
            </div>
          </div>
        )}

        {/* Map Display */}
        {showMap && location && mechanicAssigned && (
          <div className="map-container">
            <h3>📍 Live Emergency Tracking</h3>
            <div className="map-wrapper">
              <iframe
                title="Emergency Location Map"
                width="100%"
                height="400"
                frameBorder="0"
                style={{ border: 0, borderRadius: "12px" }}
                src={getMapUrl()}
                allowFullScreen
              ></iframe>
            </div>
            <div className="map-legend">
              <div className="legend-item">
                <span className="marker customer">📍</span>
                <span>Your Location ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)})</span>
              </div>
              <div className="legend-item">
                <span className="marker mechanic">🚑</span>
                <span>Emergency Responder ({mechanicAssigned.location.latitude.toFixed(4)}, {mechanicAssigned.location.longitude.toFixed(4)})</span>
              </div>
              <div className="eta-display">
                <strong>⚡ Emergency Response ETA:</strong> {mechanicAssigned.eta} minutes ({mechanicAssigned.distance} km)
              </div>
            </div>
          </div>
        )}

        <p>Tap to call our emergency line. We'll dispatch help immediately.</p>
      <a className="btn-primary call-btn" href={`tel:${supportNumber}`}>📞 Call Now: 9913828214</a>
        <div className="tip">Your location has been shared with our emergency responder for immediate assistance.</div>
        <div className="actions-row">
          <button className="btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
          <button className="btn-secondary" onClick={() => navigate("/emergency/info")}>Learn More</button>
        </div>
      </div>

      <div className="emg-grid">
        <div className="e-card">🪝 Towing Service</div>
        <div className="e-card">🪫 Battery Jump-start</div>
        <div className="e-card">🛞 Tire Change / Puncture</div>
        <div className="e-card">⛽ Emergency Fuel</div>
        <div className="e-card">🔧 Quick Mechanical Fix</div>
        <div className="e-card">📑 Accident Assistance</div>
      </div>
    </div>
  );
}

export default EmergencySOS;
