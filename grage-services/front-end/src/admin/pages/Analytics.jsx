import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { analyticsApi } from '../../utils/apiService';
import '../Analytics.css';

function Analytics() {
  const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);
  const [dailyBookingsData, setDailyBookingsData] = useState([]);
  const [topServicesData, setTopServicesData] = useState([]);
  const [serviceCategoryData, setServiceCategoryData] = useState([]);
  const [satisfactionData, setSatisfactionData] = useState([]);
  const [keyMetrics, setKeyMetrics] = useState({ totalRevenue: '₹0', totalBookings: '0', completedServices: '0', avgRating: '—' });

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [dashRes, revRes, bookRes, satRes] = await Promise.allSettled([
          analyticsApi.dashboard(),
          analyticsApi.revenue(),
          analyticsApi.bookings(),
          analyticsApi.customerSatisfaction(),
        ]);
        const dash = dashRes.status === 'fulfilled' ? (dashRes.value?.data || dashRes.value || {}) : {};
        const rev  = revRes.status  === 'fulfilled' ? (revRes.value?.data  || revRes.value  || {}) : {};
        const book = bookRes.status === 'fulfilled' ? (bookRes.value?.data || bookRes.value || {}) : {};
        const sat  = satRes.status  === 'fulfilled' ? (satRes.value?.data  || satRes.value  || {}) : {};

        if (rev.monthlyRevenue) setMonthlyRevenueData(rev.monthlyRevenue);
        if (rev.serviceCategories) setServiceCategoryData(rev.serviceCategories);
        if (book.dailyBookings) setDailyBookingsData(book.dailyBookings);
        if (dash.topServices) setTopServicesData(dash.topServices);
        if (sat.ratings || sat.satisfactionData) setSatisfactionData(sat.ratings || sat.satisfactionData);
        setKeyMetrics({
          totalRevenue: (dash.totalRevenue ?? rev.total) ? `₹${Number(dash.totalRevenue ?? rev.total).toLocaleString('en-IN')}` : '₹0',
          totalBookings: dash.totalBookings ? dash.totalBookings.toLocaleString() : '0',
          completedServices: dash.completedServices ? dash.completedServices.toLocaleString() : '0',
          avgRating: dash.avgRating || sat.avgRating || '—',
        });
      } catch { /* analytics unavailable */ }
    };
    loadAll();
  }, []);

  // Colors for charts
  const COLORS = ['#DC2626', '#F97316', '#EAB308', '#84CC16', '#22C55E', '#06B6D4', '#0EA5E9'];
  const CHART_COLORS = {
    primary: '#DC2626',
    secondary: '#0EA5E9',
    success: '#22C55E',
    warning: '#F97316',
  };

  // Filter state for daily bookings
  const [bookingFilter, setBookingFilter] = useState('all'); // all, completed, pending

  const renderCategoryTick = ({ x, y, payload }) => {
    const rawValue = String(payload.value || '');
    const lines = rawValue.includes('/') ? rawValue.split('/') : [rawValue];

    return (
      <text x={x} y={y} textAnchor="end" fill="#6b7280" fontSize={12}>
        {lines.map((line, index) => (
          <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : 14}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };

  const getFilteredBookingsData = () => {
    if (bookingFilter === 'completed') {
      return dailyBookingsData.map(d => ({ day: d.day, bookings: d.completed }));
    } else if (bookingFilter === 'pending') {
      return dailyBookingsData.map(d => ({ day: d.day, bookings: d.bookings - d.completed }));
    }
    return dailyBookingsData.map(d => ({ day: d.day, bookings: d.bookings }));
  };

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>📊 Analytics Dashboard</h1>
          <p className="header-subtitle">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="header-date">
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="analytics-metrics">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <p className="metric-value">{keyMetrics.totalRevenue}</p>
            <span className="metric-change positive">↑ from last year</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <h3>Total Bookings</h3>
            <p className="metric-value">{keyMetrics.totalBookings}</p>
            <span className="metric-change positive">↑ this month</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>Completed Services</h3>
            <p className="metric-value">{keyMetrics.completedServices}</p>
            <span className="metric-change positive">completion rate</span>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⭐</div>
          <div className="metric-content">
            <h3>Avg. Rating</h3>
            <p className="metric-value">{keyMetrics.avgRating}/5</p>
            <span className="metric-change positive">↑ rating</span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="charts-grid charts-grid-2">
        {/* Monthly Revenue Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>📈 Monthly Revenue Trend</h2>
            <p className="chart-subtitle">Revenue vs Target (Last 12 Months)</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={monthlyRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="revenue" fill={CHART_COLORS.primary} name="Actual Revenue" />
              <Line type="monotone" dataKey="target" stroke={CHART_COLORS.secondary} name="Target" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Bookings Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>📅 Daily Bookings (Last 30 Days)</h2>
            <div className="chart-filter">
              <button
                className={`filter-btn ${bookingFilter === 'all' ? 'active' : ''}`}
                onClick={() => setBookingFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${bookingFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setBookingFilter('completed')}
              >
                Completed
              </button>
              <button
                className={`filter-btn ${bookingFilter === 'pending' ? 'active' : ''}`}
                onClick={() => setBookingFilter('pending')}
              >
                Pending
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={getFilteredBookingsData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="bookings" fill={CHART_COLORS.success} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="charts-grid charts-grid-2">
        {/* Top Services Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>🛠️ Top Services by Bookings</h2>
            <p className="chart-subtitle">Distribution of service requests</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={topServicesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {topServicesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Service Category Revenue */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>💵 Revenue by Service Category</h2>
            <p className="chart-subtitle">Total revenue breakdown</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={serviceCategoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis
                dataKey="category"
                type="category"
                stroke="#6b7280"
                width={140}
                tick={renderCategoryTick}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Bar dataKey="revenue" fill={CHART_COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="charts-grid charts-grid-2">
        {/* Customer Satisfaction */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>⭐ Customer Satisfaction Rating</h2>
            <p className="chart-subtitle">Based on 690 customer reviews</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="rating" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill={CHART_COLORS.warning} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service Bookings by Category */}
        <div className="chart-card">
          <div className="chart-header">
            <h2>📊 Bookings by Service Category</h2>
            <p className="chart-subtitle">Total 1,045 bookings</p>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={serviceCategoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="bookings" fill={CHART_COLORS.secondary} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Tables */}
      <div className="analytics-tables">
        <div className="table-card">
          <h2>🏆 Top 5 Services by Revenue</h2>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Bookings</th>
                <th>Percentage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topServicesData.slice(0, 5).map((service, index) => (
                <tr key={index}>
                  <td>{service.name}</td>
                  <td className="table-value">{service.value.toLocaleString()}</td>
                  <td>
                    <div className="progress-bar-small">
                      <div className="progress-fill-small" style={{ width: `${service.percentage}%` }}></div>
                    </div>
                    {service.percentage}%
                  </td>
                  <td>
                    <span className="status status-active">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <h2>📈 Service Category Performance</h2>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Revenue</th>
                <th>Bookings</th>
                <th>Avg Value</th>
              </tr>
            </thead>
            <tbody>
              {serviceCategoryData.map((category, index) => (
                <tr key={index}>
                  <td>{category.category}</td>
                  <td className="table-value revenue">₹{(category.revenue / 1000).toFixed(0)}K</td>
                  <td className="table-value">{category.bookings}</td>
                  <td className="table-value">₹{Math.round(category.revenue / category.bookings).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
