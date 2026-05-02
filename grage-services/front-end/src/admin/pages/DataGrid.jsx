import React, { useState, useEffect, useMemo } from 'react';
import './DataGrid.css';
import CommonTable from '../../components/CommonTable.jsx';
import { usersApi, mechanicsApi, vehiclesApi, bookingApi, inventoryApi } from '../../utils/apiService';

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'mechanics', label: 'Mechanics' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'parts', label: 'Parts' },
];

function DataGrid() {
  const [activeTab, setActiveTab] = useState('users');
  const [tabData, setTabData] = useState({
    users: [],
    mechanics: [],
    vehicles: [],
    bookings: [],
    parts: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTabData = async () => {
      try {
        setLoading(true);
        setError('');
        const apiMap = {
          users: usersApi.list,
          mechanics: mechanicsApi.list,
          vehicles: vehiclesApi.listAll,
          bookings: bookingApi.listAll,
          parts: inventoryApi.list,
        };
        const fetcher = apiMap[activeTab];
        if (fetcher) {
          const res = await fetcher();
          const raw = res?.data || res || [];
          // Normalize fields per tab
          let normalized = raw;
          switch (activeTab) {
            case 'users':
              normalized = raw.map(u => ({
                ...u,
                id: u.userId || u._id || '',
                name: u.name || u.fullName || '—',
                email: u.email || '—',
                phone: u.phone || '—',
                role: u.role || '—',
                status: u.isActive === false ? 'Inactive' : 'Active',
                joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—',
              }));
              break;
            case 'mechanics':
              normalized = raw.map(m => ({
                ...m,
                id: m.mechanicCode || m._id || '',
                name: m.fullName || m.name || '—',
                specialty: Array.isArray(m.expertise) ? m.expertise.join(', ') : (m.expertise || '—'),
                experience: m.yearsExperience != null ? `${m.yearsExperience} yrs` : '—',
                phone: m.phone || '—',
                status: m.status || '—',
                rating: m.rating || '—',
              }));
              break;
            case 'vehicles':
              normalized = raw.map(v => ({
                ...v,
                id: v._id || '',
                owner: v.ownerName || v.userId || '—',
                registrationNo: v.plate || v.registrationNo || '—',
                model: v.model || '—',
                year: v.year || '—',
                type: v.fuelType || v.type || '—',
                status: v.status || 'Active',
              }));
              break;
            case 'bookings':
              normalized = raw.map(b => ({
                ...b,
                id: b.bookingNo || b.id || b._id || '',
                customer: b.customerName || '—',
                service: b.serviceName || b.serviceId || '—',
                date: b.date || (b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString('en-IN') : '—'),
                amount: b.amount != null ? `₹${b.amount}` : '—',
                status: b.status || '—',
              }));
              break;
            case 'parts':
              normalized = raw.map(p => ({
                ...p,
                id: p._id || '',
                name: p.name || '—',
                partNo: p.sku || '—',
                quantity: p.stock ?? '—',
                unitPrice: p.price != null ? `₹${p.price}` : '—',
                category: p.category || '—',
                supplier: p.supplier || '—',
              }));
              break;
            default:
              break;
          }
          setTabData(prev => ({ ...prev, [activeTab]: normalized }));
        }
      } catch (err) {
        console.error(`Error loading ${activeTab} data:`, err);
        setError(`Failed to load ${activeTab} data`);
      } finally {
        setLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab]);

  // TABLE COLUMNS (BASED ON TAB)
  const columns = useMemo(() => {
    switch (activeTab) {
      case 'users':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'email', header: 'Email' },
          { accessorKey: 'phone', header: 'Phone' },
          { accessorKey: 'role', header: 'Role' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'joinDate', header: 'Join Date' },
        ];

      case 'mechanics':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'specialty', header: 'Specialty' },
          { accessorKey: 'experience', header: 'Experience' },
          { accessorKey: 'phone', header: 'Phone' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'rating', header: 'Rating' },
        ];

      case 'vehicles':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'owner', header: 'Owner' },
          { accessorKey: 'registrationNo', header: 'Registration No' },
          { accessorKey: 'model', header: 'Model' },
          { accessorKey: 'year', header: 'Year' },
          { accessorKey: 'type', header: 'Type' },
          { accessorKey: 'status', header: 'Status' },
        ];

      case 'bookings':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'customer', header: 'Customer' },
          { accessorKey: 'service', header: 'Service' },
          { accessorKey: 'date', header: 'Date' },
          { accessorKey: 'amount', header: 'Amount' },
          { accessorKey: 'status', header: 'Status' },
        ];

      case 'parts':
        return [
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'name', header: 'Part Name' },
          { accessorKey: 'partNo', header: 'Part No' },
          { accessorKey: 'quantity', header: 'Quantity' },
          { accessorKey: 'unitPrice', header: 'Unit Price' },
          { accessorKey: 'category', header: 'Category' },
          { accessorKey: 'supplier', header: 'Supplier' },
        ];

      default:
        return [];
    }
  }, [activeTab]);

  const data = tabData[activeTab] || [];

  return (
    <div className="datagrid-container">
      <div className="datagrid-header">
        <h1>📊 Data Grid View</h1>
        <p>View and manage all system data</p>
      </div>

      {/* TABS */}
      <div className="datagrid-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${
              activeTab === tab.key ? "active" : ""
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div style={{ padding: "20px" }}>
        {loading && <p>Loading {activeTab} data...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && (
          <CommonTable
            columns={columns}
            data={data}
            fileName={`${activeTab}-data`}
            showSelection={true}
          />
        )}
      </div>
    </div>
  );
}

export default DataGrid;