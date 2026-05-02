import React, { useState, useEffect } from 'react';
import { servicesApi } from '../../utils/apiService';

function ManageServices() {
  const [services, setServices] = useState([]);

  const loadServices = async () => {
    try {
      const res = await servicesApi.list();
      const list = res?.data || res || [];
      setServices(list.map((item) => ({
        ...item,
        id: item._id || item.id,
        name: item.name || '',
        description: item.description || '',
        price: item.basePrice ?? item.price ?? 0,
        estimatedDurationMinutes: item.estimatedDurationMinutes || '',
        category: item.category || 'general',
        icon: item.icon || '🔧',
        features: item.features || [],
        status: item.active === false ? 'Inactive' : 'Active',
      })));
    } catch { /* keep empty */ }
  };
  useEffect(() => { loadServices(); }, []);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    estimatedDurationMinutes: '',
    category: 'general',
    icon: '🔧',
    features: '',
    status: 'Active',
  });

  const handleAddService = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      price: Number(formData.price) || 0,
      estimatedDurationMinutes: Number(formData.estimatedDurationMinutes) || null,
      category: formData.category,
      icon: formData.icon || '🔧',
      features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
      active: formData.status === 'Active',
    };
    try {
      if (editingId) {
        await servicesApi.update(editingId, payload);
      } else {
        await servicesApi.create(payload);
      }
      await loadServices();
      setEditingId(null);
    } catch { alert('Failed to save service.'); }
    setFormData({ name: '', description: '', price: '', estimatedDurationMinutes: '', category: 'general', icon: '🔧', features: '', status: 'Active' });
    setShowForm(false);
  };

  const handleEdit = (service) => {
    setFormData({
      name: service.name || '',
      description: service.description || '',
      status: service.status || 'Active',
      price: String(service.price || '').replace(/[₹,]/g, ''),
      estimatedDurationMinutes: service.estimatedDurationMinutes || '',
      category: service.category || 'general',
      icon: service.icon || '🔧',
      features: (service.features || []).join(', '),
    });
    setEditingId(service.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await servicesApi.delete(id);
      await loadServices();
    } catch { alert('Failed to delete service.'); }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', estimatedDurationMinutes: '', category: 'general', icon: '🔧', features: '', status: 'Active' });
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>🔧 Manage Services</h1>
          <p className="header-subtitle">Create and manage customer-visible services from one place</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add Service'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingId ? 'Edit Service' : 'Add New Service'}</h3>
          <form className="service-form" onSubmit={handleAddService}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Service Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="number"
                min="1"
                placeholder="Estimated Duration (minutes)"
                value={formData.estimatedDurationMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedDurationMinutes: e.target.value })}
              />
            </div>
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              required
            />
            <textarea
              placeholder="Features (comma-separated)"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              rows="2"
              required
            />
            <div className="form-row">
              <input
                type="text"
                placeholder="Category (e.g., repair, breakdown)"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
              <input
                type="text"
                placeholder="Icon (emoji, optional)"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                min="1"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingId ? 'Update Service' : 'Add Service'}</button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="services-grid">
        {services.map((service) => (
          <div key={service.id} className="service-card">
            <div className="service-header">
              <span className="service-icon">{service.icon || '🔧'}</span>
              <span className={`status ${(service.status || 'active').toLowerCase()}`}>{service.status || 'Active'}</span>
            </div>
            <h3>{service.name}</h3>
            <p className="service-description">{service.description}</p>
            <div className="service-price">
              <strong>Category:</strong> {service.category || 'general'}
            </div>
            <div className="service-features">
              <strong>Features:</strong>
              <ul>
                {(service.features || []).slice(0, 3).map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
                {(service.features || []).length > 3 && <li>+ {service.features.length - 3} more</li>}
              </ul>
            </div>
            <div className="service-price">
              <strong>Price:</strong> ₹{service.price}
            </div>
            <div className="service-price">
              <strong>Duration:</strong> {service.estimatedDurationMinutes ? `${service.estimatedDurationMinutes} min` : 'N/A'}
            </div>
            <div className="service-actions">
              <button className="btn-edit" onClick={() => handleEdit(service)}>Edit</button>
              <button className="btn-delete" onClick={() => handleDelete(service.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageServices;
