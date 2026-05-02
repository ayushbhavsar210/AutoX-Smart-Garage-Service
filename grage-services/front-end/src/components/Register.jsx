import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './auth.css';
import { useAuth } from '../context/AuthContext';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, requestRegisterOtp, verifyRegisterOtp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleType: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Form, Step 2: OTP Verification
  const [otpEmail, setOtpEmail] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password) => {
    const rules = {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(rules).filter(Boolean).length;
    return { rules, score };
  };

  const getPasswordStrengthLabel = (score) => {
    if (score <= 2) return 'Weak';
    if (score === 3) return 'Fair';
    if (score === 4) return 'Good';
    return 'Strong';
  };

  const getValidationErrors = (values) => {
    const newErrors = {};

    if (!values.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!/^[A-Za-z\s.'-]{2,}$/.test(values.fullName.trim())) {
      newErrors.fullName = 'Enter a valid full name (letters and spaces only)';
    }

    if (!values.email) {
      newErrors.email = 'Email is required';
    } else if (!values.email.includes('@')) {
      newErrors.email = 'Email must contain @ symbol';
    } else if (!values.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }

    if (!values.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!values.phone.match(/^[6-9]\d{9}$/)) {
      newErrors.phone = 'Phone must be 10 digits and start with 6, 7, 8, or 9';
    }

    const passwordCheck = validatePassword(values.password);
    if (!values.password) {
      newErrors.password = 'Password is required';
    } else if (passwordCheck.score < 4) {
      newErrors.password = 'Use a stronger password (8+ chars, upper, lower, number, special)';
    }

    if (!values.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!values.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
    if (!values.agreeTerms) newErrors.agreeTerms = 'You must agree to terms';

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    setFormData(next);
    setErrors(getValidationErrors(next));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    const next = {
      ...formData,
      phone: value,
    };

    setFormData(next);
    setErrors(getValidationErrors(next));
  };

  const validateForm = () => {
    const newErrors = getValidationErrors(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const passwordState = validatePassword(formData.password);
  const isFormValid = Object.keys(getValidationErrors(formData)).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setOtpError('');
      setOtpEmail('');

      try {
        await register({
          email: formData.email,
          fullName: formData.fullName,
          phone: formData.phone,
          password: formData.password,
          role: 'user',
        });

        setStep(2);
      } catch (error) {
        setOtpError(error?.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOtpVerification = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!otpEmail.trim()) {
      setOtpError('Please enter OTP sent to your email');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyRegisterOtp({ email: formData.email, otp: otpEmail });

      setSuccess(true);
      setTimeout(() => {
        const from = location.state?.from;
        if (from) {
          navigate(from, { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }, 1500);
    } catch (error) {
      setOtpError(error?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSubmitting(true);
    try {
      await requestRegisterOtp(formData.email);
    } catch (error) {
      setOtpError(error?.message || 'Failed to resend OTP');
    } finally {
      setIsSubmitting(false);
    }

    setOtpEmail('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>{step === 1 ? 'Create Account' : 'Verify Account'}</h1>
            <p>{step === 1 ? 'Join AutoX for premium vehicle care' : 'Verify your email address'}</p>
          </div>

          {success && (
            <div className="success-banner">
              ✓ Email verified successfully! Redirecting to login...
            </div>
          )}

          {otpError && step === 1 && (
            <div className="error-banner">
              ⚠️ {otpError}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address * (must contain @)</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-text">⚠️ {errors.email}</span>}
                {formData.email && !errors.email && (
                  <small style={{ color: '#4caf50', display: 'block', marginTop: '4px' }}>✓ Valid email address</small>
                )}
                {formData.email && !formData.email.includes('@') && (
                  <small style={{ color: '#ff9800', display: 'block', marginTop: '4px' }}>ℹ️ Email must contain @ symbol (e.g., user@example.com)</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number * (10 digits only)</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="9876543210"
                  maxLength="10"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-text">⚠️ {errors.phone}</span>}
                {formData.phone && !errors.phone && (
                  <small style={{ color: '#4caf50', display: 'block', marginTop: '4px' }}>✓ Valid phone number ({formData.phone.length}/10 digits)</small>
                )}
                {formData.phone && formData.phone.length < 10 && !errors.phone && (
                  <small style={{ color: '#ff9800', display: 'block', marginTop: '4px' }}>ℹ️ Enter {10 - formData.phone.length} more digit(s)</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={errors.fullName ? 'error' : ''}
                />
                {errors.fullName && <span className="error-text">⚠️ {errors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="vehicleType">Vehicle Type *</label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  className={errors.vehicleType ? 'error' : ''}
                >
                  <option value="">Select vehicle type</option>
                  <option value="car">Car</option>
                  <option value="bike">Bike</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="other">Other</option>
                </select>
                {errors.vehicleType && <span className="error-text">⚠️ {errors.vehicleType}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
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
                  {errors.password && <span className="error-text">⚠️ {errors.password}</span>}
                  {formData.password && (
                    <small className="password-strength-text">
                      Strength: {getPasswordStrengthLabel(passwordState.score)} ({passwordState.score}/5)
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={errors.confirmPassword ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error-text">⚠️ {errors.confirmPassword}</span>}
                </div>
              </div>

              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <label htmlFor="agreeTerms">
                  I agree to the <a href="#terms">Terms & Conditions</a> and <a href="#privacy">Privacy Policy</a> *
                </label>
                {errors.agreeTerms && <span className="error-text">⚠️ {errors.agreeTerms}</span>}
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={!isFormValid || isSubmitting}
                style={{
                  opacity: (!isFormValid || isSubmitting) ? 0.5 : 1,
                  cursor: (!isFormValid || isSubmitting) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting
                  ? 'Creating Account...'
                  : !isFormValid
                    ? '⚠️ Please fix errors above'
                    : 'Create Account & Send Email OTP'}
              </button>

              <div className="auth-footer">
                Already have an account? <Link to="/login">Login here</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpVerification} className="auth-form">
              <div className="otp-info">
                <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
                  We've sent an OTP verification code to:
                </p>
                <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                  <p><strong>📧 Email:</strong> {formData.email}</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="otpEmail">Email OTP *</label>
                <input
                  type="text"
                  id="otpEmail"
                  value={otpEmail}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpEmail(value);
                  }}
                  placeholder="Enter 6-digit OTP from email"
                  maxLength="6"
                  className={otpError && !otpEmail ? 'error' : ''}
                />
                {!otpEmail && <small style={{ color: '#999' }}>Check your email for the OTP</small>}
              </div>

              {otpError && (
                <div className="error-banner" style={{ color: '#d32f2f', background: '#ffebee', padding: '12px', borderRadius: '4px', marginBottom: '15px' }}>
                  ⚠️ {otpError}
                </div>
              )}

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting || otpEmail.trim().length < 4}
                style={{
                  opacity: (isSubmitting || otpEmail.trim().length < 4) ? 0.5 : 1,
                  cursor: (isSubmitting || otpEmail.trim().length < 4) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting
                  ? 'Verifying...'
                  : 'Verify Email OTP & Complete Registration'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button 
                  type="button" 
                  onClick={handleResendOtp}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#1976d2', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    textDecoration: 'underline'
                  }}
                >
                  Resend OTP
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setStep(1);
                    setOtpEmail('');
                    setOtpError('');
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#666', 
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ← Go Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Register;
