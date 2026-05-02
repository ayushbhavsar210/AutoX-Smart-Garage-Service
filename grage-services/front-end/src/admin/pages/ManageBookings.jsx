import React, { useEffect, useMemo, useState } from 'react';
import CommonTable from '../../components/CommonTable';
import { bookingApi, mechanicsApi } from '../../utils/apiService';
import './ManageBookings.css';
import './ManageBookings.css';

function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [searchVehicle, setSearchVehicle] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusPayload, setStatusPayload] = useState({ status: 'pending', mechanicId: '' });

  const loadBookings = React.useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (searchVehicle) query.set('vehicleNumber', searchVehicle);
      if (searchCustomer) query.set('customerName', searchCustomer);
      if (statusFilter !== 'all') query.set('status', statusFilter);

      const response = await bookingApi.listAdmin(query.toString());
      const data = Array.isArray(response?.data) ? response.data : [];
      setBookings(data);
    } catch (error) {
      console.error('Unable to load bookings', error);
      setBookings([]);
    }
  }, [searchVehicle, searchCustomer, statusFilter]);

  const loadMechanics = React.useCallback(async () => {
    try {
      const response = await mechanicsApi.list();
      const data = Array.isArray(response?.data) ? response.data : [];
      setMechanics(data);
    } catch (_error) {
      setMechanics([]);
    }
  }, []);

  useEffect(() => {
    loadBookings();
    loadMechanics();
  }, [loadBookings, loadMechanics]);

  const normalizedBookings = useMemo(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      bookingId: booking.id,
      customerName: booking.customerName || 'N/A',
      mobile: booking.mobile || 'N/A',
      vehicleNumber: booking.vehicleNumber || 'N/A',
      vehicleModel: booking.vehicleModel || 'N/A',
      serviceType: booking.serviceType || 'N/A',
      bookingDate: booking.bookingDate
        ? new Date(booking.bookingDate).toLocaleString('en-IN')
        : 'N/A',
      bookingStatus: booking.bookingStatus || booking.status || 'pending',
      mechanicName: booking.mechanicName || 'Unassigned',
      raw: booking,
    }));
  }, [bookings]);

  const filtered = useMemo(() => {
    return normalizedBookings.filter((item) => {
      const vehicleMatch =
        !searchVehicle || item.vehicleNumber.toLowerCase().includes(searchVehicle.toLowerCase());
      const customerMatch =
        !searchCustomer || item.customerName.toLowerCase().includes(searchCustomer.toLowerCase());
      const statusMatch =
        statusFilter === 'all' || item.bookingStatus.toLowerCase() === statusFilter.toLowerCase();
      return vehicleMatch && customerMatch && statusMatch;
    });
  }, [normalizedBookings, searchVehicle, searchCustomer, statusFilter]);

  const handleDelete = React.useCallback(async (bookingId) => {
    if (!window.confirm('Delete this booking?')) return;
    await bookingApi.delete(bookingId);
    await loadBookings();
  }, [loadBookings]);

  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setStatusPayload({
      status: booking.bookingStatus || 'pending',
      mechanicId: booking.raw?.mechanicId ? String(booking.raw.mechanicId) : '',
    });
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (event) => {
    event.preventDefault();
    if (!selectedBooking) return;

    const selectedMechanic = mechanics.find(
      (mechanic) => String(mechanic.id) === String(statusPayload.mechanicId)
    );

    await bookingApi.updateStatus(selectedBooking.bookingId, {
      status: statusPayload.status,
      mechanicId: statusPayload.mechanicId ? Number(statusPayload.mechanicId) : undefined,
      mechanicName: selectedMechanic?.name || undefined,
    });

    setShowStatusModal(false);
    setSelectedBooking(null);
    await loadBookings();
  };

  const columns = useMemo(
    () => [
      { accessorKey: 'bookingId', header: 'Booking ID', size: 90 },
      { accessorKey: 'customerName', header: 'Customer Name', size: 140 },
      { accessorKey: 'mobile', header: 'Mobile Number', size: 130 },
      { accessorKey: 'vehicleNumber', header: 'Vehicle Number', size: 130 },
      { accessorKey: 'vehicleModel', header: 'Vehicle Model', size: 130 },
      { accessorKey: 'serviceType', header: 'Service Type', size: 130 },
      { accessorKey: 'bookingDate', header: 'Booking Date', size: 170 },
      { accessorKey: 'bookingStatus', header: 'Status', size: 110 },
      {
        accessorKey: 'actions',
        header: 'Actions',
        size: 240,
        Cell: ({ row }) => {
          const booking = row.original;
          return (
            <div className="action-buttons">
              <button className="btn-action btn-view" onClick={() => setSelectedBooking(booking)}>
                View
              </button>
              <button className="btn-action btn-edit" onClick={() => openStatusModal(booking)}>
                Update Status
              </button>
              <button className="btn-action btn-delete" onClick={() => handleDelete(booking.bookingId)}>
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [handleDelete]
  );

  return (
    <div className="admin-page bookings-admin-page">
      <div className="page-header">
        <div>
          <h1>Bookings</h1>
          <p className="header-subtitle">Manage all customer bookings from API-synced data</p>
        </div>
      </div>

      <div className="booking-filters">
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
          <label>Search by Customer Name</label>
          <input
            type="text"
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            placeholder="Customer name"
          />
        </div>

        <div className="filter-group">
          <label>Filter by Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <button className="btn-secondary" onClick={loadBookings}>Refresh</button>
      </div>

      <div className="bookings-container">
        <CommonTable columns={columns} data={filtered} fileName="admin-bookings" showSelection={false} />
      </div>

      {selectedBooking && !showStatusModal && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedBooking(null)}>✕</button>
            <h3>Booking Details</h3>
            <div className="view-grid">
              <p><strong>Booking ID:</strong> {selectedBooking.bookingId}</p>
              <p><strong>Customer Name:</strong> {selectedBooking.customerName}</p>
              <p><strong>Mobile:</strong> {selectedBooking.mobile}</p>
              <p><strong>Vehicle Number:</strong> {selectedBooking.vehicleNumber}</p>
              <p><strong>Vehicle Model:</strong> {selectedBooking.vehicleModel}</p>
              <p><strong>Service Type:</strong> {selectedBooking.serviceType}</p>
              <p><strong>Booking Date:</strong> {selectedBooking.bookingDate}</p>
              <p><strong>Status:</strong> {selectedBooking.bookingStatus}</p>
              <p><strong>Mechanic:</strong> {selectedBooking.mechanicName}</p>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => openStatusModal(selectedBooking)}>
                Update Status / Assign Mechanic
              </button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowStatusModal(false)}>✕</button>
            <h3>Update Booking Status</h3>

            <form onSubmit={handleUpdateStatus} className="vehicle-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={statusPayload.status}
                    onChange={(e) => setStatusPayload((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign Mechanic</label>
                  <select
                    value={statusPayload.mechanicId}
                    onChange={(e) => setStatusPayload((prev) => ({ ...prev, mechanicId: e.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {mechanics.map((mechanic) => (
                      <option key={mechanic.id} value={mechanic.id}>
                        {mechanic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowStatusModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageBookings;
