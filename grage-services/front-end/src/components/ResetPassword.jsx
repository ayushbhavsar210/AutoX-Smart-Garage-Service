import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import './ResetPassword.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (!tokenParam || !emailParam) {
      setError('Invalid reset link');
      return;
    }

    setToken(tokenParam);
    setEmail(decodeURIComponent(emailParam));
  }, [searchParams]);

  // Calculate password strength
  useEffect(() => {
    calculatePasswordStrength(newPassword);
  }, [newPassword]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;

    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return { label: '', color: '' };
    if (passwordStrength <= 2) return { label: 'Weak', color: '#dc2626' };
    if (passwordStrength === 3) return { label: 'Fair', color: '#f59e0b' };
    if (passwordStrength === 4) return { label: 'Good', color: '#10b981' };
    return { label: 'Strong', color: '#0ea5e9' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordRequirements = () => ({
    length: newPassword.length >= 6,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*]/.test(newPassword),
  });

  const requirements = getPasswordRequirements();
  const strengthColor = getPasswordStrengthLabel().color;

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <h1>Create New Password</h1>
          <p>Enter a strong password to secure your AUTOX account</p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Password Reset Successfully!</h2>
            <p>Your password has been updated successfully.</p>
            <p className="redirect-notice">Redirecting to login page...</p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Go to Login
            </button>
          </div>
        ) : error && error === 'Invalid reset link' ? (
          <div className="error-message-large">
            <div className="error-icon">✕</div>
            <h2>Invalid Reset Link</h2>
            <p>The reset link is missing or invalid. Please request a new one.</p>
            <div className="error-actions">
              <Link to="/forgot-password" className="btn-primary">
                Request New Link
              </Link>
              <Link to="/login" className="btn-secondary">
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="input-disabled"
              />
              <small>This is the email associated with your account</small>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: strengthColor,
                      }}
                    />
                  </div>
                  <span style={{ color: strengthColor }} className="strength-label">
                    Strength: {getPasswordStrengthLabel().label}
                  </span>
                </div>
              )}
            </div>

            {newPassword && (
              <div className="password-requirements">
                <p className="requirements-title">Password Requirements:</p>
                <ul>
                  <li className={requirements.length ? 'met' : ''}>
                    <span className="requirement-icon">
                      {requirements.length ? '✓' : '○'}
                    </span>
                    At least 6 characters
                  </li>
                  <li className={requirements.uppercase ? 'met' : ''}>
                    <span className="requirement-icon">
                      {requirements.uppercase ? '✓' : '○'}
                    </span>
                    Uppercase letter (A-Z)
                  </li>
                  <li className={requirements.lowercase ? 'met' : ''}>
                    <span className="requirement-icon">
                      {requirements.lowercase ? '✓' : '○'}
                    </span>
                    Lowercase letter (a-z)
                  </li>
                  <li className={requirements.number ? 'met' : ''}>
                    <span className="requirement-icon">
                      {requirements.number ? '✓' : '○'}
                    </span>
                    Number (0-9)
                  </li>
                  <li className={requirements.special ? 'met' : ''}>
                    <span className="requirement-icon">
                      {requirements.special ? '✓' : '○'}
                    </span>
                    Special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <small style={{ color: '#dc2626' }} className="error-small">
                  Passwords do not match
                </small>
              )}

              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <small style={{ color: '#10b981' }} className="success-small">
                  ✓ Passwords match
                </small>
              )}
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-submit"
              disabled={
                loading ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="form-footer">
              <p>
                Remember your password?{' '}
                <Link to="/login" className="link-secondary">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>

      <div className="reset-password-side-info">
        <div className="info-card">
          <h3>🔐 Strong Passwords</h3>
          <p>
            Use a mix of uppercase, lowercase, numbers, and special characters to create a strong password.
          </p>
        </div>
        <div className="info-card">
          <h3>⏱️ Link Expiry</h3>
          <p>
            This reset link is valid for 1 hour. After that, you'll need to request a new link.
          </p>
        </div>
        <div className="info-card">
          <h3>🚀 Get Started</h3>
          <p>
            After resetting your password, you can log in and start using all AUTOX features.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
