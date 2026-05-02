import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import './home.css';

function Home() {
  const navigate = useNavigate();

  const assetPath = (path) => encodeURI(path);

  const [expandedService, setExpandedService] = useState(null);
  const [clickEffect, setClickEffect] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Home page carousel images
  const heroImages = [
    assetPath('/img/web-images/regular-services/pexels-19x14-8478233.jpg'),
    assetPath('/img/web-images/regular-services/pexels-lynxexotics-15489246.jpg'),
    assetPath('/img/web-images/regular-services/pexels-tami-19499386.jpg'),
    assetPath('/img/web-images/breakdown/pexels-a-q-91521018-18863497.jpg'),
    assetPath('/img/web-images/breakdown/pexels-edurawpro-21831855.jpg'),
  ];
  const heroVideoSrc = assetPath('/img/web-images/animation/animeson.mp4');

  // Auto-rotate images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const services = [
    { id: 1, name: " Smart Garage Services", details: "Full vehicle diagnostics, maintenance, and scheduled servicing by certified technicians.", actions: ["Book Service", "View Packages"] },
    { id: 2, name: " Vehicle Breakdown Assistance", details: "24/7 roadside support for breakdowns, tire changes, fuel delivery, and quick fixes.", actions: ["Call Now", "Request Help"] },
    { id: 3, name: " Vehicle Modification", details: "Expert custom modifications, upgrades, and tuning to enhance performance and aesthetics.", actions: ["Explore Mods", "Get Quote"] },
    { id: 4, name: " Car & Bike Repair", details: "Comprehensive repair services for all vehicle types with genuine parts and warranty.", actions: ["Schedule Repair", "Check Status"] },
    { id: 5, name: " Emergency Roadside Help", details: "Immediate assistance for accidents, mechanical failures, and emergency towing services.", actions: ["Emergency SOS", "Learn More"] }
  ];

  const packages = [
    {
      id: 'basic',
      name: 'Basic Care',
      price: 999,
      features: [
        'Quick health check',
        'Engine oil top-up',
        'Exterior wash',
      ],
      cta: 'Choose Basic',
    },
    {
      id: 'standard',
      name: 'Standard Service',
      price: 2499,
      features: [
        'Full periodic service',
        'Free pickup & drop',
        '6-month support',
      ],
      popular: true,
      cta: 'Choose Standard',
    },
    {
      id: 'premium',
      name: 'Premium Plus',
      price: 5999,
      features: [
        'Full service + detailing',
        'Priority roadside help',
        '1-year support',
      ],
      cta: 'Choose Premium',
    },
  ];

  const [expandedPackage, setExpandedPackage] = useState(null);
  const togglePackage = (id) => {
    setExpandedPackage(expandedPackage === id ? null : id);
  };

  const [showPackages, setShowPackages] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showSupportMessage, setShowSupportMessage] = useState(false);
  const [showModsGallery, setShowModsGallery] = useState(false);
  const [showQuoteRequest, setShowQuoteRequest] = useState(false);
  const [showRepairSchedule, setShowRepairSchedule] = useState(false);
  const [showRepairStatus, setShowRepairStatus] = useState(false);
  const [showEmergencySOS, setShowEmergencySOS] = useState(false);
  const [showEmergencyInfo, setShowEmergencyInfo] = useState(false);

  // Vehicle Modifications data
  const modifications = [
    {
      id: 1,
      category: '🎨 Aesthetic Mods',
      items: ['Body Kit', 'Custom Paint', 'LED Lights', 'Alloy Wheels', 'Window Tinting'],
      priceRange: '₹5,000 - ₹50,000'
    },
    {
      id: 2,
      category: '⚡ Performance Upgrades',
      items: ['Engine Tuning', 'Turbo Kit', 'Exhaust System', 'Air Intake', 'Suspension'],
      priceRange: '₹15,000 - ₹2,00,000'
    },
    {
      id: 3,
      category: '🔊 Audio & Entertainment',
      items: ['Sound System', 'Subwoofer', 'Amplifier', 'Android Head Unit', 'Dash Cam'],
      priceRange: '₹8,000 - ₹80,000'
    },
    {
      id: 4,
      category: '🛡️ Safety & Comfort',
      items: ['Parking Sensors', 'Reverse Camera', 'Seat Covers', 'Floor Mats', 'Sunroof'],
      priceRange: '₹3,000 - ₹60,000'
    }
  ];
  
  const toggleService = (id) => {
    setExpandedService(expandedService === id ? null : id);
  };

  const handleServiceAction = (serviceId, action) => {
    // Trigger click effect animation
    setClickEffect({ serviceId, action });
    setTimeout(() => setClickEffect(null), 300);

    if (serviceId === 1 && action === 'View Packages') {
      navigate('/view-packages');
    }
    if (serviceId === 1 && action === 'Book Service') {
      navigate('/book-service/1');
    }
    
    // Vehicle Breakdown Assistance actions (service id: 2)
    if (serviceId === 2 && action === 'Call Now') {
      navigate('/breakdown/call');
    }
    if (serviceId === 2 && action === 'Request Help') {
      navigate('/breakdown/request');
    }
    
    // Vehicle Modification actions (service id: 3)
    if (serviceId === 3 && action === 'Explore Mods') {
      navigate('/mods/explore');
    }
    if (serviceId === 3 && action === 'Get Quote') {
      navigate('/mods/quote');
    }
    
    // Car & Bike Repair actions (service id: 4)
    if (serviceId === 4 && action === 'Schedule Repair') {
      navigate('/repair/schedule');
    }
    if (serviceId === 4 && action === 'Check Status') {
      navigate('/repair/status');
    }

    // Emergency Roadside Help actions (service id: 5)
    if (serviceId === 5 && action === 'Emergency SOS') {
      navigate('/emergency/sos');
    }
    if (serviceId === 5 && action === 'Learn More') {
      navigate('/emergency/info');
    }
  };

  // Close packages when clicking outside the services aside or collapsing Smart Garage
  const servicesAsideRef = useRef(null);
  const packagesScrollRef = useRef(null);
  const bookingModalRef = useRef(null);
  const packagesModalRef = useRef(null);
  const supportMessageModalRef = useRef(null);
  const modsGalleryModalRef = useRef(null);
  const quoteRequestModalRef = useRef(null);
  const repairScheduleModalRef = useRef(null);
  const repairStatusModalRef = useRef(null);
  const emergencySOSModalRef = useRef(null);
  const emergencyInfoModalRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (showPackages && packagesModalRef.current && !packagesModalRef.current.contains(e.target)) {
        setShowPackages(false);
      }
      if (showBooking && bookingModalRef.current && !bookingModalRef.current.contains(e.target)) {
        setShowBooking(false);
      }
      if (showSupportMessage && supportMessageModalRef.current && !supportMessageModalRef.current.contains(e.target)) {
        setShowSupportMessage(false);
      }
      if (showModsGallery && modsGalleryModalRef.current && !modsGalleryModalRef.current.contains(e.target)) {
        setShowModsGallery(false);
      }
      if (showQuoteRequest && quoteRequestModalRef.current && !quoteRequestModalRef.current.contains(e.target)) {
        setShowQuoteRequest(false);
      }
      if (showRepairSchedule && repairScheduleModalRef.current && !repairScheduleModalRef.current.contains(e.target)) {
        setShowRepairSchedule(false);
      }
      if (showRepairStatus && repairStatusModalRef.current && !repairStatusModalRef.current.contains(e.target)) {
        setShowRepairStatus(false);
      }
      if (showEmergencySOS && emergencySOSModalRef.current && !emergencySOSModalRef.current.contains(e.target)) {
        setShowEmergencySOS(false);
      }
      if (showEmergencyInfo && emergencyInfoModalRef.current && !emergencyInfoModalRef.current.contains(e.target)) {
        setShowEmergencyInfo(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showPackages, showBooking, showSupportMessage, showModsGallery, showQuoteRequest, showRepairSchedule, showRepairStatus, showEmergencySOS, showEmergencyInfo]);

  const scrollPackages = (direction) => {
    const el = packagesScrollRef.current;
    if (!el) return;
    const amount = 320 * direction;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <>
      <div className="home-bg">
        {/* Tip: To use a local image, add public/bg.jpg and replace the URL in .home-bg in CSS */}
        <div className="home">
          {/* Animated Hero Video Section */}
          <div className="hero-animation-section">
            {videoAvailable ? (
              <video
                className="hero-animation-video"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                onError={() => setVideoAvailable(false)}
              >
                <source src={heroVideoSrc} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div
                className="hero-animation-fallback"
                style={{ backgroundImage: `url('${heroImages[currentImageIndex]}')` }}
              />
            )}
            <div className="hero-animation-overlay">
              <h1 className="hero-animation-title">Welcome to AUTOX</h1>
              <p className="hero-animation-subtitle">Premium automotive services at your fingertips</p>
            </div>
          </div>

          <div className="home-hero">
          <div className="home-copy">
            <h1>Your Complete Automotive Solution</h1>
            <p className="lead">Premium support for every ride—from routine service to urgent roadside help.</p>
          </div>

        <figure className="hero-media">
          <div className="hero-media-img">
            <img
              src={heroImages[currentImageIndex]}
              alt="Professional automotive service"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="hero-slider-image"
              onError={() => {
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
              }}
            />
          </div>
          <div className="hero-image-dots">
            {heroImages.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
          <figcaption>
          </figcaption>
        </figure>

        <aside className="services-card" ref={servicesAsideRef}>
          <h3>Services</h3>
          <ul className="services-list">
            {services.map((service) => (
              <li
                key={service.id}
                className={`service-item ${expandedService === service.id ? 'expanded' : ''}`}
                onClick={() => toggleService(service.id)}
              >
                <div className="service-title">{service.name}</div>
                {expandedService === service.id && (
                  <>
                    <div className="service-details">{service.details}</div>
                    <div className="service-actions">
                      {service.actions.map((action, idx) => (
                        <button
                          key={idx}
                          className={`action-btn ${clickEffect?.serviceId === service.id && clickEffect?.action === action ? 'clicked' : ''}`}
                          onClick={(e) => { e.stopPropagation(); handleServiceAction(service.id, action); }}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>


          {/* Packages nested inside Services */}
          {showPackages && (
            <div className="packages" onClick={(e) => e.stopPropagation()}>
              <div className="packages-header">
                <h3>Packages</h3>
                <p className="packages-sub">Best value bundles for routine maintenance and peace of mind.</p>
              </div>

              <div className="packages-grid-modal">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`package-card ${pkg.popular ? 'popular' : ''} ${expandedPackage === pkg.id ? 'expanded' : ''}`}
                    onClick={() => togglePackage(pkg.id)}
                  >
                    <div className="package-top">
                      <div className="package-top-left">
                        <span className="caret">▸</span>
                        <div className="package-name">{pkg.name}</div>
                        {pkg.popular && <span className="badge">Popular</span>}
                      </div>
                      <div className="price">
                        <span className="currency">₹</span>
                        <span className="value">{pkg.price}</span>
                        <span className="term">/service</span>
                      </div>
                    </div>
                    <div className="package-details">
                      <ul className="features">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx}>{feat}</li>
                        ))}
                      </ul>
                      <button className="choose-btn" onClick={(e) => e.stopPropagation()}>{pkg.cta || 'Choose Plan'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {showPackages && (
            <div className="packages" onClick={(e) => e.stopPropagation()}>
              <div className="packages-header">
                <h3>Packages</h3>
                <p className="packages-sub">Best value bundles for routine maintenance and peace of mind.</p>
              </div>

              <div className="packages-scroll" ref={packagesScrollRef}>
                <div className="packages-track">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`package-card ${pkg.popular ? 'popular' : ''} ${expandedPackage === pkg.id ? 'expanded' : ''}`}
                      onClick={() => togglePackage(pkg.id)}
                    >
                      <div className="package-top">
                        <div className="package-top-left">
                          <span className="caret">▸</span>
                          <div className="package-name">{pkg.name}</div>
                          {pkg.popular && <span className="badge">Popular</span>}
                        </div>
                        <div className="price">
                          <span className="currency">₹</span>
                          <span className="value">{pkg.price}</span>
                          <span className="term">/service</span>
                        </div>
                      </div>
                      <div className="package-details">
                        <ul className="features">
                          {pkg.features.map((feat, idx) => (
                            <li key={idx}>{feat}</li>
                          ))}
                        </ul>
                        <button className="choose-btn" onClick={(e) => e.stopPropagation()}>{pkg.cta || 'Choose Plan'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="slider-btn prev"
                aria-label="Previous packages"
                onClick={(e) => { e.stopPropagation(); scrollPackages(-1); }}
              >
                ◂
              </button>
              <button
                className="slider-btn next"
                aria-label="Next packages"
                onClick={(e) => { e.stopPropagation(); scrollPackages(1); }}
              >
                ▸
              </button>
            </div>
          )}

        </aside>
        </div>

        {/* Website Overview Content Sections */}
        <section className="content-overview">
          
          {/* Why Choose AutoX */}
          <div className="overview-section why-choose">
            <h2>🏆 Why Choose AutoX?</h2>
            <div className="features-grid">
              <div className="feature-box">
                <div className="feature-icon">👨‍🔧</div>
                <h3>Certified Experts</h3>
                <p>Highly trained technicians with years of experience in automotive care</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">⏱️</div>
                <h3>24/7 Support</h3>
                <p>Round-the-clock roadside assistance and emergency services</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">💰</div>
                <h3>Best Pricing</h3>
                <p>Transparent pricing with no hidden charges, value for money</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">✅</div>
                <h3>Genuine Parts</h3>
                <p>Only authentic OEM and premium aftermarket parts used</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">📱</div>
                <h3>Easy Booking</h3>
                <p>Book services online in minutes with instant confirmation</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">🛡️</div>
                <h3>Warranty Coverage</h3>
                <p>6-12 months warranty on all services and repairs</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">🚗</div>
                <h3>Free Pickup & Drop</h3>
                <p>Complimentary vehicle pickup and drop-off service at your doorstep</p>
              </div>
              <div className="feature-box">
                <div className="feature-icon">📊</div>
                <h3>Digital Reports</h3>
                <p>Detailed digital inspection reports with photos and recommendations</p>
              </div>
            </div>
          </div>

          {/* Services Showcase */}
          <div className="overview-section services-showcase">
            <h2>🚗 Our Complete Service Range</h2>
            <div className="services-grid">
              <div className="service-showcase-card">
                <div className="showcase-icon">🔧</div>
                <h3>Smart Garage Services</h3>
                <p>Periodic maintenance, engine diagnostics, oil change, brake service, AC repair, battery replacement, and more</p>
                <button className="learn-more-btn" onClick={() => navigate('/services')}>Learn More →</button>
              </div>
              <div className="service-showcase-card">
                <div className="showcase-icon">🛠️</div>
                <h3>Breakdown Assistance</h3>
                <p>24/7 on-road support, tire change, fuel delivery, battery jumpstart, towing, and emergency repairs</p>
                <button className="learn-more-btn" onClick={() => navigate('/services')}>Learn More →</button>
              </div>
              <div className="service-showcase-card">
                <div className="showcase-icon">⚙️</div>
                <h3>Vehicle Modifications</h3>
                <p>Custom body kits, performance upgrades, aesthetic enhancements, audio systems, and interior makeovers</p>
                <button className="learn-more-btn" onClick={() => navigate('/services')}>Learn More →</button>
              </div>
              <div className="service-showcase-card">
                <div className="showcase-icon">🔨</div>
                <h3>Repair Services</h3>
                <p>Engine repairs, transmission fixes, suspension work, electrical repairs, and collision body work</p>
                <button className="learn-more-btn" onClick={() => navigate('/services')}>Learn More →</button>
              </div>
              <div className="service-showcase-card">
                <div className="showcase-icon">🎨</div>
                <h3>Denting & Painting</h3>
                <p>Professional dent removal, scratch repair, full body painting, and ceramic coating services</p>
                <button className="learn-more-btn" onClick={() => navigate('/services')}>Learn More →</button>
              </div>
              <div className="service-showcase-card">
                <div className="showcase-icon">❄️</div>
                <h3>AC & Electrical</h3>
                <p>AC gas refill, compressor repair, wiring fixes, headlight upgrades, and sensor diagnostics</p>
                <button className="learn-more-btn" onClick={() => navigate('/services')}>Learn More →</button>
              </div>
              <div className="service-showcase-card">
                <div className="showcase-icon">🛞</div>
                <h3>Tyre & Wheel Care</h3>
                <p>Tyre replacement, wheel alignment, balancing, puncture repair, and alloy wheel refurbishment</p>
                <button className="learn-more-btn" onClick={() => navigate('/services')}>Learn More →</button>
              </div>
              <div className="service-showcase-card">
                <div className="showcase-icon">🧽</div>
                <h3>Car Detailing</h3>
                <p>Interior deep cleaning, exterior polish, upholstery care, engine bay wash, and odor treatment</p>
                <button className="learn-more-btn" onClick={() => navigate('/services')}>Learn More →</button>
              </div>
              <div className="service-showcase-card">
                <div className="showcase-icon">🔋</div>
                <h3>Battery & Charging</h3>
                <p>Battery testing, replacement, jumpstart service, alternator repair, and EV charging solutions</p>
                <button className="learn-more-btn" onClick={() => navigate('/services')}>Learn More →</button>
              </div>
              <div className="service-showcase-card">
                <div className="showcase-icon">🪟</div>
                <h3>Glass & Windshield</h3>
                <p>Windshield replacement, chip repair, window tinting, and rear glass installation services</p>
                <button className="learn-more-btn" onClick={() => navigate('/services')}>Learn More →</button>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="overview-section how-it-works">
            <h2>📋 How It Works</h2>
            <div className="steps-container">
              <div className="step-card">
                <h3>Choose Service</h3>
                <p>Select from our comprehensive range of automotive services</p>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-card">
                <h3>Book Online</h3>
                <p>Schedule your appointment with date, time, and location</p>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-card">
                <h3>Expert Service</h3>
                <p>Our certified technicians handle your vehicle with care</p>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-card">
                <h3>Get Back on Road</h3>
                <p>Drive away confident with quality service and warranty</p>
              </div>
            </div>
          </div>

          {/* Customer Testimonials */}
          <div className="overview-section testimonials">
            <h2>⭐ What Our Customers Say</h2>
            <div className="testimonials-grid">
              <div className="testimonial-card">
                <div className="rating">⭐⭐⭐⭐⭐</div>
                <p>"Excellent service! My car broke down late at night and AutoX arrived within 30 minutes. Professional and efficient."</p>
                <div className="customer-name">- Rajesh Kumar</div>
              </div>
              <div className="testimonial-card">
                <div className="rating">⭐⭐⭐⭐⭐</div>
                <p>"Best garage in town! Transparent pricing, quality work, and the modifications they did to my bike are incredible."</p>
                <div className="customer-name">- Priya Patel</div>
              </div>
              <div className="testimonial-card">
                <div className="rating">⭐⭐⭐⭐⭐</div>
                <p>"Regular maintenance packages are very affordable. The team is knowledgeable and always explains everything clearly."</p>
                <div className="customer-name">- Amit Shah</div>
              </div>
            </div>
          </div>

          {/* Pricing Preview */}
          <div className="overview-section pricing-preview">
            <h2>💳 Transparent Pricing</h2>
            <div className="pricing-cards">
              <div className="price-card">
                <h3>Basic Service</h3>
                <div className="price-amount">₹999</div>
                <ul className="price-features">
                  <li>✓ Oil & Filter Change</li>
                  <li>✓ Basic Inspection</li>
                  <li>✓ Exterior Wash</li>
                  <li>✓ Tire Pressure Check</li>
                </ul>
              </div>
              <div className="price-card featured">
                <div className="popular-badge">Most Popular</div>
                <h3>Standard Service</h3>
                <div className="price-amount">₹2499</div>
                <ul className="price-features">
                  <li>✓ Full Periodic Service</li>
                  <li>✓ Brake & Clutch Check</li>
                  <li>✓ AC Service</li>
                  <li>✓ Free Pickup & Drop</li>
                  <li>✓ 6 Month Warranty</li>
                </ul>
              </div>
              <div className="price-card">
                <h3>Premium Service</h3>
                <div className="price-amount">₹5999</div>
                <ul className="price-features">
                  <li>✓ Complete Service Package</li>
                  <li>✓ Interior & Exterior Detailing</li>
                  <li>✓ Engine Deep Clean</li>
                  <li>✓ Priority Support</li>
                  <li>✓ 1 Year Warranty</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="overview-section contact-info">
            <h2>📍 Visit Us or Contact</h2>
            <div className="contact-grid">
              <div className="contact-card">
                <div className="contact-icon">📞</div>
                <h3>Call Us</h3>
                <p>24/7 Emergency Hotline</p>
                <a href="tel:+919913828214" className="contact-link">+91 9913828214</a>
              </div>
              <div className="contact-card">
                <div className="contact-icon">✉️</div>
                <h3>Email Us</h3>
                <p>Support & Inquiries</p>
                <a href="mailto:autoxgarageservice@gmail.com" className="contact-link">autoxgarageservice@gmail.com</a>
              </div>
              <div className="contact-card">
                <div className="contact-icon">💬</div>
                <h3>WhatsApp Us</h3>
                <p>Quick Support</p>
                <a href="https://wa.me/919913828214" target="_blank" rel="noreferrer" className="contact-link">Chat with us →</a>
              </div>
              <div className="contact-card">
                <div className="contact-icon">📍</div>
                <h3>Visit Us</h3>
                <p>Main Service Center</p>
                <a href="/contact" className="contact-link">View Location →</a>
              </div>
              <div className="contact-card">
                <div className="contact-icon">📸</div>
                <h3>Follow Us</h3>
                <p>On Instagram</p>
                <a href="https://www.instagram.com/autox2334" target="_blank" rel="noreferrer" className="contact-link">@autox2334 →</a>
              </div>
              <div className="contact-card">
                <div className="contact-icon">🕐</div>
                <h3>Hours</h3>
                <p>Always Open</p>
                <p className="contact-link">24/7 Available</p>
              </div>
              <div className="contact-card">
                <div className="contact-icon">💳</div>
                <h3>Payment Options</h3>
                <p>Easy & Secure</p>
                <p className="contact-link">Cash, UPI, Card, EMI</p>
              </div>
              <div className="contact-card">
                <div className="contact-icon">🎧</div>
                <h3>Live Chat</h3>
                <p>Instant Help</p>
                <a href="/contact" className="contact-link">Start Chat →</a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="overview-section quick-links">
            <h2>🔗 Quick Navigation</h2>
            <div className="links-grid">
              <button onClick={() => navigate('/services')} className="quick-link-btn">View All Services</button>
              <button onClick={() => navigate('/about')} className="quick-link-btn">About AutoX</button>
              <button onClick={() => navigate('/gallery')} className="quick-link-btn">Photo Gallery</button>
              <button onClick={() => navigate('/contact')} className="quick-link-btn">Contact Us</button>
              <button onClick={() => navigate('/login')} className="quick-link-btn">Customer Login</button>
              <button onClick={() => navigate('/register')} className="quick-link-btn">Register Now</button>
            </div>
          </div>

        </section>

      </div>
    </div>
      
      {/* Modals rendered outside main container for proper overlay */}
      {showPackages && (
        <div className="packages-modal" role="dialog" aria-modal="true" aria-labelledby="packagesTitle">
          <div className="packages-backdrop" />
          <div className="packages-modal-dialog" ref={packagesModalRef}>
              <div className="packages-header">
                <h3 id="packagesTitle">Service Packages</h3>
                <button
                  type="button"
                  className="packages-close"
                  aria-label="Close packages"
                  onClick={() => setShowPackages(false)}
                >
                  ✕
                </button>
              </div>
              <p className="packages-sub">Best value bundles for routine maintenance and peace of mind.</p>

              <div className="packages-scroll" ref={packagesScrollRef}>
                <div className="packages-track">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`package-card ${pkg.popular ? 'popular' : ''} ${expandedPackage === pkg.id ? 'expanded' : ''}`}
                      onClick={() => togglePackage(pkg.id)}
                    >
                      <div className="package-top">
                        <div className="package-top-left">
                          <span className="caret">▸</span>
                          <div className="package-name">{pkg.name}</div>
                          {pkg.popular && <span className="badge">Popular</span>}
                        </div>
                        <div className="price">
                          <span className="currency">₹</span>
                          <span className="value">{pkg.price}</span>
                          <span className="term">/service</span>
                        </div>
                      </div>
                      <div className="package-details">
                        <ul className="features">
                          {pkg.features.map((feat, idx) => (
                            <li key={idx}>{feat}</li>
                          ))}
                        </ul>
                        <button className="choose-btn" onClick={(e) => e.stopPropagation()}>{pkg.cta || 'Choose Plan'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                className="slider-btn prev"
                aria-label="Previous packages"
                onClick={(e) => { e.stopPropagation(); scrollPackages(-1); }}
              >
                ◂
              </button>
              <button
                className="slider-btn next"
                aria-label="Next packages"
                onClick={(e) => { e.stopPropagation(); scrollPackages(1); }}
              >
                ▸
              </button>
            </div>
          </div>
      )}
      
      {showBooking && (
        <div className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="bookingTitle">
          <div className="booking-backdrop" />
            <div className="booking-modal-dialog" ref={bookingModalRef}>
              <div className="booking-header">
                <h3 id="bookingTitle">Book Smart Garage Service</h3>
                <button
                  type="button"
                  className="booking-close"
                  aria-label="Close booking"
                  onClick={() => setShowBooking(false)}
                >
                  ✕
                </button>
              </div>
              <form
                className="booking-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Service request submitted!');
                  setShowBooking(false);
                }}
              >
                <label>
                  Full Name
                  <input name="name" type="text" placeholder="Your name" required />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" placeholder="9XXXXXXXXX" required />
                </label>
                <label>
                  Vehicle Model
                  <input name="vehicle" type="text" placeholder="e.g., Scorpio Classic S11" required />
                </label>
                <label>
                  Registration No.
                  <input name="reg" type="text" placeholder="GJ-01-AB-1234" />
                </label>
                <label>
                  Preferred Date
                  <input name="date" type="date" />
                </label>
                <label className="wide">
                  Pickup Address
                  <input name="address" type="text" placeholder="Street, City" />
                </label>
                <label className="wide">
                  Notes
                  <textarea name="notes" rows="3" placeholder="Anything we should know?" />
                </label>
                <div className="booking-actions">
                  <button type="button" className="action-btn ghost" onClick={() => setShowBooking(false)}>Cancel</button>
                  <button type="submit" className="action-btn">Submit Booking</button>
                </div>
              </form>
            </div>
          </div>
      )}
      
      {showSupportMessage && (
        <div className="support-modal" role="dialog" aria-modal="true" aria-labelledby="supportTitle">
          <div className="support-backdrop" />
            <div className="support-modal-dialog" ref={supportMessageModalRef}>
              <div className="support-header">
                <h3 id="supportTitle">🛠 Request Breakdown Assistance</h3>
                <button
                  type="button"
                  className="support-close"
                  aria-label="Close support"
                  onClick={() => setShowSupportMessage(false)}
                >
                  ✕
                </button>
              </div>
              <p className="support-description">We'll send help right away. Fill in your details below.</p>
              <form
                className="support-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Help request sent! Our team will contact you shortly.');
                  setShowSupportMessage(false);
                }}
              >
                <label>
                  Full Name
                  <input name="name" type="text" placeholder="Your name" required />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" placeholder="9XXXXXXXXX" required />
                </label>
                <label className="wide">
                  Current Location
                  <input name="location" type="text" placeholder="Nearest landmark or address" required />
                </label>
                <label className="wide">
                  Issue Description
                  <textarea name="issue" rows="3" placeholder="Brief description of the problem..." required />
                </label>
                <div className="support-actions">
                  <button type="button" className="action-btn ghost" onClick={() => setShowSupportMessage(false)}>Cancel</button>
                  <button type="submit" className="action-btn urgent">Send Help Request</button>
                </div>
              </form>
            </div>
          </div>
      )}
      
      {showModsGallery && (
        <div className="mods-modal" role="dialog" aria-modal="true" aria-labelledby="modsTitle">
          <div className="mods-backdrop" />
            <div className="mods-modal-dialog" ref={modsGalleryModalRef}>
              <div className="mods-header">
                <h3 id="modsTitle">⚙ Vehicle Modifications</h3>
                <button
                  type="button"
                  className="mods-close"
                  aria-label="Close mods"
                  onClick={() => setShowModsGallery(false)}
                >
                  ✕
                </button>
              </div>
              <p className="mods-description">Transform your ride with expert customization. Choose from our popular modification categories.</p>
              
              <div className="mods-grid">
                {modifications.map((mod) => (
                  <div key={mod.id} className="mod-category-card">
                    <div className="mod-category-header">
                      <h4>{mod.category}</h4>
                      <span className="mod-price-range">{mod.priceRange}</span>
                    </div>
                    <ul className="mod-items-list">
                      {mod.items.map((item, idx) => (
                        <li key={idx}>
                          <span className="checkmark">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <button 
                      className="action-btn mod-select-btn"
                      onClick={() => {
                        setShowModsGallery(false);
                        setShowQuoteRequest(true);
                      }}
                    >
                      Get Quote
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mods-footer">
                <p>💡 <strong>Pro Tip:</strong> Bundle multiple mods for better pricing!</p>
              </div>
            </div>
          </div>
      )}
      
      {showQuoteRequest && (
        <div className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="quoteTitle">
          <div className="quote-backdrop" />
            <div className="quote-modal-dialog" ref={quoteRequestModalRef}>
              <div className="quote-header">
                <h3 id="quoteTitle">⚙ Get Modification Quote</h3>
                <button
                  type="button"
                  className="quote-close"
                  aria-label="Close quote"
                  onClick={() => setShowQuoteRequest(false)}
                >
                  ✕
                </button>
              </div>
              <p className="quote-description">Tell us about your vehicle and desired modifications. We'll provide a detailed quote within 24 hours.</p>
              <form
                className="quote-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Quote request submitted! Our team will contact you with pricing details soon.');
                  setShowQuoteRequest(false);
                }}
              >
                <label>
                  Full Name
                  <input name="name" type="text" placeholder="Your name" required />
                </label>
                <label>
                  Phone
                  <input name="phone" type="tel" placeholder="9XXXXXXXXX" required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" placeholder="your@email.com" />
                </label>
                <label>
                  Vehicle Model
                  <input name="vehicle" type="text" placeholder="e.g., Swift ZXI 2020" required />
                </label>
                <label className="wide">
                  Modification Type
                  <select name="modType" required>
                    <option value="">Select category...</option>
                    <option value="aesthetic">🎨 Aesthetic Mods</option>
                    <option value="performance">⚡ Performance Upgrades</option>
                    <option value="audio">🔊 Audio & Entertainment</option>
                    <option value="safety">🛡️ Safety & Comfort</option>
                    <option value="custom">🔧 Custom Request</option>
                  </select>
                </label>
                <label className="wide">
                  Specific Modifications Required
                  <textarea name="details" rows="4" placeholder="List the modifications you're interested in (e.g., Body kit, LED lights, Custom exhaust...)" required />
                </label>
                <label className="wide">
                  Budget Range
                  <select name="budget">
                    <option value="">Select budget...</option>
                    <option value="5k-25k">₹5,000 - ₹25,000</option>
                    <option value="25k-50k">₹25,000 - ₹50,000</option>
                    <option value="50k-100k">₹50,000 - ₹1,00,000</option>
                    <option value="100k+">₹1,00,000+</option>
                  </select>
                </label>
                <div className="quote-actions">
                  <button type="button" className="action-btn ghost" onClick={() => setShowQuoteRequest(false)}>Cancel</button>
                  <button type="submit" className="action-btn">Request Quote</button>
                </div>
              </form>
            </div>
          </div>
      )}
      
        {showRepairSchedule && (
          <div className="repair-modal" role="dialog" aria-modal="true" aria-labelledby="repairTitle">
            <div className="repair-backdrop" />
              <div className="repair-modal-dialog" ref={repairScheduleModalRef}>
                <div className="repair-header">
                  <h3 id="repairTitle">🔧 Schedule Repair</h3>
                  <button
                    type="button"
                    className="repair-close"
                    aria-label="Close schedule"
                    onClick={() => setShowRepairSchedule(false)}
                  >
                    ✕
                  </button>
                </div>
                <p className="repair-description">Tell us your vehicle issue and preferred timing. We'll confirm shortly.</p>
                <form
                  className="repair-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert('Repair scheduled! Our team will confirm your slot.');
                    setShowRepairSchedule(false);
                  }}
                >
                  <label>
                    Full Name
                    <input name="name" type="text" placeholder="Your name" required />
                  </label>
                  <label>
                    Phone
                    <input name="phone" type="tel" placeholder="9XXXXXXXXX" required />
                  </label>
                  <label>
                    Vehicle Model
                    <input name="vehicle" type="text" placeholder="e.g., i20 Sportz 2019" required />
                  </label>
                  <label>
                    Registration No.
                    <input name="reg" type="text" placeholder="GJ-01-AB-1234" />
                  </label>
                  <label>
                    Preferred Date
                    <input name="date" type="date" required />
                  </label>
                  <label>
                    Preferred Time
                    <input name="time" type="time" />
                  </label>
                  <label className="wide">
                    Describe Issue
                    <textarea name="issue" rows="3" placeholder="Describe the problem..." required />
                  </label>
                  <label className="wide">
                    Pickup Address (optional)
                    <input name="address" type="text" placeholder="Street, City" />
                  </label>
                  <div className="repair-actions">
                    <button type="button" className="action-btn ghost" onClick={() => setShowRepairSchedule(false)}>Cancel</button>
                    <button type="submit" className="action-btn">Confirm Slot</button>
                  </div>
                </form>
              </div>
          </div>
        )}

        {showRepairStatus && (
          <div className="status-modal" role="dialog" aria-modal="true" aria-labelledby="statusTitle">
            <div className="status-backdrop" />
              <div className="status-modal-dialog" ref={repairStatusModalRef}>
                <div className="status-header">
                  <h3 id="statusTitle">🔧 Check Repair Status</h3>
                  <button
                    type="button"
                    className="status-close"
                    aria-label="Close status"
                    onClick={() => setShowRepairStatus(false)}
                  >
                    ✕
                  </button>
                </div>
                <p className="status-description">Enter your phone and reference number to view your repair status.</p>
                <form
                  className="status-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert('Status fetched: In Progress (ETA: 2 days).');
                    setShowRepairStatus(false);
                  }}
                >
                  <label>
                    Phone
                    <input name="phone" type="tel" placeholder="9XXXXXXXXX" required />
                  </label>
                  <label>
                    Reference ID
                    <input name="ref" type="text" placeholder="e.g., RP-2025-00123" required />
                  </label>
                  <label className="wide">
                    Or Registration No.
                    <input name="reg" type="text" placeholder="GJ-01-AB-1234" />
                  </label>
                  <div className="status-actions">
                    <button type="button" className="action-btn ghost" onClick={() => setShowRepairStatus(false)}>Close</button>
                    <button type="submit" className="action-btn">Check Now</button>
                  </div>
                </form>
              </div>
          </div>
        )}

        {showEmergencySOS && (
          <div className="sos-modal" role="dialog" aria-modal="true" aria-labelledby="sosTitle">
            <div className="sos-backdrop" />
              <div className="sos-modal-dialog" ref={emergencySOSModalRef}>
                <div className="sos-header">
                  <h3 id="sosTitle">🚨 Emergency SOS</h3>
                  <button
                    type="button"
                    className="sos-close"
                    aria-label="Close SOS"
                    onClick={() => setShowEmergencySOS(false)}
                  >
                    ✕
                  </button>
                </div>
                <p className="sos-description">If you're in an emergency, call now. We'll also alert our roadside team.</p>
                <div className="sos-actions">
                  <button
                    className="action-btn urgent"
                    onClick={() => { window.location.href = 'tel:+919913828214'; }}
                  >
                    Call Now
                  </button>
                  <button
                    className="action-btn ghost"
                    onClick={() => setShowEmergencySOS(false)}
                  >
                    Close
                  </button>
                </div>
                <ul className="sos-tips">
                  <li>Move to a safe spot away from traffic if possible.</li>
                  <li>Turn on hazard lights and place a warning triangle.</li>
                  <li>Keep your phone battery above 20%.</li>
                </ul>
              </div>
          </div>
        )}

        {showEmergencyInfo && (
          <div className="emergency-modal" role="dialog" aria-modal="true" aria-labelledby="emgTitle">
            <div className="emergency-backdrop" />
              <div className="emergency-modal-dialog" ref={emergencyInfoModalRef}>
                <div className="emergency-header">
                  <h3 id="emgTitle">🚘 Emergency Roadside Help</h3>
                  <button
                    type="button"
                    className="emergency-close"
                    aria-label="Close info"
                    onClick={() => setShowEmergencyInfo(false)}
                  >
                    ✕
                  </button>
                </div>
                <p className="emergency-description">We provide towing, battery jumpstart, tire change, fuel delivery, on-spot quick fixes, and accident support.</p>
                <div className="emergency-grid">
                  <div className="emergency-card">🪫 Battery Jumpstart</div>
                  <div className="emergency-card">🛞 Tire Puncture/Change</div>
                  <div className="emergency-card">⛽ Emergency Fuel</div>
                  <div className="emergency-card">🪝 Towing Service</div>
                  <div className="emergency-card">🧰 Quick Mechanical Fix</div>
                  <div className="emergency-card">📑 Accident Assistance</div>
                </div>
                <div className="emergency-actions">
                  <button className="action-btn" onClick={() => { setShowEmergencyInfo(false); setShowEmergencySOS(true); }}>Request SOS</button>
                  <button className="action-btn ghost" onClick={() => setShowEmergencyInfo(false)}>Close</button>
                </div>
              </div>
          </div>
        )}

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            className="scroll-to-top"
            onClick={scrollToTop}
            title="Scroll to top"
            aria-label="Scroll to top of page"
          >
            ↑
          </button>
        )}
      
    </>
  );
}

export default Home;
