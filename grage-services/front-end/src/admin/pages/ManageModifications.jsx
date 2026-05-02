import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CommonTable from '../../components/CommonTable.jsx';
import { modificationsApi, mechanicsApi } from '../../utils/apiService';

function ManageModifications() {
  const [modifications, setModifications] = useState([]);

  const loadModifications = useCallback(async () => {
    try {
      const res = await modificationsApi.list();
      const raw = res?.data || res || [];
      setModifications(raw.map((m, idx) => ({
        ...m,
        id: m.id || m.modCode || m._id || idx + 1,
        customer: m.customer || '—',
        vehicle: m.vehicle || '—',
        modType: m.modType || m.name || '—',
        description: m.description || '—',
        estimatedCost: m.quote?.exactPrice || m.estimatedCost || (m.basePrice != null ? `₹${m.basePrice}` : '—'),
        duration: m.duration || '—',
        phone: m.phone || '—',
        assignedTo: m.assignedTo || '—',
        status: m.status || (m.active === false ? 'Inactive' : 'Active'),
        progress: m.progress != null ? m.progress : '—',
        userDecision: m.userDecision?.decision || m.bookingDecision || 'pending',
        pickupDrop: m.pickupDrop?.required
          ? `${m.pickupDrop?.pickupDate || 'Pending'} (${m.pickupDrop?.pickupSlot || 'slot pending'})`
          : 'Not Required',
        quoteNotes: m.quote?.notes || '',
      })));
    } catch (err) {
      console.error('Error loading modifications:', err);
    }
  }, []);

  useEffect(() => { loadModifications(); }, [loadModifications]);

  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer: '',
    vehicle: '',
    modType: '',
    description: '',
    estimatedCost: '',
    duration: '',
    phone: '',
    status: 'Quote Requested',
    assignedTo: ''
  });

  const handleSendQuote = useCallback(async (rowData) => {
    const exactPrice = window.prompt(`Exact price enter karo for ${rowData.vehicle}:`, String(rowData.estimatedCost || ''));
    if (!exactPrice) return;
    const normalizedPrice = Number(String(exactPrice).replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      alert('Please enter valid positive exact price');
      return;
    }

    const quoteNotes = window.prompt('Admin note (optional):', rowData.quoteNotes || '');
    const duration = window.prompt('Estimated duration (optional):', rowData.duration || '');
    const assignedTo = window.prompt('Assign mechanic (optional):', rowData.assignedTo || '');

    try {
      await modificationsApi.respondQuote(rowData.id, {
        exactPrice: normalizedPrice,
        quoteNotes: quoteNotes || '',
        duration: duration || '',
        assignedTo: assignedTo || '',
        respondedBy: 'admin',
      });
      await loadModifications();
    } catch (err) {
      console.error('Error sending quote:', err);
      alert('Quote update failed');
    }
  }, [loadModifications]);

  const handleStatusUpdate = useCallback(async (rowData) => {
    const nextStatus = window.prompt('Status update karo: Quoted / Confirmed / Pickup Scheduled / In Progress / Completed / Rejected', rowData.status || 'In Progress');
    if (!nextStatus) return;

    try {
      await modificationsApi.updateStatus(rowData.id, {
        status: nextStatus,
        assignedTo: rowData.assignedTo || '',
      });
      await loadModifications();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Status update failed');
    }
  }, [loadModifications]);

  const modificationColumns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'customer', header: 'Customer' },
    { accessorKey: 'vehicle', header: 'Vehicle' },
    { accessorKey: 'modType', header: 'Modification Type' },
    { accessorKey: 'description', header: 'Description' },
    { accessorKey: 'estimatedCost', header: 'Exact Price' },
    { accessorKey: 'duration', header: 'Duration' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'assignedTo', header: 'Assigned To' },
    { accessorKey: 'userDecision', header: 'User Decision' },
    { accessorKey: 'pickupDrop', header: 'Pickup/Drop' },
    { accessorKey: 'status', header: 'Status' },
    {
      accessorKey: 'actions',
      header: 'Actions',
      Cell: ({ row }) => {
        const item = row?.original || {};
        return (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn-secondary" onClick={() => handleSendQuote(item)}>
              Send Quote
            </button>
            <button type="button" className="btn-primary" onClick={() => handleStatusUpdate(item)}>
              Update Status
            </button>
          </div>
        );
      }
    },
  ], [handleSendQuote, handleStatusUpdate]);

  const modificationTypes = [
    'Performance Tuning',
    'Body Kit Installation',
    'Suspension Upgrade',
    'Interior Customization',
    'Audio System Upgrade',
    'Lighting Modifications',
    'Exhaust System',
    'Wheel & Tire Upgrade',
    'Paint & Wrap',
    'Engine Modification'
  ];

  const [mechanicsList, setMechanicsList] = useState([]);

  useEffect(() => {
    const loadMechanics = async () => {
      try {
        const res = await mechanicsApi.list();
        setMechanicsList((res?.data || res || []).map(m => m.name || m));
      } catch (err) {
        console.error('Error loading mechanics:', err);
      }
    };
    loadMechanics();
  }, []);

  const handleAddModification = async (e) => {
    e.preventDefault();
    if (formData.customer && formData.vehicle && formData.modType) {
      try {
        await modificationsApi.create({
          ...formData,
          progress: formData.status === 'Completed' ? 100 : formData.status === 'In Progress' ? 50 : 0,
          userId: '',
          userObjectId: '',
        });
        await loadModifications();
        setFormData({
          customer: '',
          vehicle: '',
          modType: '',
          description: '',
          estimatedCost: '',
          duration: '',
          phone: '',
          status: 'Quote Requested',
          assignedTo: ''
        });
        setShowForm(false);
      } catch (err) {
        console.error('Error adding modification:', err);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      customer: '',
      vehicle: '',
      modType: '',
      description: '',
      estimatedCost: '',
      duration: '',
      phone: '',
      status: 'Quote Requested',
      assignedTo: ''
    });
  };

  const filteredModifications = modifications.filter(m => {
    const matchesStatus = filterStatus === 'All' || m.status === filterStatus;
    const matchesSearch = !searchTerm ||
                          (m.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.vehicle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.modType || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusCount = (status) => {
    if (status === 'All') return modifications.length;
    return modifications.filter(m => m.status === status).length;
  };

  const totalRevenue = modifications
    .filter(m => m.status === 'Completed' || m.status === 'In Progress')
    .reduce((sum, m) => sum + (parseInt(String(m.estimatedCost || '').replace(/[₹,+]/g, '')) || 0), 0);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>⚙️ Vehicle Modifications</h1>
          <p className="header-subtitle">Manage custom vehicle modifications & upgrades</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Modification'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>Add New Modification Request</h3>
          <form className="modification-form" onSubmit={handleAddModification}>
            <div className="form-row">
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
                placeholder="Vehicle (Model & Registration)"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                required
              />
              <select
                value={formData.modType}
                onChange={(e) => setFormData({ ...formData, modType: e.target.value })}
                required
              >
                <option value="">Select Modification Type</option>
                {modificationTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <textarea
              placeholder="Modification Description / Details"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              required
            />
            <div className="form-row">
              <input
                type="text"
                placeholder="Estimated Cost (e.g., ₹50,000)"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              />
              <input
                type="text"
                placeholder="Duration (e.g., 3-4 days)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className="form-row">
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              >
                <option value="">Assign to Mechanic</option>
                {mechanicsList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Quote Requested">Quote Requested</option>
                <option value="Quoted">Quoted</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pickup Scheduled">Pickup Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Add Modification</button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="controls-bar">
        <div className="filter-tabs">
          {['All', 'Quote Requested', 'Quoted', 'Confirmed', 'Pickup Scheduled', 'In Progress', 'Completed', 'Rejected'].map((status) => (
            <button
              key={status}
              className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status} <span className="badge-count">{getStatusCount(status)}</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by customer, vehicle, or modification type"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="bookings-container">
        <CommonTable 
          columns={modificationColumns}
          data={filteredModifications}
          filename="modifications"
        />
      </div>

      <div className="booking-stats">
        <div className="stat-item">
          <label>Total Modifications</label>
          <span>{modifications.length}</span>
        </div>
        <div className="stat-item">
          <label>In Progress</label>
          <span>{modifications.filter(m => m.status === 'In Progress').length}</span>
        </div>
        <div className="stat-item">
          <label>Completed</label>
          <span>{modifications.filter(m => m.status === 'Completed').length}</span>
        </div>
        <div className="stat-item">
          <label>Total Revenue</label>
          <span>₹{totalRevenue.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}

export default ManageModifications;
