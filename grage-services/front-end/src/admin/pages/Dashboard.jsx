import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../../utils/apiService';

function Dashboard({ onNavigate }) {
  const goTo = (page) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalUsers: 0,
    activeServices: 0,
    totalVehicles: 0,
    totalRevenue: '₹0',
    dailyRevenue: '₹0',
    monthlyRevenue: '₹0',
    yearlyRevenue: '₹0',
    monthlyGrowth: '+0%',
    completedServices: 0
  });

  const [quickStats, setQuickStats] = useState({ bookingsThisWeek: 0, pending: 0, inProgress: 0, completed: 0 });
  const [performance, setPerformance] = useState({ satisfaction: 0, onTime: 0, retention: 0 });

  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await analyticsApi.dashboard();
        const d = res?.data || res || {};
        setStats({
          totalBookings: d.totalBookings ?? 0,
          totalUsers: d.totalCustomers ?? d.totalUsers ?? 0,
          activeServices: d.activeServices ?? d.activeBookings ?? 0,
          totalVehicles: d.totalVehicles ?? 0,
          totalRevenue: d.totalRevenue ? `₹${Number(d.totalRevenue).toLocaleString('en-IN')}` : '₹0',
          dailyRevenue: d.dailyRevenue ? `₹${Number(d.dailyRevenue).toLocaleString('en-IN')}` : '₹0',
          monthlyRevenue: d.monthlyRevenue ? `₹${Number(d.monthlyRevenue).toLocaleString('en-IN')}` : (d.thisMonthRevenue ? `₹${Number(d.thisMonthRevenue).toLocaleString('en-IN')}` : '₹0'),
          yearlyRevenue: d.yearlyRevenue ? `₹${Number(d.yearlyRevenue).toLocaleString('en-IN')}` : '₹0',
          monthlyGrowth: d.growth?.bookings ? `+${d.growth.bookings}%` : (d.monthlyGrowth || '+0%'),
          completedServices: d.completedServices ?? 0,
        });
        if (d.quickStats) setQuickStats(d.quickStats);
        else setQuickStats({
          bookingsThisWeek: d.thisMonthBookings ?? 0,
          pending: d.activeBookings ?? 0,
          inProgress: 0,
          completed: d.totalBookings ? d.totalBookings - (d.activeBookings || 0) : 0,
        });
        if (d.performance) setPerformance(d.performance);
        else setPerformance({
          satisfaction: Math.round((d.averageRating || 0) * 20),
          onTime: 85,
          retention: 70,
        });
        setActivities(Array.isArray(d.recentActivity) ? d.recentActivity : []);
      } catch { /* api unavailable – keep zeros */ }
    };
    load();
  }, []);

  const [selectedActivity, setSelectedActivity] = useState(null);

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
  };

  const closeActivityDetails = () => {
    setSelectedActivity(null);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>📊 Dashboard</h1>
          <p className="header-subtitle">Welcome to AutoX Admin Dashboard</p>
        </div>
        <div className="header-date">
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div
          className="stat-card clickable"
          onClick={() => goTo('bookings')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goTo('bookings')}
          aria-label="View all bookings"
        >
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Total Bookings</h3>
            <p className="stat-value">{stats.totalBookings}</p>
            <span className="stat-growth">↑ {stats.monthlyGrowth} this month</span>
          </div>
        </div>

        <div
          className="stat-card clickable"
          onClick={() => goTo('users')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goTo('users')}
          aria-label="View active customers"
        >
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">{stats.totalUsers}</p>
            <span className="stat-growth">Active customers</span>
          </div>
        </div>

        <div
          className="stat-card clickable"
          onClick={() => goTo('services')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goTo('services')}
          aria-label="View active services"
        >
          <div className="stat-icon">🚗</div>
          <div className="stat-content">
            <h3>Active Services</h3>
            <p className="stat-value">{stats.activeServices}</p>
            <span className="stat-growth">{stats.completedServices} completed</span>
          </div>
        </div>

        <div
          className="stat-card clickable"
          onClick={() => goTo('vehicles')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goTo('vehicles')}
          aria-label="View total vehicles"
        >
          <div className="stat-icon">🚘</div>
          <div className="stat-content">
            <h3>Total Vehicles</h3>
            <p className="stat-value">{stats.totalVehicles}</p>
            <span className="stat-growth">Serviced vehicles</span>
          </div>
        </div>

        <div
          className="stat-card clickable"
          onClick={() => goTo('bookings')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goTo('bookings')}
          aria-label="View monthly earnings"
        >
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">{stats.totalRevenue}</p>
            <span className="stat-growth">Monthly earnings</span>
            <div className="revenue-breakdown">
              <span className="revenue-pill">Daily: {stats.dailyRevenue}</span>
              <span className="revenue-pill">Monthly: {stats.monthlyRevenue}</span>
              <span className="revenue-pill">Yearly: {stats.yearlyRevenue}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>📈 Quick Stats</h2>
          <div className="quick-stats">
            <div 
              className="quick-stat clickable"
              onClick={() => goTo('bookings')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goTo('bookings')}
              aria-label="View bookings this week"
            >
              <label>Bookings This Week</label>
              <span>{quickStats.bookingsThisWeek}</span>
            </div>
            <div 
              className="quick-stat clickable"
              onClick={() => goTo('bookings')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goTo('bookings')}
              aria-label="View pending services"
            >
              <label>Pending Services</label>
              <span>{quickStats.pending}</span>
            </div>
            <div 
              className="quick-stat clickable"
              onClick={() => goTo('bookings')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goTo('bookings')}
              aria-label="View in-progress services"
            >
              <label>In-Progress</label>
              <span>{quickStats.inProgress}</span>
            </div>
            <div 
              className="quick-stat clickable"
              onClick={() => goTo('bookings')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goTo('bookings')}
              aria-label="View completed services"
            >
              <label>Completed</label>
              <span>{quickStats.completed}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>🎯 Performance</h2>
          <div className="performance-chart">
            <div className="performance-item">
              <label>Service Satisfaction</label>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${performance.satisfaction}%`}}></div>
              </div>
              <span>{performance.satisfaction}%</span>
            </div>
            <div className="performance-item">
              <label>On-Time Completion</label>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${performance.onTime}%`}}></div>
              </div>
              <span>{performance.onTime}%</span>
            </div>
            <div className="performance-item">
              <label>Customer Retention</label>
              <div className="progress-bar">
                <div className="progress-fill" style={{width: `${performance.retention}%`}}></div>
              </div>
              <span>{performance.retention}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>🔔 Recent Activity</h2>
        <div className="activity-list">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="activity-item clickable"
              onClick={() => handleActivityClick(activity)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleActivityClick(activity)}
              aria-label={`View details for ${activity.name} ${activity.action}`}
            >
              <span className="activity-icon">{activity.icon}</span>
              <div className="activity-info">
                <p><strong>{activity.name}</strong> {activity.action}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedActivity && (
        <div className="modal-backdrop" onClick={closeActivityDetails}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-label">Activity Details</p>
                <h3>{selectedActivity.icon} {selectedActivity.name}</h3>
              </div>
              <button className="modal-close" onClick={closeActivityDetails} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <p><strong>Activity Type:</strong> {selectedActivity.type.charAt(0).toUpperCase() + selectedActivity.type.slice(1)}</p>
              <p><strong>Action:</strong> {selectedActivity.action}</p>
              <p><strong>Time:</strong> {selectedActivity.time}</p>
              <p><strong>Status:</strong> <span className="status status-completed">Recorded</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
