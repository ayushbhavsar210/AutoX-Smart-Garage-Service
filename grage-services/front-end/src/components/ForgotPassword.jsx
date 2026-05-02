import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setEmail('');
      } else {
        setError(data.message || 'Failed to send reset link. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Reset Your Password</h1>
          <p>Enter your email address and we'll send you a link to reset your password</p>
        </div>

        {submitted ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>Email Sent Successfully!</h2>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="success-details">
              Please check your email and click the link to reset your password. The link will expire in 1 hour.
            </p>
            <div className="success-actions">
              <button className="btn-primary" onClick={() => navigate('/login')}>
                Back to Login
              </button>
              <button className="btn-secondary" onClick={() => setSubmitted(false)}>
                Send Another Link
              </button>
            </div>
            <p className="spam-notice">
              💡 Didn't receive the email? Check your spam folder or try again.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="forgot-password-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                disabled={loading}
              />
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
              disabled={loading || !email}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="form-footer">
              <p>
                Remember your password?{' '}
                <Link to="/login" className="link-secondary">
                  Back to Login
                </Link>
              </p>
              <p>
                Don't have an account?{' '}
                <Link to="/register" className="link-secondary">
                  Create one
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>

      <div className="forgot-password-side-info">
        <div className="info-card">
          <h3>🔒 Your Security</h3>
          <p>
            We take security seriously. Your password reset link is valid for 1 hour and can only be used once.
          </p>
        </div>
        <div className="info-card">
          <h3>💬 Need Help?</h3>
          <p>
            If you continue to have issues, please contact our support team at{' '}
            <a href="mailto:autoxgarageservice@gmail.com">autoxgarageservice@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
