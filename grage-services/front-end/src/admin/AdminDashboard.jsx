import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin.css';
import AdminNav from './AdminNav';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import ManageServices from './pages/ManageServices';
import ManageBookings from './pages/ManageBookings';
import ManageVehicles from './pages/ManageVehicles';
import ManageBreakdown from './pages/ManageBreakdown';
import ManageMechanics from './pages/ManageMechanics';
import ManageAssignments from './pages/ManageAssignments';
import ManageModifications from './pages/ManageModifications';
import ManageUsers from './pages/ManageUsers';
import AdminSettings from './pages/AdminSettings';
import ManageInventory from './pages/ManageInventory';
import Reports from './pages/Reports';
import ManageBilling from './pages/ManageBilling';
import ManageContacts from './pages/ManageContacts';
import ManageNotifications from './pages/ManageNotifications';
import ManageRepairs from './pages/ManageRepairs';
import { useAuth } from '../context/AuthContext';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('analytics');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-dashboard">
      <AdminNav 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        adminUsername={user?.name || 'Admin'}
        onLogout={handleLogout}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      
      <div className={`admin-content ${isSidebarCollapsed ? 'expanded' : ''}`}>
        {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === 'analytics' && <Analytics />}
        {currentPage === 'reports' && <Reports />}
        {currentPage === 'billing' && <ManageBilling />}
        {currentPage === 'services' && <ManageServices />}
        {currentPage === 'bookings' && <ManageBookings />}
        {currentPage === 'vehicles' && <ManageVehicles />}
        {currentPage === 'breakdown' && <ManageBreakdown />}
        {currentPage === 'mechanics' && <ManageMechanics />}
        {currentPage === 'inventory' && <ManageInventory />}
        {currentPage === 'assignments' && <ManageAssignments />}
        {currentPage === 'modifications' && <ManageModifications />}
        {currentPage === 'repairs' && <ManageRepairs />}
        {currentPage === 'contacts' && <ManageContacts />}
        {currentPage === 'notifications' && <ManageNotifications />}
        {currentPage === 'users' && <ManageUsers />}
        {currentPage === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}

export default AdminDashboard;
