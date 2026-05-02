import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { servicesApi } from "../utils/apiService";
import './ServiceDetail.css';

function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadService = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await servicesApi.getById(id);
        const item = res?.data || res;

        if (!item || item.active === false) {
          throw new Error('Service not found');
        }

        const basePrice = Number(item.basePrice ?? item.price ?? 0);
        const defaultBenefits = [
          'Certified technicians and professional workmanship',
          'Transparent process with service updates',
          'Quality assurance with reliable support',
          'Timely completion with customer-first approach',
          'Trusted parts and tools for better performance'
        ];

        const normalized = {
          id: item._id || item.id,
          title: item.name || item.title || 'Service',
          description: item.description || 'Professional garage service from our certified team.',
          fullDescription: item.longDescription || item.description || 'Our team delivers dependable service with proper diagnostics, clear communication, and quality-focused execution tailored to your vehicle needs.',
          features: Array.isArray(item.features) ? item.features : [],
          benefits: Array.isArray(item.benefits) && item.benefits.length > 0 ? item.benefits : defaultBenefits,
          pricing: basePrice > 0 ? `Starting from ₹${basePrice.toLocaleString()}` : 'Contact us for pricing',
          image: item.image || 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&h=400&fit=crop'
        };

        if (mounted) {
          setService(normalized);
        }
      } catch (fetchError) {
        if (mounted) {
          setError(fetchError.message || 'Failed to load service details');
          setService(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadService();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="service-detail-page">
        <div className="service-not-found">
          <h2>Loading service details...</h2>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="service-detail-page">
        <div className="service-not-found">
          <h2>{error || 'Service not found'}</h2>
          <button onClick={() => navigate('/services')}>Back to Services</button>
        </div>
      </div>
    );
  }

  const handleBookNow = () => {
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

  return (
    <div className="service-detail-page">
      <div className="service-detail-container">
        {/* Header with back button */}
        <div className="detail-header">
          <button className="back-button" onClick={() => navigate('/services')}>
            ← Back to Services
          </button>
        </div>

        {/* Hero section */}
        <div className="detail-hero">
          <img src={service.image} alt={service.title} className="detail-hero-image" />
          <div className="detail-hero-overlay">
            <h1>{service.title}</h1>
            <p className="detail-subtitle">{service.description}</p>
          </div>
        </div>

        {/* Main content */}
        <div className="detail-content">
          <div className="detail-main">
            {/* Overview section */}
            <section className="detail-section">
              <h2>Overview</h2>
              <p>{service.fullDescription}</p>
            </section>

            {/* Features section */}
            <section className="detail-section">
              <h2>What's Included</h2>
              <div className="features-grid">
                {service.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <span className="feature-icon">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Benefits section */}
            <section className="detail-section">
              <h2>Benefits</h2>
              <div className="benefits-list">
                {service.benefits.map((benefit, index) => (
                  <div key={index} className="benefit-item">
                    <span className="benefit-icon">★</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="detail-sidebar">
            <div className="sidebar-card">
              <h3>Service Pricing</h3>
              <p className="pricing-text">{service.pricing}</p>
              <button className="btn-book-now" onClick={handleBookNow}>
                Book This Service
              </button>
            </div>

            <div className="sidebar-card contact-card">
              <h3>Need More Information?</h3>
              <p>Contact our experts for personalized assistance</p>
              <div className="contact-buttons">
                <a href="tel:9913828214" className="btn-contact-call">
                  📞 Call Us
                </a>
                <a href="https://wa.me/919913828214?text=Hi%2C%20tell%20me%20more%20about%20this%20service" target="_blank" rel="noreferrer" className="btn-contact-whatsapp">
                  💬 WhatsApp
                </a>
              </div>
            </div>

            <div className="sidebar-card faq-card">
              <h3>Why Choose Us?</h3>
              <ul className="why-list">
                <li>Certified technicians</li>
                <li>Genuine parts</li>
                <li>Warranty coverage</li>
                <li>Transparent pricing</li>
                <li>24/7 support</li>
              </ul>
            </div>
          </aside>
        </div>

        {/* CTA section */}
        <div className="detail-cta">
          <h2>Ready to Get Started?</h2>
          <p>Book your service today and experience quality automotive care</p>
          <button className="btn-primary-large" onClick={handleBookNow}>
            Book {service.title}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceDetail;
