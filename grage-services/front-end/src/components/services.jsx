import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import './services.css';
import { useAuth } from "../context/AuthContext";
import { servicesApi } from "../utils/apiService";

function Services() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeService, setActiveService] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const assetPath = (path) => encodeURI(path);

  useEffect(() => {
    let mounted = true;

    const loadServices = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const response = await servicesApi.list();
        const list = response?.data || response || [];
        const defaultImages = [
          assetPath('/img/web-images/regular-services/pexels-19x14-8478233.jpg'),
          assetPath('/img/web-images/breakdown/pexels-edurawpro-21831855.jpg'),
          assetPath('/img/web-images/modification/pexels-bylukemiller-32725702.jpg'),
          assetPath('/img/web-images/regular-services/pexels-tami-19499386.jpg'),
          assetPath('/img/web-images/breakdown/pexels-a-q-91521018-18863497.jpg'),
          assetPath('/img/web-images/regular-services/pexels-artempodrez-8986139.jpg'),
          assetPath('/img/web-images/breakdown/pexels-jonathan-reynaga-861774-17429096.jpg'),
          assetPath('/img/web-images/breakdown/pexels-mikebirdy-943930.jpg')
        ];

        const normalized = list
          .filter((service) => service.active !== false)
          .map((service, index) => ({
            id: service._id || service.id,
            title: service.name || service.title || `Service ${index + 1}`,
            icon: service.icon || '🔧',
            description: service.description || 'Professional garage service from our certified team.',
            features: Array.isArray(service.features) ? service.features : [],
            image: service.image || defaultImages[index % defaultImages.length],
          }));

        if (mounted) {
          setServices(normalized);
        }
      } catch (error) {
        if (mounted) {
          setLoadError(error.message || 'Failed to load services');
          setServices([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadServices();
    return () => {
      mounted = false;
    };
  }, []);

  const handleServiceClick = (id) => {
    setActiveService(activeService === id ? null : id);
  };

  const handleBookNow = (service) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname, action: 'book', service: service.title } });
      return;
    }
    navigate('/customer/dashboard', {
      state: {
        activeTab: 'new-booking',
        preselectedServiceId: service.id,
      },
    });
  };

  const handleLearnMore = (service) => {
    navigate(`/service/${service.id}`);
  };

  return (
    <div className="services-page">
      <div className="services-container">
        <div className="services-header">
          <h1>Our Services</h1>
          <p>Comprehensive automotive solutions for all your vehicle needs</p>
        </div>

        {loading && <p>Loading services...</p>}
        {!loading && loadError && <p>{loadError}</p>}
        {!loading && !loadError && services.length === 0 && <p>No services available right now.</p>}

        <div className="services-grid">
        {services.map((service) => (
          <div
            key={service.id}
            className={`service-card ${activeService === service.id ? 'active' : ''}`}
            onClick={() => handleServiceClick(service.id)}
          >
            <div className="service-image">
              <span className="service-icon">{service.icon}</span>
              <img src={service.image} alt={service.title} />
              <div className="service-overlay"></div>
            </div>
            <div className="service-content">
              <h3>{service.title}</h3>
              <p className="service-description">{service.description}</p>
              
              {activeService === service.id && (
                <div className="service-features">
                  <h4>What's Included:</h4>
                  <ul>
                    {service.features.map((feature, index) => (
                      <li key={index}>
                        <span className="check-icon">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="service-actions">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookNow(service);
                      }}
                    >
                      Book Now
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLearnMore(service);
                      }}
                    >
                      Learn More
                    </button>
                  </div>
                </div>
              )}
              
              {activeService !== service.id && (
                <button className="btn-expand">View Details →</button>
              )}
            </div>
          </div>
        ))}
        </div>

        <div className="services-cta">
          <h2>Need Help Choosing a Service?</h2>
          <p>Our experts are here to assist you with the right solution</p>
          <button
            className="btn-contact"
            onClick={() => navigate('/contact')}
          >
            Contact Us
          </button>
        </div>
      </div>
    </div>
  );
}

export default Services;