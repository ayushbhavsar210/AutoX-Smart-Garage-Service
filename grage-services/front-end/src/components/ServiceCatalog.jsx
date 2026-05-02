import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import './ServiceCatalog.css';

function ServiceCatalog() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const servicesCatalog = useMemo(() => [
    {
      id: 1,
      icon: "🚗",
      title: "Smart Garage Services",
      text: "Periodic service, diagnostics, OEM parts, pickup & drop.",
      category: "maintenance",
      description: "Complete vehicle diagnostics, maintenance, and scheduled servicing by certified technicians.",
      route: "/service/1",
    },
    {
      id: 2,
      icon: "🛠",
      title: "Breakdown Assistance",
      text: "On-site help for flats, jump-start, fuel, and towing.",
      category: "emergency",
      description: "24/7 roadside support for breakdowns, tire changes, fuel delivery, and quick fixes.",
      route: "/service/2",
    },
    {
      id: 3,
      icon: "⚙",
      title: "Vehicle Modification",
      text: "Performance tuning, body kits, audio upgrades, lighting.",
      category: "customization",
      description: "Expert custom modifications, upgrades, and tuning to enhance performance and aesthetics.",
      route: "/service/3",
    },
    {
      id: 4,
      icon: "🔧",
      title: "Car & Bike Repair",
      text: "Engine, brakes, clutch, suspension with workmanship warranty.",
      category: "repair",
      description: "Comprehensive repair services for all vehicle types with genuine parts and warranty.",
      route: "/service/4",
    },
    {
      id: 5,
      icon: "🚘",
      title: "Emergency Roadside Help",
      text: "24/7 SOS dispatch and priority assistance.",
      category: "emergency",
      description: "Immediate assistance for accidents, mechanical failures, and emergency towing services.",
      route: "/service/5",
    },
    {
      id: 6,
      icon: "✨",
      title: "Vehicle Detailing",
      text: "Professional cleaning, polishing, detailing with ceramic coating.",
      category: "maintenance",
      description: "Professional cleaning, polishing, and detailing to make your vehicle look brand new.",
      route: "/service/6",
    },
    {
      id: 7,
      icon: "🔍",
      title: "Pre-Purchase Inspection",
      text: "Detailed inspection report before buying a used vehicle.",
      category: "inspection",
      description: "Detailed inspection report before buying a used vehicle to ensure quality and safety.",
      route: "/service/7",
    },
    {
      id: 8,
      icon: "⚪",
      title: "Tire & Wheel Services",
      text: "Tire replacement, alignment, balancing, and rotation.",
      category: "maintenance",
      description: "Complete tire solutions including replacement, alignment, balancing, and wheel care.",
      route: "/service/8",
    },
  ], []);

  const categories = [
    { id: "all", label: "All Services", icon: "📋" },
    { id: "maintenance", label: "Maintenance", icon: "🔧" },
    { id: "repair", label: "Repair", icon: "⚒" },
    { id: "emergency", label: "Emergency", icon: "🆘" },
    { id: "customization", label: "Customization", icon: "🎨" },
    { id: "inspection", label: "Inspection", icon: "🔍" },
  ];

  const filteredServices = useMemo(() => {
    let filtered = servicesCatalog;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // Filter by search query
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.text.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [query, selectedCategory, servicesCatalog]);

  const handleServiceClick = (route) => {
    navigate(route);
  };

  return (
    <div className="service-catalog-page">
      <div className="catalog-container">
        {/* Header */}
        <div className="catalog-header">
          <button className="back-button" onClick={() => navigate('/about')}>
            ← Back to About
          </button>
          <div className="catalog-title">
            <h1>Service Catalog</h1>
            <p>Browse our complete range of automotive services</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="catalog-search-section">
          <input
            type="text"
            className="catalog-search-input"
            placeholder="Search services..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="search-icon">🔍</span>
        </div>

        {/* Category Filter */}
        <div className="catalog-categories">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-button ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="catalog-content">
          {filteredServices.length > 0 ? (
            <div className="catalog-grid">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="catalog-card"
                  onClick={() => handleServiceClick(service.route)}
                >
                  <div className="catalog-card-icon">{service.icon}</div>
                  <h3 className="catalog-card-title">{service.title}</h3>
                  <p className="catalog-card-description">{service.text}</p>
                  <p className="catalog-card-full">{service.description}</p>
                  <button className="catalog-card-button">Learn More →</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <div className="empty-icon">🔍</div>
              <h3>No services found</h3>
              <p>Try adjusting your search or category filters</p>
              <button
                className="empty-reset-button"
                onClick={() => {
                  setQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        {filteredServices.length > 0 && (
          <div className="catalog-footer">
            <p>Showing {filteredServices.length} of {servicesCatalog.length} services</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceCatalog;
