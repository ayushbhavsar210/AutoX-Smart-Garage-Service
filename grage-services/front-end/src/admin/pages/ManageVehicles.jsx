import React, { useEffect, useMemo, useState, useCallback } from 'react';
import CommonTable from '../../components/CommonTable';
import { vehiclesApi } from '../../utils/apiService';
import './ManageVehicles.css';

const emptyForm = {
  id: null,
  user_id: '',
  customer_name: '',
  mobile: '',
  vehicle_number: '',
  vehicle_company: '',
  vehicle_model: '',
  vehicle_type: 'Car',
  added_by: 'admin',
};

function ManageVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [searchVehicle, setSearchVehicle] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const loadVehicles = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (searchVehicle) query.set('vehicleNumber', searchVehicle);
      if (filterCustomer) query.set('customerName', filterCustomer);

      const response = await vehiclesApi.listAll(query.toString());
      setVehicles(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      console.error('Unable to load vehicles:', error);
      setVehicles([]);
    }
  }, [searchVehicle, filterCustomer]);

  const handleEdit = useCallback((vehicle) => {
    setFormData({
      id: vehicle.id,
      user_id: vehicle.user_id || '',
      customer_name: vehicle.customer_name || '',
      mobile: vehicle.mobile || '',
      vehicle_number: vehicle.vehicle_number || '',
      vehicle_company: vehicle.vehicle_company || '',
      vehicle_model: vehicle.vehicle_model || '',
      vehicle_type: vehicle.vehicle_type || 'Car',
      added_by: vehicle.added_by || 'admin',
    });
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (vehicleId) => {
    if (!window.confirm('Delete this vehicle?')) return;
    await vehiclesApi.deleteAdmin(vehicleId);
    await loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const customerOptions = useMemo(() => {
    const set = new Set();
    vehicles.forEach((vehicle) => {
      if (vehicle?.customer_name) set.add(vehicle.customer_name);
    });
    return Array.from(set);
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const byVehicle =
        !searchVehicle ||
        String(vehicle?.vehicle_number || '')
          .toLowerCase()
          .includes(searchVehicle.toLowerCase());
      const byCustomer =
        !filterCustomer || vehicle?.customer_name === filterCustomer;
      return byVehicle && byCustomer;
    });
  }, [vehicles, searchVehicle, filterCustomer]);

  const columns = useMemo(
    () => [
      { accessorKey: 'id', header: 'Vehicle ID', size: 90 },
      { accessorKey: 'customer_name', header: 'Customer Name', size: 150 },
      { accessorKey: 'mobile', header: 'Mobile Number', size: 130 },
      { accessorKey: 'vehicle_number', header: 'Vehicle Number', size: 130 },
      { accessorKey: 'vehicle_company', header: 'Vehicle Company', size: 130 },
      { accessorKey: 'vehicle_model', header: 'Vehicle Model', size: 130 },
      { accessorKey: 'vehicle_type', header: 'Vehicle Type', size: 90 },
      { accessorKey: 'added_by', header: 'Added From', size: 90 },
      {
        accessorKey: 'actions',
        header: 'Actions',
        size: 160,
        Cell: ({ row }) => {
          const vehicle = row.original;
          return (
            <div className="action-buttons">
              <button className="btn-action btn-view" onClick={() => setSelectedVehicle(vehicle)}>View</button>
              <button className="btn-action btn-edit" onClick={() => handleEdit(vehicle)}>Edit</button>
              <button className="btn-action btn-delete" onClick={() => handleDelete(vehicle.id)}>Delete</button>
            </div>
          );
        },
      },
    ],
    [handleEdit, handleDelete]
  );

  const resetForm = () => {
    setFormData(emptyForm);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...formData,
      vehicle_number: formData.vehicle_number.toUpperCase(),
      added_by: 'admin',
      user_id: formData.user_id ? Number(formData.user_id) : null,
    };

    if (!payload.customer_name || !payload.mobile || !payload.vehicle_number) {
      alert('Customer name, mobile and vehicle number are required.');
      return;
    }

    if (payload.id) {
      await vehiclesApi.updateAdmin(payload.id, payload);
      alert('Vehicle updated successfully.');
    } else {
      await vehiclesApi.createAdmin(payload);
      alert('Vehicle added successfully.');
    }

    resetForm();
    await loadVehicles();
  };

  

  return (
    <div className="admin-page vehicles-page">
      <div className="page-header">
        <h1>Vehicles</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          Add New Vehicle
        </button>
      </div>

      <div className="vehicle-filters">
        <div className="filter-group">
          <label>Search by Vehicle Number</label>
          <input
            type="text"
            value={searchVehicle}
            onChange={(e) => setSearchVehicle(e.target.value)}
            placeholder="e.g. MH12AB1234"
          />
        </div>
        <div className="filter-group">
          <label>Filter by Customer</label>
          <select value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)}>
            <option value="">All Customers</option>
            {customerOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-secondary" onClick={loadVehicles}>Refresh</button>
      </div>

      <div className="table-wrapper">
        <CommonTable columns={columns} data={filteredVehicles} fileName="vehicles" showSelection={false} />
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={resetForm}>✕</button>
            <h3>{formData.id ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
            <form className="vehicle-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>User ID (optional)</label>
                  <input
                    type="number"
                    value={formData.user_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, user_id: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customer_name: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mobile: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    value={formData.vehicle_number}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, vehicle_number: e.target.value.toUpperCase() }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Company</label>
                  <input
                    type="text"
                    value={formData.vehicle_company}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vehicle_company: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Model</label>
                  <input
                    type="text"
                    value={formData.vehicle_model}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vehicle_model: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select
                    value={formData.vehicle_type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vehicle_type: e.target.value }))}
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn-primary">{formData.id ? 'Update' : 'Save'} Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedVehicle && (
        <div className="modal-overlay" onClick={() => setSelectedVehicle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedVehicle(null)}>✕</button>
            <h3>Vehicle Details</h3>
            <div className="view-grid">
              <p><strong>Vehicle ID:</strong> {selectedVehicle.id}</p>
              <p><strong>Customer Name:</strong> {selectedVehicle.customer_name || '—'}</p>
              <p><strong>Mobile Number:</strong> {selectedVehicle.mobile || '—'}</p>
              <p><strong>Vehicle Number:</strong> {selectedVehicle.vehicle_number || '—'}</p>
              <p><strong>Vehicle Company:</strong> {selectedVehicle.vehicle_company || '—'}</p>
              <p><strong>Vehicle Model:</strong> {selectedVehicle.vehicle_model || '—'}</p>
              <p><strong>Vehicle Type:</strong> {selectedVehicle.vehicle_type || '—'}</p>
              <p><strong>Added From:</strong> {selectedVehicle.added_by || '—'}</p>
              <p><strong>Created At:</strong> {selectedVehicle.created_at ? new Date(selectedVehicle.created_at).toLocaleString('en-IN') : '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageVehicles;
