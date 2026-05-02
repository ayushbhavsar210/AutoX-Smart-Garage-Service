import React, { useMemo, useState, useEffect } from 'react';
import CommonTable from '../../components/CommonTable.jsx';
import { contactApi } from '../../utils/apiService';

function ManageContacts() {
  const [contacts, setContacts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const loadContacts = async () => {
    try {
      const res = await contactApi.list();
      const raw = res?.data || res || [];
      setContacts(raw.map(item => ({
        id: item._id || '',
        name: item.name || 'N/A',
        email: item.email || 'N/A',
        phone: item.phone || 'N/A',
        service: item.service || 'N/A',
        message: item.message || '',
        status: item.status || 'new',
        date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'N/A',
      })));
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  useEffect(() => { loadContacts(); }, []);

  const filteredContacts = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return contacts.filter(item => {
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesSearch = !search ||
        item.name.toLowerCase().includes(search) ||
        item.email.toLowerCase().includes(search) ||
        item.message.toLowerCase().includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [contacts, statusFilter, searchTerm]);

  const contactColumns = useMemo(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'phone', header: 'Phone' },
    { accessorKey: 'service', header: 'Service' },
    { accessorKey: 'message', header: 'Message' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'date', header: 'Date' },
  ], []);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>📩 Contact Submissions</h1>
          <p className="header-subtitle">Total Messages: {contacts.length}</p>
        </div>
      </div>

      <div className="controls-bar">
        <div className="filter-tabs">
          {['All', 'new', 'read', 'replied'].map((status) => (
            <button
              key={status}
              className={`filter-tab ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'All' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}{' '}
              <span className="badge-count">
                {status === 'All' ? contacts.length : contacts.filter(c => c.status === status).length}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name, email or message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div style={{ padding: '20px' }}>
        <CommonTable
          columns={contactColumns}
          data={filteredContacts}
          fileName="contacts-data"
          showSelection={true}
        />
      </div>

      <div className="booking-stats">
        <div className="stat-item">
          <label>Total Messages</label>
          <span>{contacts.length}</span>
        </div>
        <div className="stat-item">
          <label>New</label>
          <span>{contacts.filter(c => c.status === 'new').length}</span>
        </div>
        <div className="stat-item">
          <label>Read</label>
          <span>{contacts.filter(c => c.status === 'read').length}</span>
        </div>
        <div className="stat-item">
          <label>Replied</label>
          <span>{contacts.filter(c => c.status === 'replied').length}</span>
        </div>
      </div>
    </div>
  );
}

export default ManageContacts;
