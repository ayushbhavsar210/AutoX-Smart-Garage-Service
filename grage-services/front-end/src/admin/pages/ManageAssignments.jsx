import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CommonTable from '../../components/CommonTable.jsx';
import { assignmentsApi, bookingApi, mechanicsApi, servicesApi } from '../../utils/apiService';

function ManageAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await assignmentsApi.list();
      const raw = res?.data || res || [];
      setAssignments(raw.map((a, idx) => ({
        ...a,
        id: a._id || idx + 1,
        mechanic: a.mechanicName || a.mechanicId || '—',
        customer: a.customerName || a.customer || '—',
        vehicle: a.vehicle || '—',
        service: a.service || '—',
        job: a.notes || a.job || '—',
        startDate: a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-IN') : '—',
        startTime: a.createdAt ? new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—',
        estimatedDuration: a.estimatedDuration || '—',
        statusKey: String(a.statusKey || a.status || 'assigned').toLowerCase(),
        status: a.status || 'Assigned',
        progress: Array.isArray(a.progress) ? `${a.progress.length} steps` : (a.progress || '—'),
      })));
    } catch (err) {
      console.error('Error loading assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssignments(); }, []);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const response = await bookingApi.listAdmin();
        const data = Array.isArray(response?.data) ? response.data : [];
        setBookingsList(data.map((booking) => ({
          id: booking.id,
          bookingId: booking.id,
          customerName: booking.customerName || '—',
          vehicleNumber: booking.vehicleNumber || '—',
          vehicleModel: booking.vehicleModel || '—',
          serviceName: booking.serviceName || booking.serviceType || '—',
          phone: booking.phone || '—',
        })));
      } catch (error) {
        console.error('Error loading bookings for assignment form:', error);
        setBookingsList([]);
      }
    };

    loadBookings();
  }, []);

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterMechanic, setFilterMechanic] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    bookingId: '',
    mechanic: '',
    customer: '',
    vehicle: '',
    service: '',
    job: '',
    estimatedDuration: '',
    phone: '',
    status: 'assigned'
  });

  const [mechanicsList, setMechanicsList] = useState([]);
  const [servicesList, setServicesList] = useState([]);

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [mechRes, svcRes] = await Promise.all([mechanicsApi.list(), servicesApi.list()]);
        setMechanicsList((mechRes?.data || mechRes || []).map((m) => ({
          id: m.id || m.mechanicId || m._id || String(m.name || m.fullName || m || ''),
          name: String(m.name || m.fullName || m || '').trim(),
        })).filter((item) => item.name));
        setServicesList((svcRes?.data || svcRes || []).map((s) => ({
          id: s.id || s.serviceId || s._id || String(s.name || s.title || s || ''),
          name: String(s.name || s.title || s || '').trim(),
        })).filter((item) => item.name));
      } catch (err) {
        console.error('Error loading dropdowns:', err);
      }
    };
    loadDropdowns();
  }, []);

  const normalizeStatusKey = useCallback((value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (['pending', 'assigned', 'open', 'scheduled'].includes(raw)) return 'assigned';
    if (['in progress', 'in-progress', 'in_progress'].includes(raw)) return 'in-progress';
    if (['completed', 'complete', 'done'].includes(raw)) return 'completed';
    return raw || 'assigned';
  }, []);

  const prettyStatus = useCallback((value) => {
    const status = normalizeStatusKey(value);
    if (status === 'assigned') return 'Assigned';
    if (status === 'in-progress') return 'In Progress';
    if (status === 'completed') return 'Completed';
    return String(value || 'Assigned');
  }, [normalizeStatusKey]);

  const normalizedAssignments = useMemo(() => assignments.map((assignment) => ({
    ...assignment,
    statusKey: normalizeStatusKey(assignment.statusKey || assignment.status),
    status: prettyStatus(assignment.statusKey || assignment.status),
  })), [assignments, prettyStatus, normalizeStatusKey]);

  const filteredAssignments = useMemo(() => {
    return normalizedAssignments.filter((assignment) => {
      const matchesStatus = filterStatus === 'All' || assignment.statusKey === normalizeStatusKey(filterStatus);
      const matchesMechanic = filterMechanic === 'All' || String(assignment.mechanic || '') === filterMechanic;
      const search = String(searchTerm || '').trim().toLowerCase();
      const matchesSearch = !search || [assignment.customer, assignment.vehicle, assignment.service, assignment.job, assignment.mechanic, assignment.status]
        .some((value) => String(value || '').toLowerCase().includes(search));

      return matchesStatus && matchesMechanic && matchesSearch;
    });
  }, [normalizedAssignments, filterStatus, filterMechanic, searchTerm, normalizeStatusKey]);

  const statusTabs = useMemo(() => {
    const priority = ['assigned', 'in-progress', 'completed'];
    const dynamicStatuses = Array.from(new Set(normalizedAssignments.map((item) => item.statusKey))).filter(Boolean);
    const ordered = [...priority.filter((item) => dynamicStatuses.includes(item)), ...dynamicStatuses.filter((item) => !priority.includes(item))];

    return ['All', ...ordered.map((status) => prettyStatus(status))];
  }, [normalizedAssignments, prettyStatus]);

  const assignmentColumns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'mechanic', header: 'Mechanic' },
    { accessorKey: 'customer', header: 'Customer' },
    { accessorKey: 'vehicle', header: 'Vehicle' },
    { accessorKey: 'service', header: 'Service' },
    { accessorKey: 'job', header: 'Job' },
    { accessorKey: 'startDate', header: 'Start Date' },
    { accessorKey: 'startTime', header: 'Start Time' },
    { accessorKey: 'estimatedDuration', header: 'Duration' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'progress', header: 'Progress' },
  ], []);

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (formData.bookingId && formData.mechanic && formData.job) {
      try {
        await assignmentsApi.create({
          ...formData,
          bookingId: Number(formData.bookingId),
          mechanicId: Number(mechanicsList.find((mechanic) => mechanic.name === formData.mechanic)?.id || 0),
          mechanicName: formData.mechanic,
          status: formData.status,
          progress: formData.status === 'completed' ? 100 : formData.status === 'in-progress' ? 50 : 0
        });
        await loadAssignments();
        setFormData({
          bookingId: '',
          mechanic: '',
          customer: '',
          vehicle: '',
          service: '',
          job: '',
          estimatedDuration: '',
          phone: '',
          status: 'assigned'
        });
        setShowForm(false);
      } catch (err) {
        console.error('Error adding assignment:', err);
      }
    }
  };

  const getStatusCount = (status) => {
    if (status === 'All') return assignments.length;
    return normalizedAssignments.filter((assignment) => assignment.status === status).length;
  };

  const getMechanicStats = (mechanicName) => {
    const mechanicJobs = normalizedAssignments.filter((assignment) => assignment.mechanic === mechanicName);
    return {
      total: mechanicJobs.length,
      active: mechanicJobs.filter((assignment) => assignment.statusKey === 'in-progress').length,
      completed: mechanicJobs.filter((assignment) => assignment.statusKey === 'completed').length
    };
  };

  const handleBookingSelect = (bookingId) => {
    const selectedBooking = bookingsList.find((booking) => String(booking.bookingId) === String(bookingId));

    setFormData((prev) => ({
      ...prev,
      bookingId,
      customer: selectedBooking?.customerName || prev.customer,
      vehicle: selectedBooking ? `${selectedBooking.vehicleNumber} - ${selectedBooking.vehicleModel}` : prev.vehicle,
      service: selectedBooking?.serviceName || prev.service,
      phone: selectedBooking?.phone || prev.phone,
      job: selectedBooking?.serviceName ? `${selectedBooking.serviceName} assignment` : prev.job,
    }));
  };

  const statusSummary = useMemo(() => ({
    total: normalizedAssignments.length,
    assigned: normalizedAssignments.filter((assignment) => assignment.statusKey === 'assigned').length,
    inProgress: normalizedAssignments.filter((assignment) => assignment.statusKey === 'in-progress').length,
    completed: normalizedAssignments.filter((assignment) => assignment.statusKey === 'completed').length,
  }), [normalizedAssignments]);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>📋 Job Assignments</h1>
          <p className="header-subtitle">Track mechanic jobs & vehicle assignments</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Assign Job'}
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>Assign New Job to Mechanic</h3>
          <form className="assignment-form" onSubmit={handleAddAssignment}>
            <div className="form-row">
              <select
                value={formData.bookingId}
                onChange={(e) => handleBookingSelect(e.target.value)}
                required
              >
                <option value="">Select Booking</option>
                {bookingsList.map((booking) => (
                  <option key={booking.bookingId} value={booking.bookingId}>
                    #{booking.bookingId} - {booking.customerName} - {booking.vehicleNumber}
                  </option>
                ))}
              </select>
              <select
                value={formData.mechanic}
                onChange={(e) => setFormData({ ...formData, mechanic: e.target.value })}
                required
              >
                <option value="">Select Mechanic</option>
                {mechanicsList.map((mechanic) => <option key={mechanic.id} value={mechanic.name}>{mechanic.name}</option>)}
              </select>
              <select
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                required
              >
                <option value="">Select Service</option>
                {servicesList.map((service) => <option key={service.id} value={service.name}>{service.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <input
                type="text"
                placeholder="Customer Name"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                readOnly
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                readOnly
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                placeholder="Vehicle (Model & Registration)"
                value={formData.vehicle}
                onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                readOnly
              />
              <input
                type="text"
                placeholder="Estimated Duration (e.g., 2 hours)"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
              />
            </div>
            <textarea
              placeholder="Job Description / Work to be done"
              value={formData.job}
              onChange={(e) => setFormData({ ...formData, job: e.target.value })}
              rows="2"
              required
            />
            <div className="form-row">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Assign Job</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="filter-section">
        <div className="filter-tabs">
          {statusTabs.map((status) => (
            <button
              key={status}
              className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status} <span className="badge-count">{getStatusCount(status)}</span>
            </button>
          ))}
        </div>
        <div className="filter-tabs" style={{ marginTop: '12px' }}>
          <button
            className={`filter-tab ${filterMechanic === 'All' ? 'active' : ''}`}
            onClick={() => setFilterMechanic('All')}
          >
            All Mechanics
          </button>
          {mechanicsList.map((mechanic) => {
            const stats = getMechanicStats(mechanic.name);
            return (
              <button
                key={mechanic.id}
                className={`filter-tab ${filterMechanic === mechanic.name ? 'active' : ''}`}
                onClick={() => setFilterMechanic(mechanic.name)}
              >
                {String(mechanic.name).split(' ')[0]} ({stats.active}/{stats.total})
              </button>
            );
          })}
        </div>
      </div>

      <div className="controls-bar" style={{ marginTop: '16px' }}>
        <input
          type="text"
          placeholder="Search by customer, vehicle, or job..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div style={{ padding: '20px' }}>
        <CommonTable 
          columns={assignmentColumns} 
          data={filteredAssignments} 
          fileName="assignments-data"
          showSelection={true}
        />
      </div>

      <div className="booking-stats">
        <div className="stat-item">
          <label>Total Assignments</label>
          <span>{statusSummary.total}</span>
        </div>
        <div className="stat-item">
          <label>Assigned</label>
          <span>{statusSummary.assigned}</span>
        </div>
        <div className="stat-item">
          <label>In Progress</label>
          <span>{statusSummary.inProgress}</span>
        </div>
        <div className="stat-item">
          <label>Completed Today</label>
          <span>{statusSummary.completed}</span>
        </div>
      </div>

      {loading && <div style={{ padding: '0 20px 20px' }}>Loading assignments...</div>}
    </div>
  );
}

export default ManageAssignments;
