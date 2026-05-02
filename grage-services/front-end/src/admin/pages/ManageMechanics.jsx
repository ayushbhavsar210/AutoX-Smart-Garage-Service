import React, { useState, useEffect, useMemo } from 'react';
import CommonTable from '../../components/CommonTable.jsx';
import { mechanicsApi } from '../../utils/apiService';

function ManageMechanics() {
  const [mechanics, setMechanics] = useState([]);

  const loadMechanics = async () => {
    try {
      const res = await mechanicsApi.list();
      const raw = res?.data || res || [];
      setMechanics(raw.map(m => ({
        ...m,
        id: m.mechanicCode || m._id || '',
        name: m.fullName || m.name || '—',
        expertise: Array.isArray(m.expertise) ? m.expertise.join(', ') : (m.expertise || '—'),
        phone: m.phone || '—',
        experience: m.yearsExperience != null ? `${m.yearsExperience} yrs` : (m.experience || '—'),
        status: m.status || m.availability || '—',
        assignedJobs: m.assignedJobs || 0,
        rating: m.rating || 0,
      })));
    } catch (err) {
      console.error('Error loading mechanics:', err);
    }
  };

  useEffect(() => { loadMechanics(); }, []);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    expertise: '',
    phone: '',
    experience: '',
    status: 'Available',
    rating: ''
  });

  const handleAddMechanic = async (e) => {
    e.preventDefault();
    if (formData.name && formData.expertise && formData.phone) {
      const payload = {
        fullName: formData.name,
        expertise: formData.expertise.split(',').map(e => e.trim()).filter(Boolean),
        phone: formData.phone,
        yearsExperience: Number(formData.experience) || 0,
        status: formData.status || 'Available',
        rating: Number(formData.rating) || 4.5,
        assignedJobs: 0,
      };
      try {
        if (editingId) {
          await mechanicsApi.update(editingId, payload);
          setEditingId(null);
        } else {
          await mechanicsApi.create(payload);
        }
        await loadMechanics();
        setFormData({ name: '', expertise: '', phone: '', experience: '', status: 'Available', rating: '' });
        setShowForm(false);
      } catch (err) {
        console.error('Error saving mechanic:', err);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      expertise: '',
      phone: '',
      experience: '',
      status: 'Available',
      rating: ''
    });
  };

  const mechanicColumns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'expertise', header: 'Expertise' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'experience', header: 'Experience' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'assignedJobs', header: 'Assigned Jobs' },
    { accessorKey: 'rating', header: 'Rating' },
  ], []);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>🔧 Manage Mechanics</h1>
          <p className="header-subtitle">Total Mechanics: {mechanics.length}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Mechanic'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingId ? 'Edit Mechanic' : 'Add New Mechanic'}</h3>
          <form className="mechanic-form" onSubmit={handleAddMechanic}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Mechanic Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                placeholder="Expertise (e.g., Engine & Transmission)"
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Experience (e.g., 5 years)"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Rating (1-5)"
                min="1"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
                <option value="Off">Off</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingId ? 'Update Mechanic' : 'Add Mechanic'}</button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ padding: '20px' }}>
        <CommonTable 
          columns={mechanicColumns} 
          data={mechanics} 
          fileName="mechanics-data"
          showSelection={true}
        />
      </div>

      <div className="booking-stats">
        <div className="stat-item">
          <label>Total Mechanics</label>
          <span>{mechanics.length}</span>
        </div>
        <div className="stat-item">
          <label>Available Now</label>
          <span>{mechanics.filter(m => m.status === 'Available').length}</span>
        </div>
        <div className="stat-item">
          <label>Average Rating</label>
          <span>⭐ {mechanics.length > 0 ? (mechanics.reduce((sum, m) => sum + (parseFloat(m.rating) || 0), 0) / mechanics.length).toFixed(1) : '0.0'}</span>
        </div>
        <div className="stat-item">
          <label>Total Assigned Jobs</label>
          <span>{mechanics.reduce((sum, m) => sum + (Number(m.assignedJobs) || 0), 0)}</span>
        </div>
      </div>
    </div>
  );
}

export default ManageMechanics;
