import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './auth.css';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../utils/apiService';

function AdminLogin() {
  const navigate = useNavigate();
  const { login, requestForgotPassword } = useAuth();
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotErrors, setForgotErrors] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Detect login type based on input format
  // Only email login allowed
  const detectLoginType = (identifier) => {
    return 'customer'; // Email format only
  };

  const resolveCustomerEmail = async (identifier) => {
    const raw = String(identifier || '').trim();
    if (!raw) return '';
    if (raw.includes('@')) return raw.toLowerCase();

    try {
      const response = await usersApi.list();
      const users = Array.isArray(response?.data) ? response.data : [];
      const normalized = raw.toLowerCase();

      const found = users.find((user) => {
        const email = String(user?.email || '').toLowerCase();
        const username = String(user?.username || '').toLowerCase();
        const name = String(user?.name || user?.fullName || '').toLowerCase();
        const phone = String(user?.phone || '').toLowerCase();

        return (
          email === normalized ||
          username === normalized ||
          name === normalized ||
          phone === normalized
        );
      });

      return String(found?.email || '').toLowerCase();
    } catch (_error) {
      return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    setFormData(next);
    setErrors(validateFormData(next));

    // Clear login error when user edits
    setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (validateForm()) {
      setLoading(true);

      try {
        const emailToUse = await resolveCustomerEmail(formData.identifier);

        if (!emailToUse) {
          throw new Error('Email not found. Please enter your registered email address.');
        }

        const user = await login({
          email: emailToUse,
          password: formData.password,
          rememberMe: formData.rememberMe,
        });

        setSuccess(true);
        setTimeout(() => {
          navigate(user?.role === 'admin' ? '/admin' : '/customer/dashboard', { replace: true });
        }, 1200);
      } catch (error) {
        setLoginError(error?.message || 'Unable to login right now');
      } finally {
        setLoading(false);
      }
    }
  };

  const validateFormData = (values) => {
    const newErrors = {};

    if (!values.identifier.trim()) {
      newErrors.identifier = 'Email is required';
    } else if (!values.identifier.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.identifier = 'Please enter a valid email address';
    }

    if (!values.password) {
      newErrors.password = 'Password is required';
    } else if (values.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    return newErrors;
  };

  const validateForm = () => {
    const newErrors = validateFormData(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = Object.keys(validateFormData(formData)).length === 0;

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotErrors('');

    if (!forgotEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setForgotErrors('Please enter a valid email address');
      return;
    }

    setForgotLoading(true);
    try {
      await requestForgotPassword(forgotEmail);
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
      }, 2000);
    } catch (error) {
      setForgotErrors(error?.message || 'Could not process forgot password request');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotEmail('');
    setForgotErrors('');
    setForgotSuccess(false);
  };

  const handleWhatsAppSupport = () => {
    window.open('https://wa.me/919913828214?text=Hello, I need help with my AutoX login', '_blank');
  };

  const getPlaceholder = () => {
    return 'Enter your email address';
  };

  const getHelperText = () => {
    if (!formData.identifier) {
      return '';
    }
    return '👤 Email login';
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card login-card">
          <div className="auth-header">
            <h1>Welcome to AutoX</h1>
            <p>Login to your account</p>
          </div>

          {success && (
            <div className="success-banner">
              ✓ Login successful! Redirecting...
            </div>
          )}

          {loginError && <div className="error-banner">{loginError}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="identifier">Email</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder={getPlaceholder()}
                className={errors.identifier ? 'error' : ''}
              />
              {errors.identifier && <span className="error-text">⚠️ {errors.identifier}</span>}
              {formData.identifier && (
                <small className="helper-text">{getHelperText()}</small>
              )}
              {formData.identifier && !errors.identifier && (
                <small style={{ color: '#4caf50', display: 'block', marginTop: '4px' }}>✓ Valid email format</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-row-inline">
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="rememberMe">Remember me</label>
              </div>
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="forgot-link"
              >
                Forgot password?
              </button>
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || !isFormValid}
              style={{
                opacity: (loading || !isFormValid) ? 0.5 : 1,
                cursor: (loading || !isFormValid) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Logging in...' : !isFormValid ? '⚠️ Please fix errors above' : 'Login'}
            </button>

            <div className="auth-footer">
              Don't have an account? <Link to="/register">Register here</Link>
            </div>
          </form>

          <div className="divider">OR</div>

          <div className="social-login">
            <button className="social-btn whatsapp" onClick={handleWhatsAppSupport}>
              <span>💬</span> WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-backdrop" onClick={closeForgotPassword}>
          <div className="forgot-password-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeForgotPassword}>✕</button>
            
            <div className="forgot-password-header">
              <h2>Forgot Password?</h2>
              <p>Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            {forgotSuccess && (
              <div className="success-banner">
                ✓ Reset link sent! Check your email inbox.
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="forgot-form">
              <div className="form-group">
                <label htmlFor="forgotEmail">Email Address</label>
                <input
                  type="email"
                  id="forgotEmail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={forgotErrors ? 'error' : ''}
                />
                {forgotErrors && <span className="error-text">{forgotErrors}</span>}
              </div>

              <button 
                type="submit" 
                className="submit-btn forgot-submit-btn"
                disabled={forgotLoading}
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <button
                type="button"
                onClick={closeForgotPassword}
                className="cancel-btn"
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminLogin;


