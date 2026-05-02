import React, { useMemo, useState, useEffect, useCallback } from 'react';
import CommonTable from '../../components/CommonTable.jsx';
import { inventoryApi } from '../../utils/apiService';
import './ManageInventory.css';

function ManageInventory() {
  const [inventory, setInventory] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [activeView, setActiveView] = useState('parts'); // parts | addPart | stockHistory | useInService | reports
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [stockUpdateId, setStockUpdateId] = useState(null);
  const [stockUpdateQty, setStockUpdateQty] = useState('');
  const [reportData, setReportData] = useState(null);

  const [formData, setFormData] = useState({
    name: '', category: '', purchasePrice: '', sellingPrice: '', stock: '',
    minStock: '5', supplier: '', description: '', image: ''
  });

  const [useForm, setUseForm] = useState({
    partId: '', quantity: '', serviceId: '', customerName: ''
  });

  const categories = [
    'Engine', 'Brake', 'Electrical', 'Oil & Fluids', 'Body', 'Suspension',
    'Transmission', 'Exhaust', 'Cooling', 'Filters', 'Tyres', 'Battery', 'Other'
  ];

  const loadInventory = useCallback(async () => {
    try {
      const res = await inventoryApi.list();
      const raw = res?.data || res || [];
      setInventory(raw.map(item => {
        const stock = Number(item.stock) || 0;
        const minStock = Number(item.minStock) || 5;
        return {
          ...item,
          id: item.id || item._id || '',
          stock,
          minStock,
          purchasePrice: Number(item.purchasePrice || item.price || 0),
          sellingPrice: Number(item.sellingPrice || item.price || 0),
          supplier: item.supplier || '—',
          category: item.category || '—',
          description: item.description || '',
          status: stock <= 0 ? 'Out of Stock' : stock <= minStock ? 'Low Stock' : 'In Stock',
        };
      }));
    } catch (err) {
      console.error('Error loading inventory:', err);
    }
  }, []);

  const loadStockHistory = useCallback(async () => {
    try {
      const res = await inventoryApi.stockHistory();
      setStockHistory(res?.data || res || []);
    } catch (err) {
      console.error('Error loading stock history:', err);
    }
  }, []);

  const loadReport = useCallback(async () => {
    try {
      const res = await inventoryApi.report();
      setReportData(res?.data || res || null);
    } catch (err) {
      console.error('Error loading report:', err);
    }
  }, []);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  // Summary stats
  const totalParts = inventory.length;
  const inStockCount = inventory.filter(i => i.status === 'In Stock').length;
  const lowStockCount = inventory.filter(i => i.status === 'Low Stock').length;
  const outOfStockCount = inventory.filter(i => i.status === 'Out of Stock').length;
  const totalValue = inventory.reduce((s, i) => s + (i.sellingPrice * i.stock), 0);

  const resetForm = () => {
    setFormData({ name: '', category: '', purchasePrice: '', sellingPrice: '', stock: '', minStock: '5', supplier: '', description: '', image: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      category: formData.category,
      purchasePrice: Number(formData.purchasePrice || 0),
      sellingPrice: Number(formData.sellingPrice || 0),
      price: Number(formData.sellingPrice || 0),
      stock: Number(formData.stock || 0),
      minStock: Number(formData.minStock || 5),
      supplier: formData.supplier,
      description: formData.description,
      image: formData.image,
      active: true,
    };

    try {
      if (editingId) {
        await inventoryApi.update(editingId, payload);
      } else {
        await inventoryApi.create(payload);
      }
      await loadInventory();
      resetForm();
      setActiveView('parts');
    } catch (err) {
      console.error('Error saving part:', err);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name || '',
      category: item.category || '',
      purchasePrice: String(item.purchasePrice || ''),
      sellingPrice: String(item.sellingPrice || ''),
      stock: String(item.stock || ''),
      minStock: String(item.minStock || '5'),
      supplier: item.supplier || '',
      description: item.description || '',
      image: item.image || '',
    });
    setEditingId(item.id);
    setActiveView('addPart');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this part?')) return;
    try {
      await inventoryApi.delete(id);
      await loadInventory();
    } catch (err) {
      console.error('Error deleting part:', err);
    }
  };

  const handleStockUpdate = async (id) => {
    const qty = Number(stockUpdateQty);
    if (!qty && qty !== 0) return;
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    try {
      await inventoryApi.update(id, { stock: item.stock + qty });
      await loadInventory();
      setStockUpdateId(null);
      setStockUpdateQty('');
    } catch (err) {
      console.error('Error updating stock:', err);
    }
  };

  const handleUseInService = async (e) => {
    e.preventDefault();
    try {
      await inventoryApi.useInService({
        partId: Number(useForm.partId),
        quantity: Number(useForm.quantity),
        serviceId: useForm.serviceId || undefined,
        customerName: useForm.customerName || undefined,
      });
      await loadInventory();
      setUseForm({ partId: '', quantity: '', serviceId: '', customerName: '' });
      alert('Part used in service successfully! Stock deducted.');
    } catch (err) {
      alert(err?.message || 'Failed to use part in service');
    }
  };

  const uniqueCategories = useMemo(() => ['All', ...new Set(inventory.map(i => i.category).filter(Boolean))], [inventory]);

  const filteredInventory = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return inventory.filter(item => {
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchSearch = !s || (item.name || '').toLowerCase().includes(s) || (item.supplier || '').toLowerCase().includes(s) || String(item.id).includes(s);
      return matchStatus && matchCategory && matchSearch;
    });
  }, [inventory, statusFilter, categoryFilter, searchTerm]);

  const inventoryColumns = useMemo(() => [
    { accessorKey: 'id', header: 'Part ID' },
    { accessorKey: 'name', header: 'Part Name' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'purchasePrice', header: 'Purchase ₹', Cell: ({ cell }) => `₹${Number(cell.getValue()).toLocaleString('en-IN')}` },
    { accessorKey: 'sellingPrice', header: 'Selling ₹', Cell: ({ cell }) => `₹${Number(cell.getValue()).toLocaleString('en-IN')}` },
    { accessorKey: 'stock', header: 'Stock Qty' },
    { accessorKey: 'minStock', header: 'Min Stock' },
    { accessorKey: 'supplier', header: 'Supplier' },
    { accessorKey: 'status', header: 'Status', Cell: ({ cell }) => {
      const val = cell.getValue();
      const cls = val === 'In Stock' ? 'status-badge in-stock' : val === 'Low Stock' ? 'status-badge low-stock' : 'status-badge out-of-stock';
      return <span className={cls}>{val}</span>;
    }},
    { accessorKey: 'actions', header: 'Actions', Cell: ({ row }) => (
      <div className="inv-actions">
        <button className="inv-btn edit" onClick={() => handleEdit(row.original)} title="Edit">✏️</button>
        <button className="inv-btn stock" onClick={() => { setStockUpdateId(row.original.id); setStockUpdateQty(''); }} title="Update Stock">📦</button>
        <button className="inv-btn delete" onClick={() => handleDelete(row.original.id)} title="Delete">🗑️</button>
      </div>
    )},
  ], [inventory]);

  const historyColumns = useMemo(() => [
    { accessorKey: 'id', header: '#' },
    { accessorKey: 'createdAt', header: 'Date', Cell: ({ cell }) => cell.getValue() ? new Date(cell.getValue()).toLocaleDateString('en-IN') : '—' },
    { accessorKey: 'partName', header: 'Part Name' },
    { accessorKey: 'action', header: 'Action', Cell: ({ cell }) => {
      const val = cell.getValue();
      const cls = val === 'Added' ? 'action-badge added' : val === 'Used in Service' ? 'action-badge used' : 'action-badge adjusted';
      return <span className={cls}>{val}</span>;
    }},
    { accessorKey: 'quantityChange', header: 'Qty Change', Cell: ({ cell }) => {
      const val = cell.getValue();
      return <span style={{ color: val > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{val > 0 ? '+' : ''}{val}</span>;
    }},
    { accessorKey: 'stockAfter', header: 'Stock After' },
    { accessorKey: 'note', header: 'Note' },
  ], []);

  // Low stock alerts
  const lowStockItems = inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock');

  return (
    <div className="admin-page inv-page">

      {/* Dashboard Summary Cards */}
      <div className="inv-summary-grid">
        <div className="inv-summary-card">
          <div className="inv-summary-icon">📦</div>
          <div className="inv-summary-info">
            <span className="inv-summary-value">{totalParts}</span>
            <span className="inv-summary-label">Total Parts</span>
          </div>
        </div>
        <div className="inv-summary-card in-stock">
          <div className="inv-summary-icon">✅</div>
          <div className="inv-summary-info">
            <span className="inv-summary-value">{inStockCount}</span>
            <span className="inv-summary-label">In Stock</span>
          </div>
        </div>
        <div className="inv-summary-card low-stock">
          <div className="inv-summary-icon">⚠️</div>
          <div className="inv-summary-info">
            <span className="inv-summary-value">{lowStockCount}</span>
            <span className="inv-summary-label">Low Stock</span>
          </div>
        </div>
        <div className="inv-summary-card out-of-stock">
          <div className="inv-summary-icon">❌</div>
          <div className="inv-summary-info">
            <span className="inv-summary-value">{outOfStockCount}</span>
            <span className="inv-summary-label">Out of Stock</span>
          </div>
        </div>
        <div className="inv-summary-card value">
          <div className="inv-summary-icon">💰</div>
          <div className="inv-summary-info">
            <span className="inv-summary-value">₹{totalValue.toLocaleString('en-IN')}</span>
            <span className="inv-summary-label">Inventory Value</span>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="inv-alert-banner">
          <span className="inv-alert-icon">🔔</span>
          <span><strong>{lowStockItems.length} part(s)</strong> need attention — low or out of stock!</span>
          <button className="inv-alert-btn" onClick={() => setStatusFilter(statusFilter === 'Low Stock' ? 'All' : 'Low Stock')}>View Low Stock</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="inv-nav-tabs">
        <button className={`inv-tab ${activeView === 'parts' ? 'active' : ''}`} onClick={() => setActiveView('parts')}>
          📋 Parts List
        </button>
        <button className={`inv-tab ${activeView === 'addPart' ? 'active' : ''}`} onClick={() => { resetForm(); setActiveView('addPart'); }}>
          ➕ Add New Part
        </button>
        <button className={`inv-tab ${activeView === 'stockHistory' ? 'active' : ''}`} onClick={() => { setActiveView('stockHistory'); loadStockHistory(); }}>
          📜 Stock History
        </button>
        <button className={`inv-tab ${activeView === 'useInService' ? 'active' : ''}`} onClick={() => setActiveView('useInService')}>
          🔧 Use in Service
        </button>
        <button className={`inv-tab ${activeView === 'reports' ? 'active' : ''}`} onClick={() => { setActiveView('reports'); loadReport(); }}>
          📊 Reports
        </button>
      </div>

      {/* ===== PARTS LIST VIEW ===== */}
      {activeView === 'parts' && (
        <>
          {/* Filters */}
          <div className="inv-filter-bar">
            <div className="inv-status-filters">
              {['All', 'In Stock', 'Low Stock', 'Out of Stock'].map(s => (
                <button key={s} className={`inv-filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                  {s} <span className="inv-badge">{s === 'All' ? totalParts : inventory.filter(i => i.status === s).length}</span>
                </button>
              ))}
            </div>
            <div className="inv-search-row">
              <select className="inv-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="inv-search" type="text" placeholder="🔍 Search by name, supplier, or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          {/* Stock Update Modal */}
          {stockUpdateId && (
            <div className="inv-stock-modal">
              <div className="inv-stock-modal-content">
                <h3>📦 Update Stock — {inventory.find(i => i.id === stockUpdateId)?.name}</h3>
                <p>Current Stock: <strong>{inventory.find(i => i.id === stockUpdateId)?.stock}</strong></p>
                <div className="inv-stock-input-row">
                  <input type="number" placeholder="Qty to add (use negative to subtract)" value={stockUpdateQty} onChange={e => setStockUpdateQty(e.target.value)} className="inv-stock-input" />
                  <button className="btn-primary" onClick={() => handleStockUpdate(stockUpdateId)}>Update</button>
                  <button className="btn-secondary" onClick={() => setStockUpdateId(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ padding: '0 20px 20px' }}>
            <CommonTable columns={inventoryColumns} data={filteredInventory} fileName="spare-parts-inventory" showSelection={true} />
          </div>
        </>
      )}

      {/* ===== ADD / EDIT PART FORM ===== */}
      {activeView === 'addPart' && (
        <div className="inv-form-section">
          <h2>{editingId ? '✏️ Edit Spare Part' : '➕ Add New Spare Part'}</h2>
          <form className="inv-form" onSubmit={handleSubmit}>
            <div className="inv-form-grid">
              <div className="inv-form-group">
                <label>Part Name <span className="req">*</span></label>
                <input type="text" placeholder="e.g. Brake Pad Set" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="inv-form-group">
                <label>Category <span className="req">*</span></label>
                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="inv-form-group">
                <label>Purchase Price (₹) <span className="req">*</span></label>
                <input type="number" min="0" step="0.01" placeholder="₹0.00" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: e.target.value })} required />
              </div>
              <div className="inv-form-group">
                <label>Selling Price (₹) <span className="req">*</span></label>
                <input type="number" min="0" step="0.01" placeholder="₹0.00" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })} required />
              </div>
              <div className="inv-form-group">
                <label>Stock Quantity <span className="req">*</span></label>
                <input type="number" min="0" placeholder="0" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} required />
              </div>
              <div className="inv-form-group">
                <label>Minimum Stock (Alert Level)</label>
                <input type="number" min="0" placeholder="5" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: e.target.value })} />
              </div>
              <div className="inv-form-group">
                <label>Supplier Name</label>
                <input type="text" placeholder="e.g. Bosch India" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} />
              </div>
              <div className="inv-form-group">
                <label>Part Image URL (optional)</label>
                <input type="url" placeholder="https://..." value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
              </div>
            </div>
            <div className="inv-form-group full">
              <label>Description</label>
              <textarea rows="3" placeholder="Part description, specifications, notes..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="inv-form-actions">
              <button type="submit" className="btn-primary">{editingId ? '💾 Update Part' : '➕ Add Part'}</button>
              <button type="button" className="btn-secondary" onClick={() => { resetForm(); setActiveView('parts'); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ===== STOCK HISTORY VIEW ===== */}
      {activeView === 'stockHistory' && (
        <div className="inv-history-section">
          <div className="inv-section-header">
            <h2>📜 Stock Movement History</h2>
            <button className="btn-secondary" onClick={loadStockHistory}>🔄 Refresh</button>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <CommonTable columns={historyColumns} data={stockHistory} fileName="stock-history" showSelection={false} />
          </div>
        </div>
      )}

      {/* ===== USE IN SERVICE VIEW ===== */}
      {activeView === 'useInService' && (
        <div className="inv-form-section">
          <h2>🔧 Use Part in Service</h2>
          <p className="inv-form-desc">Select a part used during vehicle servicing. Stock will be automatically deducted and recorded in history.</p>
          <form className="inv-form" onSubmit={handleUseInService}>
            <div className="inv-form-grid">
              <div className="inv-form-group">
                <label>Select Part <span className="req">*</span></label>
                <select value={useForm.partId} onChange={e => setUseForm({ ...useForm, partId: e.target.value })} required>
                  <option value="">— Select Part —</option>
                  {inventory.filter(i => i.stock > 0).map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Stock: {i.stock}) — ₹{i.sellingPrice}</option>
                  ))}
                </select>
              </div>
              <div className="inv-form-group">
                <label>Quantity Used <span className="req">*</span></label>
                <input type="number" min="1" max={useForm.partId ? (inventory.find(i => i.id === Number(useForm.partId))?.stock || 999) : 999} placeholder="1" value={useForm.quantity} onChange={e => setUseForm({ ...useForm, quantity: e.target.value })} required />
              </div>
              <div className="inv-form-group">
                <label>Service / Job ID</label>
                <input type="text" placeholder="e.g. SRV-001" value={useForm.serviceId} onChange={e => setUseForm({ ...useForm, serviceId: e.target.value })} />
              </div>
              <div className="inv-form-group">
                <label>Customer Name</label>
                <input type="text" placeholder="Customer name" value={useForm.customerName} onChange={e => setUseForm({ ...useForm, customerName: e.target.value })} />
              </div>
            </div>
            {useForm.partId && useForm.quantity && (
              <div className="inv-use-preview">
                <p>💡 <strong>{inventory.find(i => i.id === Number(useForm.partId))?.name}</strong> × {useForm.quantity} = <strong>₹{((inventory.find(i => i.id === Number(useForm.partId))?.sellingPrice || 0) * Number(useForm.quantity)).toLocaleString('en-IN')}</strong></p>
              </div>
            )}
            <div className="inv-form-actions">
              <button type="submit" className="btn-primary">🔧 Deduct Stock & Record</button>
              <button type="button" className="btn-secondary" onClick={() => setUseForm({ partId: '', quantity: '', serviceId: '', customerName: '' })}>Clear</button>
            </div>
          </form>
        </div>
      )}

      {/* ===== REPORTS VIEW ===== */}
      {activeView === 'reports' && (
        <div className="inv-reports-section">
          <div className="inv-section-header">
            <h2>📊 Inventory Reports</h2>
            <button className="btn-secondary" onClick={loadReport}>🔄 Refresh</button>
          </div>

          {reportData ? (
            <>
              {/* Report Summary */}
              <div className="inv-report-stats">
                <div className="inv-report-stat"><span className="inv-report-num">{reportData.totalParts}</span><span>Total Parts</span></div>
                <div className="inv-report-stat in-stock"><span className="inv-report-num">{reportData.inStock}</span><span>In Stock</span></div>
                <div className="inv-report-stat low"><span className="inv-report-num">{reportData.lowStock}</span><span>Low Stock</span></div>
                <div className="inv-report-stat out"><span className="inv-report-num">{reportData.outOfStock}</span><span>Out of Stock</span></div>
                <div className="inv-report-stat value"><span className="inv-report-num">₹{(reportData.totalValue || 0).toLocaleString('en-IN')}</span><span>Total Value (Selling)</span></div>
                <div className="inv-report-stat cost"><span className="inv-report-num">₹{(reportData.totalCost || 0).toLocaleString('en-IN')}</span><span>Total Cost (Purchase)</span></div>
              </div>

              {/* Most Used Parts */}
              {reportData.mostUsed && reportData.mostUsed.length > 0 && (
                <div className="inv-report-block">
                  <h3>🔥 Most Used Parts</h3>
                  <div className="inv-most-used-grid">
                    {reportData.mostUsed.map((p, i) => (
                      <div key={p.partId} className="inv-most-used-card">
                        <span className="inv-rank">#{i + 1}</span>
                        <span className="inv-part-name">{p.partName}</span>
                        <span className="inv-used-count">{p.totalUsed} used</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Low Stock Report Table */}
              <div className="inv-report-block">
                <h3>⚠️ Low Stock Report</h3>
                {inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length > 0 ? (
                  <div style={{ padding: '0 0 20px' }}>
                    <CommonTable
                      columns={[
                        { accessorKey: 'id', header: 'ID' },
                        { accessorKey: 'name', header: 'Part Name' },
                        { accessorKey: 'category', header: 'Category' },
                        { accessorKey: 'stock', header: 'Current Stock' },
                        { accessorKey: 'minStock', header: 'Min Level' },
                        { accessorKey: 'supplier', header: 'Supplier' },
                        { accessorKey: 'status', header: 'Status', Cell: ({ cell }) => {
                          const val = cell.getValue();
                          const cls = val === 'Low Stock' ? 'status-badge low-stock' : 'status-badge out-of-stock';
                          return <span className={cls}>{val}</span>;
                        }},
                      ]}
                      data={inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock')}
                      fileName="low-stock-report"
                      showSelection={false}
                    />
                  </div>
                ) : (
                  <p className="inv-no-data">✅ All parts are well-stocked!</p>
                )}
              </div>

              {/* Full Inventory Report Table */}
              <div className="inv-report-block">
                <h3>📦 Full Inventory Report</h3>
                <div style={{ padding: '0 0 20px' }}>
                  <CommonTable
                    columns={[
                      { accessorKey: 'id', header: 'ID' },
                      { accessorKey: 'name', header: 'Part Name' },
                      { accessorKey: 'category', header: 'Category' },
                      { accessorKey: 'purchasePrice', header: 'Purchase ₹' },
                      { accessorKey: 'sellingPrice', header: 'Selling ₹' },
                      { accessorKey: 'stock', header: 'Stock' },
                      { accessorKey: 'supplier', header: 'Supplier' },
                      { accessorKey: 'status', header: 'Status' },
                    ]}
                    data={inventory}
                    fileName="full-inventory-report"
                    showSelection={false}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="inv-loading">Loading report data...</div>
          )}
        </div>
      )}

    </div>
  );
}

export default ManageInventory;
