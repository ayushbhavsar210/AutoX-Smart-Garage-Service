import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../logo.jpeg';
import './PDFInvoiceGenerator.css';

const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusClass = (value) => {
  const v = String(value || '').toLowerCase();
  if (v === 'completed' || v === 'paid' || v === 'success') return 'completed';
  if (v === 'failed') return 'failed';
  return 'pending';
};

function PDFInvoiceGenerator() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);

  // Load bookings from localStorage
  useEffect(() => {
    const storedBookings = localStorage.getItem('bookings');
    
    if (storedBookings) {
      const parsedBookings = JSON.parse(storedBookings);
      
      // Filter completed bookings
      const completedBookings = parsedBookings.filter(b => 
        b.status === 'Completed' || b.status === 'completed'
      );
      
      setBookings(completedBookings);
    }
  }, []);

  // Handle booking selection
  const handleSelectBooking = (booking) => {
    const storedCustomers = localStorage.getItem('customers');
    const customers = storedCustomers ? JSON.parse(storedCustomers) : [];
    const customer = customers.find(c => c.id === booking.customerId);
    
    const storedServices = localStorage.getItem('services');
    const services = storedServices ? JSON.parse(storedServices) : [];
    const service = services.find(s => s.id === booking.serviceId);

    // Calculate tax (18% GST)
    const subtotal = booking.amount || 0;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = subtotal + tax;

    setInvoiceData({
      invoiceNumber: `INV-${booking.id || Date.now()}`,
      invoiceDate: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      customer: customer || {
        name: booking.customerName || 'Unknown Customer',
        email: booking.customerEmail || 'N/A',
        phone: booking.customerPhone || 'N/A',
        address: booking.address || 'N/A'
      },
      service: service || {
        name: booking.serviceName || 'Service',
        description: booking.serviceDescription || 'Service Description'
      },
      bookingDetails: booking,
      subtotal,
      tax,
      total,
      paymentStatus: booking.paymentStatus || 'Pending',
      bookingDate: booking.bookingDate || new Date().toLocaleDateString('en-IN'),
      completionDate: booking.completionDate || new Date().toLocaleDateString('en-IN')
    });
    setSelectedBooking(booking);
  };

  // Generate PDF
  const generatePDF = async () => {
    if (!invoiceData) return;

    try {
      const element = document.getElementById('invoice-template');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Download as PDF
  const handleDownloadPDF = () => {
    generatePDF();
  };

  // Print invoice
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pdf-invoice-generator">
      <div className="invoice-container">
        <div className="invoice-page-brand">
          <img src={logo} alt="AutoX Logo" className="invoice-page-logo" />
          <div>
            <h1>AutoX Invoice Studio</h1>
            <p className="subtitle">Generate branded, print-ready invoices for completed bookings</p>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bookings-section">
          <h2>Completed Bookings</h2>
          {bookings.length === 0 ? (
            <div className="no-bookings">
              <p>No completed bookings found in localStorage</p>
            </div>
          ) : (
            <div className="bookings-grid">
              {bookings.map((booking, index) => (
                <div
                  key={index}
                  className={`booking-card ${selectedBooking?.id === booking.id ? 'selected' : ''}`}
                  onClick={() => handleSelectBooking(booking)}
                >
                  <div className="booking-info">
                    <h3>{booking.serviceName || 'Service'}</h3>
                    <p>
                      <strong>Customer:</strong> {booking.customerName || 'Unknown'}
                    </p>
                    <p>
                      <strong>Amount:</strong> {formatINR(booking.amount)}
                    </p>
                    <p>
                      <strong>Status:</strong> <span className={`status ${statusClass(booking.status)}`}>{booking.status || 'Pending'}</span>
                    </p>
                    <p>
                      <strong>Payment:</strong> <span className={`payment ${statusClass(booking.paymentStatus)}`}>
                        {booking.paymentStatus || 'Pending'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice Preview */}
        {invoiceData && (
          <div className="invoice-preview-section">
            <div className="preview-controls">
              <button onClick={handleDownloadPDF} className="btn btn-download">
                📥 Download PDF
              </button>
              <button onClick={handlePrint} className="btn btn-print">
                🖨️ Print
              </button>
            </div>

            {/* Invoice Template */}
            <div id="invoice-template" className="invoice-template">
              <div className="invoice-header">
                <div className="company-info">
                  <div className="invoice-brand">
                    <img src={logo} alt="AutoX Logo" className="invoice-brand-logo" />
                    <div>
                      <h1>AutoX</h1>
                      <p>Smart Garage, Breakdown & Modification</p>
                    </div>
                  </div>
                  <p>Email: autoxgarageservice@gmail.com</p>
                  <p>Phone: +91 9913828214</p>
                  <p>Address: Ahmedabad, Gujarat, India</p>
                </div>
                <div className="invoice-title">
                  <h2>INVOICE</h2>
                  <p>Invoice #: {invoiceData.invoiceNumber}</p>
                  <p>Invoice Date: {invoiceData.invoiceDate}</p>
                </div>
              </div>

              {/* Customer Details */}
              <div className="invoice-details">
                <div className="customer-section">
                  <h3>Bill To:</h3>
                  <p><strong>{invoiceData.customer.name}</strong></p>
                  <p>Email: {invoiceData.customer.email}</p>
                  <p>Phone: {invoiceData.customer.phone}</p>
                  <p>Address: {invoiceData.customer.address}</p>
                </div>

                <div className="date-section">
                  <p><strong>Booking Date:</strong> {invoiceData.bookingDate}</p>
                  <p><strong>Completion Date:</strong> {invoiceData.completionDate}</p>
                  <p><strong>Payment Status:</strong> <span className={`status-badge ${statusClass(invoiceData.paymentStatus)}`}>{invoiceData.paymentStatus}</span></p>
                </div>
              </div>

              {/* Service Details */}
              <div className="service-details">
                <h3>Service Details:</h3>
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{invoiceData.service.name}</td>
                      <td>{invoiceData.service.description}</td>
                      <td>{formatINR(invoiceData.subtotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pricing Summary */}
              <div className="pricing-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span className="amount">{formatINR(invoiceData.subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (18% GST):</span>
                  <span className="amount">{formatINR(invoiceData.tax)}</span>
                </div>
                <div className="summary-row total">
                  <span><strong>Total Amount:</strong></span>
                  <span className="amount total-amount">{formatINR(invoiceData.total)}</span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="invoice-footer">
                <p>Thank you for choosing AutoX.</p>
                <p>For support, contact us at autoxgarageservice@gmail.com</p>
                <div className="terms">
                  <p><strong>Payment Terms:</strong> Due upon receipt</p>
                  <p><strong>Warranty:</strong> 30 days from completion date</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Invoice Selected */}
        {!invoiceData && (
          <div className="no-invoice">
            <p>👈 Select a booking from the list above to generate an invoice</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PDFInvoiceGenerator;
