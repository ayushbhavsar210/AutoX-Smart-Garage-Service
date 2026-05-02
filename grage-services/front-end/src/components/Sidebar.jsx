import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../logo.jpeg';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef(null);
  // about dropdown removed per request
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, role, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsOpen && !event.target.closest('.notification-wrapper')) {
        setNotificationsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  // Cleanup dropdown timeout when component unmounts
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const toggleServicesDropdown = (e) => {
    if (window.innerWidth <= 768) {
      if (servicesDropdownOpen) {
        // If dropdown is already open, allow navigation
        closeMobile();
      } else {
        // If dropdown is closed, prevent navigation and open dropdown
        e.preventDefault();
        setServicesDropdownOpen(true);
      }
    }
  };


  // Hide public nav menu when on admin or customer dashboard
  const shouldHidePublicNav = 
    (isAuthenticated && role === 'user' && location.pathname === '/customer/dashboard') ||
    (isAuthenticated && role === 'admin' && location.pathname === '/admin');

  return (
    <>
      {/* Mobile Toggle */}
     
     

      {/* Top Navbar */}
      <nav className={`navbar ${isMobileOpen ? 'mobile-open' : ''} ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          {/* Logo Section */}
            <div className="navbar-brand">
              <img src={logo} alt="AutoX Logo" className="navbar-logo" />
              <div className="navbar-brand-text">
                <span className="navbar-text">AutoX</span>
                <span className="navbar-subtext">SMART GARAGE · BREAKDOWN · MODIFICATION</span>
              </div>
          </div>

          {/* Tagline */}
          <div className="navbar-tagline">SMART GARAGE · BREAKDOWN · MODIFICATION</div>

          {/* Nav Links - Hidden when user is on dashboard */}
          {!shouldHidePublicNav && (
            <ul className="navbar-links">
            <li>
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={closeMobile}
              >
                Home
              </Link>
            </li>
            <li 
              className={`nav-dropdown ${servicesDropdownOpen ? 'sticky-open' : ''}`}
              onMouseEnter={() => {
                if (dropdownTimeoutRef.current) {
                  clearTimeout(dropdownTimeoutRef.current);
                }
                setServicesDropdownOpen(true);
              }}
              onMouseLeave={() => {
                dropdownTimeoutRef.current = setTimeout(() => {
                  setServicesDropdownOpen(false);
                }, 800);
              }}
            >
              <Link 
                to="/services" 
                className={`nav-link ${isActive('/services') || isActive('/service-catalog') || isActive('/breakdown/call') || isActive('/mods/explore') ? 'active' : ''}`}
                onClick={toggleServicesDropdown}
              >
                Services
                <span className="dropdown-arrow">▼</span>
              </Link>
              {servicesDropdownOpen && (
                <ul 
                  className="dropdown-menu"
                  onMouseEnter={() => {
                    if (dropdownTimeoutRef.current) {
                      clearTimeout(dropdownTimeoutRef.current);
                    }
                    setServicesDropdownOpen(true);
                  }}
                  onMouseLeave={() => {
                    dropdownTimeoutRef.current = setTimeout(() => {
                      setServicesDropdownOpen(false);
                    }, 800);
                  }}
                >
                  <li>
                    <Link 
                      to="/service-catalog" 
                      className="dropdown-item"
                      onClick={closeMobile}
                    >
                      REGULAR SERVICE
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/breakdown/call" 
                      className="dropdown-item"
                      onClick={closeMobile}
                    >
                      BREAKDOWN
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/mods/explore" 
                      className="dropdown-item"
                      onClick={closeMobile}
                    >
                      MODIFICATION
                    </Link>
                  </li>
                </ul>
              )}
            </li>
            <li>
              <Link 
                to="/about" 
                className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                onClick={closeMobile}
              >
                About
              </Link>
            </li>
            <li>
              <Link 
                to="/gallery" 
                className={`nav-link ${isActive('/gallery') ? 'active' : ''}`}
                onClick={closeMobile}
              >
                Gallery
              </Link>
            </li>
            <li>
              <Link 
                to="/contact" 
                className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
                onClick={closeMobile}
              >
                Contact
              </Link>
            </li>
            </ul>
          )}

          {/* Auth Buttons */}
          <div className="navbar-auth">
            {/* Notification Bell - Visible always for testing */}
            <div className="notification-wrapper">
              <button 
                className="notification-bell"
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <svg 
                  className="bell-icon"
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  style={{ display: 'block' }}
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {isAuthenticated && unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <div className="notification-actions">
                      {isAuthenticated && unreadCount > 0 && (
                        <button 
                          className="mark-all-read"
                          onClick={markAllAsRead}
                        >
                          Mark all read
                        </button>
                      )}
                      {isAuthenticated && notifications && notifications.length > 0 && (
                        <button 
                          className="clear-all"
                          onClick={clearNotifications}
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="notification-list">
                    {!isAuthenticated ? (
                      <div className="notification-empty">
                        <p>Please login to view notifications</p>
                      </div>
                    ) : (!notifications || notifications.length === 0) ? (
                      <div className="notification-empty">
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="notification-icon">{notification.icon}</div>
                          <div className="notification-content">
                            <h4>{notification.title}</h4>
                            <p>{notification.message}</p>
                            <span className="notification-time">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                          {!notification.read && (
                            <div className="notification-dot"></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated && role === 'admin' ? (
              <>
                <Link 
                  to="/admin" 
                  className={`auth-link login-link ${isActive('/admin') ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  Admin Dashboard
                </Link>
                <button 
                  className="auth-link login-link"
                  onClick={() => {
                    logout();
                    closeMobile();
                  }}
                >
                  Logout
                </button>
              </>
            ) : isAuthenticated && role === 'user' ? (
              <>
                <Link 
                  to="/customer/dashboard" 
                  className={`auth-link login-link ${isActive('/customer/dashboard') ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  My Dashboard
                </Link>
                <button 
                  className="auth-link login-link"
                  onClick={() => {
                    logout();
                    closeMobile();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className={`auth-link login-link ${isActive('/login') ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
         <button className="navbar-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
        </button>
         
      </nav>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="navbar-backdrop" onClick={() => setIsMobileOpen(false)}></div>
      )}
    </>
  );
}

export default Navbar;
