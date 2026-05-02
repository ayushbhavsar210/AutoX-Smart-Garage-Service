import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { breakdownApi } from '../utils/apiService';
import "./Breakdown.css";

function BreakdownCall() {
  const navigate = useNavigate();
  const supportNumber = "+919913828214";
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mechanicAssigned, setMechanicAssigned] = useState(null);
  const [assignmentStatus, setAssignmentStatus] = useState(null);
  const [showMap, setShowMap] = useState(false);

  // Hardcoded locations for demo
  const defaultCustomerLocation = { latitude: 23.0225, longitude: 72.5714 }; // Ahmedabad
  const mechanicLocations = [
    { latitude: 23.0304, longitude: 72.5797, distance: 1.2 },
    { latitude: 23.0195, longitude: 72.5650, distance: 0.8 },
    { latitude: 23.0280, longitude: 72.5820, distance: 1.5 },
  ];

  useEffect(() => {
    // Fetch GPS location when component mounts
    fetchGPSLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGPSLocation = () => {
    setLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      // Use default location
      setLocation(defaultCustomerLocation);
      setLoading(false);
      assignMechanicAutomatically(defaultCustomerLocation);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString(),
        };
        setLocation(locationData);
        setLoading(false);
        setShowMap(true);
        // Auto-assign mechanic after location is fetched
        assignMechanicAutomatically(locationData);
      },
      (error) => {
        let errorMessage = "Unable to fetch your location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location permission denied. Using default location.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information is unavailable. Using default location.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "The request to get user location timed out. Using default location.";
        }
        setLocationError(errorMessage);
        // Use default location
        setLocation(defaultCustomerLocation);
        setLoading(false);
        setShowMap(true);
        assignMechanicAutomatically(defaultCustomerLocation);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const assignMechanicAutomatically = async (locationData) => {
    try {
      setAssignmentStatus("Assigning mechanic...");
      
      // Find nearest mechanic from hardcoded locations
      const nearestMechanic = mechanicLocations[Math.floor(Math.random() * mechanicLocations.length)];
      
      // Calculate ETA based on distance (assuming 30 km/h average speed in city)
      const etaMinutes = Math.round((nearestMechanic.distance / 30) * 60) + Math.floor(Math.random() * 5) + 5;
      
      // Simulate mechanic assignment
      const mechanicData = {
        id: "MECH" + Math.floor(Math.random() * 10000),
        name: generateMechanicName(),
        phone: generateMechanicPhone(),
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
        setAssignmentStatus("Mechanic assigned successfully!");
        setShowMap(true);
        
        // Save breakdown call to API
        try {
          breakdownApi.createCall({
            userId: 1,
            location: `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`,
            description: 'Emergency breakdown call',
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            customerName: 'Walk-in Customer',
            phone: '',
            vehicle: '',
            mechanicName: mechanicData.name,
            mechanicPhone: mechanicData.phone,
            eta: mechanicData.eta,
          });
        } catch (err) {
          console.error('Error saving breakdown call:', err);
        }
      }, 1500);
    } catch (error) {
      console.error("Error assigning mechanic:", error);
      setAssignmentStatus("Could not assign mechanic automatically.");
    }
  };

  const getMapUrl = () => {
    if (!location || !mechanicAssigned) return "";
    
    const customerLat = location.latitude;
    const customerLng = location.longitude;
    
    // Simple map view with customer location
    return `https://maps.google.com/maps?q=${customerLat},${customerLng}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  };

  const generateMechanicName = () => {
    const names = ["Rajesh", "Amit", "Vikram", "Suresh", "Arjun", "Rohan", "Nitin", "Deepak"];
    return names[Math.floor(Math.random() * names.length)];
  };

  const generateMechanicPhone = () => {
    return "9" + Math.floor(Math.random() * 900000000 + 100000000);
  };

  const handleRetryLocation = () => {
    setMechanicAssigned(null);
    setAssignmentStatus(null);
    fetchGPSLocation();
  };

  return (
    <div className="breakdown-container">
      <div className="breakdown-hero">
        <h1>🆘 Vehicle Breakdown Assistance</h1>
        <p>24/7 roadside support for breakdowns, tire changes, fuel delivery, and quick fixes.</p>
      </div>

      <div className="breakdown-card">
        <h2>Call Our Support Line</h2>
        
        {/* Location Status */}
        {loading && (
          <div className="status-message info">
            📍 Fetching your location...
          </div>
        )}

        {locationError && (
          <div className="status-message error">
            ❌ {locationError}
            <button className="btn-retry" onClick={handleRetryLocation}>Retry Location</button>
          </div>
        )}

        {location && !loading && (
          <div className="status-message success">
            ✓ Location obtained: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </div>
        )}

        {/* Mechanic Assignment Status */}
        {assignmentStatus && (
          <div className="status-message info">
            🔧 {assignmentStatus}
          </div>
        )}

        {mechanicAssigned && (
          <div className="mechanic-card">
            <h3>Mechanic Assigned</h3>
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
            <h3>📍 Live Tracking</h3>
            <div className="map-wrapper">
              <iframe
                title="Location Map"
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
                <span className="marker mechanic">🔧</span>
                <span>Mechanic Location ({mechanicAssigned.location.latitude.toFixed(4)}, {mechanicAssigned.location.longitude.toFixed(4)})</span>
              </div>
              <div className="eta-display">
                <strong>Estimated Arrival:</strong> {mechanicAssigned.eta} minutes ({mechanicAssigned.distance} km)
              </div>
            </div>
          </div>
        )}

        <p>Tap the button below to call our emergency line. We'll dispatch help immediately.</p>
      <a className="btn-primary call-btn" href={`tel:${supportNumber}`}>📞 Call Now: 9913828214</a>
        
        <div className="tip">
          Your location has been automatically shared with our team for faster assistance.
        </div>

        <div className="actions-row">
          <button className="btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
          <button className="btn-secondary" onClick={() => navigate("/breakdown/request")}>Request Help Form</button>
        </div>
      </div>

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

export default BreakdownCall;
