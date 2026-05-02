import React from 'react';

function AdminNav({ currentPage, setCurrentPage, adminUsername, onLogout, isSidebarCollapsed, onToggleSidebar }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'services', label: 'Packages', icon: '📦' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'vehicles', label: 'Vehicles', icon: '🚙' },
    { id: 'breakdown', label: 'Breakdowns', icon: '🚘' },
    { id: 'mechanics', label: 'Mechanics', icon: '🔧' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'assignments', label: 'Assignments', icon: '📋' },
    { id: 'modifications', label: 'Modifications', icon: '⚙️' },
    { id: 'repairs', label: 'Payment History', icon: '💳' },
    { id: 'contacts', label: 'Contacts', icon: '📩' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '🛠️' },
  ];

  return (
    <nav className={`admin-nav ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="admin-nav-header">
        <div className="admin-nav-title-wrap">
          <h2>{isSidebarCollapsed ? 'AX' : 'AutoX Admin'}</h2>
          {!isSidebarCollapsed && <p>Welcome, {adminUsername}</p>}
        </div>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="split-view-icon" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      <ul className="admin-nav-menu">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="admin-nav-footer">
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default AdminNav;
