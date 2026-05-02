import React, { useMemo, useState, useEffect } from 'react';
import CommonTable from '../../components/CommonTable.jsx';
import { notificationApi } from '../../utils/apiService';

function ManageNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.listAll();
      const raw = res?.data || res || [];
      setNotifications(raw.map(item => ({
        id: item.id || item._id || '',
        userId: item.userId || 'N/A',
        title: item.title || 'N/A',
        message: item.message || '',
        type: item.type || 'general',
        read: item.read ? 'Read' : 'Unread',
        readAt: item.readAt ? new Date(item.readAt).toLocaleDateString('en-IN') : '—',
        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'N/A',
        _raw: item,
      })));
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const filteredNotifications = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return notifications.filter(item => {
      const matchesStatus = statusFilter === 'All' ||
        (statusFilter === 'Read' && item.read === 'Read') ||
        (statusFilter === 'Unread' && item.read === 'Unread');
      const matchesSearch = !search ||
        String(item.userId).includes(search) ||
        item.title.toLowerCase().includes(search) ||
        item.message.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [notifications, statusFilter, searchTerm]);

  const notificationColumns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'userId', header: 'User ID' },
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'message', header: 'Message' },
    { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'read', header: 'Status' },
    { accessorKey: 'date', header: 'Date' },
  ], []);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>🔔 Notifications</h1>
          <p className="header-subtitle">Total Notifications: {notifications.length}</p>
        </div>
      </div>

      <div className="controls-bar">
        <div className="filter-tabs">
          {['All', 'Unread', 'Read'].map((status) => (
            <button
              key={status}
              className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}{' '}
              <span className="badge-count">
                {status === 'All' ? notifications.length : notifications.filter(n => n.read === status).length}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by user ID, title or message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div style={{ padding: '20px' }}>
        <CommonTable
          columns={notificationColumns}
          data={filteredNotifications}
          fileName="notifications-data"
          showSelection={true}
        />
      </div>

      <div className="booking-stats">
        <div className="stat-item">
          <label>Total</label>
          <span>{notifications.length}</span>
        </div>
        <div className="stat-item">
          <label>Unread</label>
          <span>{notifications.filter(n => n.read === 'Unread').length}</span>
        </div>
        <div className="stat-item">
          <label>Read</label>
          <span>{notifications.filter(n => n.read === 'Read').length}</span>
        </div>
        <div className="stat-item">
          <label>Types</label>
          <span>{new Set(notifications.map(n => n.type)).size}</span>
        </div>
      </div>
    </div>
  );
}

export default ManageNotifications;
