import React, { useState, useEffect } from 'react';
import { settingsApi } from '../../utils/apiService';

function AdminSettings() {
  const [settings, setSettings] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    hours: '',
    maintenanceModeEnabled: false
  });
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await settingsApi.get();
        const data = res?.data || res || {};
        setSettings(prev => ({ ...prev, ...data }));
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSave = async () => {
    try {
      await settingsApi.update(settings);
      setSaveMessage('✓ Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveMessage('✗ Failed to save settings');
    }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1> Admin Settings</h1>
      </div>

      <div className="settings-container">
        {/* Business Information Card */}
        <div className="settings-card">
          <div className="card-header">
            <h2>Business Information</h2>
            <p>Manage your business details</p>
          </div>
          
          <div className="settings-form">
            <div className="form-group">
              <label htmlFor="businessName">
                <span className="label-icon"></span>
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                name="businessName"
                value={settings.businessName}
                onChange={handleChange}
                placeholder="Enter business name"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  <span className="label-icon"></span>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  <span className="label-icon"></span>
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={settings.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">
                <span className="label-icon"></span>
                Address
              </label>
              <input
                id="address"
                type="text"
                name="address"
                value={settings.address}
                onChange={handleChange}
                placeholder="Enter business address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hours">
                <span className="label-icon"></span>
                Business Hours
              </label>
              <input
                id="hours"
                type="text"
                name="hours"
                value={settings.hours}
                onChange={handleChange}
                placeholder="Enter business hours"
              />
            </div>
          </div>
        </div>

        {/* System Management Card */}
        <div className="settings-card">
          <div className="card-header">
            <h2>System Management</h2>
            <p>Configure system settings</p>
          </div>

          <div className="settings-form">
            <div className="form-group checkbox-group">
              <div className="checkbox-wrapper">
                <input
                  type="checkbox"
                  name="maintenanceModeEnabled"
                  checked={settings.maintenanceModeEnabled}
                  onChange={handleChange}
                  id="maintenance"
                />
                <label htmlFor="maintenance">
                  <span className="checkbox-custom"></span>
                  <div className="checkbox-label-text">
                    <strong>Enable Maintenance Mode</strong>
                    <span className="checkbox-desc">Temporarily disable public access to the platform</span>
                  </div>
                </label>
              </div>
              {settings.maintenanceModeEnabled && (
                <div className="warning-box">
                    Maintenance mode is active. Users will see a maintenance notice.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Info Card */}
        <div className="settings-card">
          <div className="card-header">
            <h2>ℹ️ System Information</h2>
            <p>System status and details</p>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Version</span>
              <strong className="info-value">1.0.0</strong>
            </div>
            <div className="info-item">
              <span className="info-label">Last Updated</span>
              <strong className="info-value">Dec 30, 2025</strong>
            </div>
            <div className="info-item">
              <span className="info-label">Status</span>
              <strong className="info-value status-active">● Online</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="settings-actions">
          {saveMessage && <div className="save-message">{saveMessage}</div>}
          <button className="btn-primary btn-save" onClick={handleSave}>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
