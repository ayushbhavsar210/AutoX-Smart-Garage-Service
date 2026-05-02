import React, { useState, useEffect, useMemo } from 'react';
import CommonTable from '../../components/CommonTable.jsx';
import { usersApi } from '../../utils/apiService';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user',
    password: '',
  });

  const loadUsers = async () => {
    try {
      const res = await usersApi.list();
      const raw = res?.data || res || [];
      // Normalize inconsistent field names from different user sources
      const normalized = raw.map((u, idx) => ({
        ...u,
        id: u.userId || u._id || idx + 1,
        name: u.name || u.fullName || '—',
        email: u.email || '—',
        phone: u.phone || '—',
        role: u.role || '—',
        status: u.isActive === false ? 'Inactive' : 'Active',
        joinDate: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—',
      }));
      setUsers(normalized);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'user',
      password: '',
    });
    setEditingId('');
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.name || !formData.email) {
      alert('Name and email are required.');
      return;
    }

    try {
      if (editingId) {
        await usersApi.update(editingId, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        });
        alert('User updated successfully.');
      } else {
        await usersApi.create({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          password: formData.password || 'Temp@1234',
        });
        alert('User created successfully.');
      }

      await loadUsers();
      resetForm();
    } catch (error) {
      alert(error?.message || 'Unable to save user.');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: (user.role || 'user').toLowerCase(),
      password: '',
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      await usersApi.delete(userId);
      await loadUsers();
      alert('User deleted successfully.');
    } catch (error) {
      alert(error?.message || 'Unable to delete user.');
    }
  };

  const userColumns = useMemo(() => [
    { accessorKey: 'id', header: 'ID', size: 100 },
    { accessorKey: 'name', header: 'Name', size: 180 },
    { accessorKey: 'email', header: 'Email', size: 250 },
    { accessorKey: 'phone', header: 'Phone', size: 140 },
    { accessorKey: 'role', header: 'Role', size: 100,
      Cell: ({ cell }) => {
        const val = (cell.getValue() || '').toLowerCase();
        const color = val === 'admin' ? '#e74c3c' : val === 'customer' ? '#2980b9' : '#7f8c8d';
        return <span style={{ fontWeight: 600, color, textTransform: 'capitalize' }}>{cell.getValue()}</span>;
      },
    },
    { accessorKey: 'status', header: 'Status', size: 100,
      Cell: ({ cell }) => {
        const active = cell.getValue() === 'Active';
        return (
          <span style={{
            padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            background: active ? '#e6f9ee' : '#fde8e8', color: active ? '#27ae60' : '#e74c3c',
          }}>{cell.getValue()}</span>
        );
      },
    },
    { accessorKey: 'joinDate', header: 'Join Date', size: 130 },
    {
      accessorKey: 'actions',
      header: 'Actions',
      size: 180,
      Cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="action-buttons">
            <button className="btn-action btn-view" onClick={() => setSelectedUser(user)}>View</button>
            <button className="btn-action btn-edit" onClick={() => handleEdit(user)}>Edit</button>
            <button className="btn-action btn-delete" onClick={() => handleDelete(user.id)}>Delete</button>
          </div>
        );
      },
    },
  ], []);

  const closeProfile = () => setSelectedUser(null);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>👥 Manage Users</h1>
        <div className="action-buttons">
          <span className="badge">{users.length} Total Users</span>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add User</button>
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>{editingId ? 'Edit User' : 'Add New User'}</h3>
          <form className="service-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {!editingId && (
              <input
                type="text"
                placeholder="Password (optional, defaults to Temp@1234)"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              />
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingId ? 'Update User' : 'Create User'}</button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bookings-container">
        <CommonTable 
          columns={userColumns}
          data={users}
          filename="users"
        />
      </div>

      {selectedUser && (
        <div className="modal-backdrop" onClick={closeProfile} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && closeProfile()}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-label">User Profile</p>
                <h3>{selectedUser.name}</h3>
              </div>
              <button className="modal-close" onClick={closeProfile} aria-label="Close profile">×</button>
            </div>
            <div className="modal-body">
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {selectedUser.phone}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Status:</strong> {selectedUser.status}</p>
              <p><strong>Joined:</strong> {selectedUser.joinDate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
