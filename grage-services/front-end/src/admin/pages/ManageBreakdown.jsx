import React, { useState, useEffect, useMemo } from 'react';
import CommonTable from '../../components/CommonTable.jsx';
import { breakdownApi } from '../../utils/apiService';

function ManageBreakdown() {
  const [breakdowns, setBreakdowns] = useState([]);

  const loadBreakdowns = async () => {
    try {
      const res = await breakdownApi.list();
      const raw = res?.data || res || [];
      setBreakdowns(raw.map((b, idx) => ({
        ...b,
        id: b.ticketNo || b._id || idx + 1,
        customer: b.customerName || b.userId || '—',
        vehicle: b.vehicleModel || b.vehicleId || '—',
        vehicleNumber: b.vehicleNumber || '—',
        issue: b.description || '—',
        phone: b.phone || '—',
        location: b.location || '—',
        date: b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN') : '—',
        time: b.createdAt ? new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
        mechanic: b.assignedMechanicName || b.assignedMechanicId || '—',
        amount: b.amount || '—',
        status: b.status || 'open',
      })));
    } catch (err) {
      console.error('Error loading breakdowns:', err);
    }
  };

  useEffect(() => { loadBreakdowns(); }, []);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    customer: '',
    location: '',
    vehicle: '',
    issue: '',
    phone: '',
    status: 'Pending',
    mechanic: '',
    amount: ''
  });

  const breakdownColumns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'customer', header: 'Customer' },
    { accessorKey: 'location', header: 'Location' },
    { accessorKey: 'vehicle', header: 'Vehicle' },
    { accessorKey: 'vehicleNumber', header: 'Vehicle Number' },
    { accessorKey: 'issue', header: 'Issue' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'time', header: 'Time' },
    { accessorKey: 'mechanic', header: 'Mechanic' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'status', header: 'Status' },
  ], []);

  const handleAddBreakdown = async (e) => {
    e.preventDefault();
    if (formData.customer && formData.location && formData.vehicle && formData.issue) {
      try {
        const payload = {
          userId: formData.userId ? Number(formData.userId) : undefined,
          customerName: formData.customer,
          location: formData.location,
          vehicle: formData.vehicle,
          description: formData.issue,
          phone: formData.phone,
          status: formData.status,
          mechanic: formData.mechanic,
          amount: formData.amount,
        };

        await breakdownApi.createCall(payload);
        await loadBreakdowns();
        setFormData({
          userId: '',
          customer: '',
          location: '',
          vehicle: '',
          issue: '',
          phone: '',
          status: 'Pending',
          mechanic: '',
          amount: ''
        });
        setShowForm(false);
      } catch (err) {
        console.error('Error adding breakdown:', err);
      }
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>🚘 Manage Breakdowns</h1>
          <p className="header-subtitle">Total Requests: {breakdowns.length}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Breakdown'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>Add New Breakdown Request</h3>
          <form className="breakdown-form" onSubmit={handleAddBreakdown}>
            <div className="form-row">
              <input
                type="number"
                placeholder="User ID (optional)"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              />
              <input
                type="text"
                placeholder="Customer Name"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                placeholder="Vehicle Model"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Issue/Problem"
                value={formData.issue}
                onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                required
              />
            </div>
            <textarea
              placeholder="Location/Address"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              rows="2"
              required
            />
            <div className="form-row">
              <input
                type="text"
                placeholder="Assigned Mechanic"
                value={formData.mechanic}
                onChange={(e) => setFormData({ ...formData, mechanic: e.target.value })}
              />
              <input
                type="text"
                placeholder="Service Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="En Route">En Route</option>
                <option value="Reached">Reached</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Add Request</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ padding: '20px' }}>
        <CommonTable 
          columns={breakdownColumns} 
          data={breakdowns} 
          fileName="breakdown-data"
          showSelection={true}
        />
      </div>

      <div className="booking-stats">
        <div className="stat-item">
          <label>Total Requests</label>
          <span>{breakdowns.length}</span>
        </div>
        <div className="stat-item">
          <label>Completed Today</label>
          <span>{breakdowns.filter(b => b.status === 'resolved' || b.status === 'Completed').length}</span>
        </div>
        <div className="stat-item">
          <label>Pending Requests</label>
          <span>{breakdowns.filter(b => b.status === 'open' || b.status === 'Pending').length}</span>
        </div>
        <div className="stat-item">
          <label>Total Revenue</label>
          <span>₹{breakdowns.reduce((sum, b) => sum + (parseInt(String(b.amount ?? '').replace(/[₹,]/g, '')) || 0), 0).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}

export default ManageBreakdown;
