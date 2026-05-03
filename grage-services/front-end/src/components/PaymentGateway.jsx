import React, { useState } from 'react';
import { useAuth, usePayments } from '../context';
import InvoiceGenerator from './InvoiceGenerator';
import { postPaymentRequest } from '../utils/paymentRequest';
import './PaymentGateway.css';

const toPaymentErrorMessage = (error) => {
  const raw = String(error?.message || '').trim();
  if (!raw) return 'Unable to start payment';

  if (raw.toLowerCase().includes('failed to fetch')) {
    return 'Unable to connect to payment server. Please check the backend deployment and API base URL.';
  }

  return raw;
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const MERCHANT_NAME = 'AutoX Garage';

function PaymentGateway({ amount, serviceName, onPaymentComplete, onCancel, isOpen, bookingId }) {
  const { makePayment } = usePayments();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [processedPayment, setProcessedPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Payment form states
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });

  const [upiDetails, setUpiDetails] = useState({
    upiId: ''
  });

  const [cashDetails, setCashDetails] = useState({
    fullName: '',
    phone: '',
    address: ''
  });

  // Payment methods and their details
  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit Card',
      icon: '💳',
      description: 'Pay securely using your credit card'
    },
    {
      id: 'debit_card',
      name: 'Debit Card',
      icon: '🏦',
      description: 'Pay using your debit card'
    },
    {
      id: 'upi',
      name: 'UPI/Digital Wallet',
      icon: '📱',
      description: 'Pay via UPI, PayTM, Google Pay, PhonePe'
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: '🏧',
      description: 'Direct transfer from your bank account'
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: '💰',
      description: 'Use saved wallet balance'
    },
    {
      id: 'cash_on_delivery',
      name: 'Pay at Service Center',
      icon: '💵',
      description: 'Pay cash when service is completed'
    }
  ];

  const handleCardChange = (field, value) => {
    // Format card number with spaces
    if (field === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      if (value.length > 19) value = value.slice(0, 19);
    }
    // Format expiry date
    if (field === 'expiryDate') {
      value = value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
      }
      if (value.length > 5) value = value.slice(0, 5);
    }
    // Format CVV
    if (field === 'cvv') {
      value = value.replace(/\D/g, '');
      if (value.length > 4) value = value.slice(0, 4);
    }

    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpiChange = (field, value) => {
    setUpiDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCashChange = (field, value) => {
    setCashDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCardDetails = () => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length < 13) {
      alert('Please enter a valid card number');
      return false;
    }
    if (!cardDetails.cardName) {
      alert('Please enter cardholder name');
      return false;
    }
    if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
      alert('Please enter expiry date in MM/YY format');
      return false;
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      alert('Please enter valid CVV');
      return false;
    }
    return true;
  };

  const validateUpiDetails = () => {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
    if (!cardDetails.cardName) {
      alert('Please enter your name');
      return false;
    }
    if (!upiDetails.upiId || !upiRegex.test(upiDetails.upiId)) {
      alert('Please enter a valid UPI ID (e.g., name@upi)');
      return false;
    }
    return true;
  };

  const validateCashDetails = () => {
    if (!cashDetails.fullName) {
      alert('Please enter your full name');
      return false;
    }
    if (!cashDetails.phone || cashDetails.phone.length < 10) {
      alert('Please enter a valid phone number');
      return false;
    }
    if (!cashDetails.address) {
      alert('Please enter your address');
      return false;
    }
    return true;
  };

  const handlePaymentSubmit = async () => {
    let isValid = false;

    // Validate based on payment method
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      isValid = validateCardDetails();
    } else if (paymentMethod === 'upi') {
      isValid = validateUpiDetails();
    } else if (paymentMethod === 'cash_on_delivery') {
      isValid = validateCashDetails();
    } else if (paymentMethod === 'netbanking' || paymentMethod === 'wallet') {
      isValid = cardDetails.cardName ? true : false;
      if (!isValid) alert('Please enter your name');
    }

    if (!isValid) return;

    setIsProcessing(true);

    if (paymentMethod === 'cash_on_delivery') {
      const paymentData = {
        bookingId,
        customerId: user?.id,
        customerName: user?.name || cardDetails.cardName || cashDetails.fullName,
        amount,
        method: paymentMethod,
        status: 'completed'
      };

      const result = await makePayment(paymentData);
      setIsProcessing(false);

      if (result.success) {
        setProcessedPayment(true);

        const completePaymentData = {
          ...result.data,
          method: paymentMethods.find((m) => m.id === paymentMethod)?.name || paymentMethod,
          serviceName,
          timestamp: new Date().toLocaleString(),
          transactionId: result.transactionId
        };

        setPaymentDetails(completePaymentData);
        setShowInvoice(true);

        if (onPaymentComplete) {
          onPaymentComplete(completePaymentData);
        }
      } else {
        alert(`Payment failed: ${result.error}`);
      }

      return;
    }

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay checkout script');
      }

      const createPaymentResult = await postPaymentRequest('/create-payment', {
        service_name: serviceName,
        email: user?.email || undefined,
        amount: Number(amount),
      });

      const orderData = createPaymentResult.data;

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: 'INR',
        name: MERCHANT_NAME,
        description: `${serviceName} | ${MERCHANT_NAME}`,
        order_id: orderData.order_id,
        prefill: {
          name: user?.name || cardDetails.cardName || cashDetails.fullName || '',
          email: user?.email || '',
          contact: cashDetails.phone || '',
        },
        handler: async (response) => {
          try {
            console.log('Payment successful from Razorpay:', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              bookingId: bookingId,
            });

            const verifyResult = await postPaymentRequest('/verify-payment', {
              service_name: serviceName,
              email: user?.email || undefined,
              amount: Number(amount),
              booking_id: bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            console.log('Payment verification successful:', verifyResult);

            const completePaymentData = {
              method: 'Razorpay',
              serviceName,
              amount,
              timestamp: new Date().toLocaleString(),
              transactionId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              invoiceNumber: verifyResult?.data?.invoice_number || '',
              paymentStatus: 'Paid',
            };

            setProcessedPayment(true);
            setPaymentDetails(completePaymentData);
            setShowInvoice(true);

            if (onPaymentComplete) {
              onPaymentComplete(completePaymentData);
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            alert(toPaymentErrorMessage(verifyError) || 'Payment verification failed');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        const msg = response?.error?.description || 'Payment failed';
        setIsProcessing(false);
        alert(msg);
      });
      razorpay.open();
    } catch (error) {
      setIsProcessing(false);
      alert(toPaymentErrorMessage(error));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay" onClick={onCancel}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="payment-modal-close" onClick={onCancel}>✕</button>

        {!processedPayment ? (
          <>
            {/* Header */}
            <div className="payment-header">
              <h2>Complete Payment</h2>
              <p className="payment-service-info">
                {serviceName} • <span className="payment-amount">₹{amount}</span>
              </p>
            </div>

            {/* Payment Methods */}
            <div className="payment-methods-section">
              <h3>Select Payment Method</h3>
              <div className="payment-methods-grid">
                {paymentMethods.map(method => (
                  <div
                    key={method.id}
                    className={`payment-method-card ${paymentMethod === method.id ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <div className="method-icon">{method.icon}</div>
                    <div className="method-name">{method.name}</div>
                    <div className="method-description">{method.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details Form */}
            <div className="payment-details-section">
              <h3>Payment Details</h3>

              {/* Credit/Debit Card */}
              {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                <div className="payment-form">
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number *</label>
                    <input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      value={cardDetails.cardNumber}
                      onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cardName">Cardholder Name *</label>
                    <input
                      id="cardName"
                      type="text"
                      placeholder="JOHN DOE"
                      value={cardDetails.cardName}
                      onChange={(e) => handleCardChange('cardName', e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryDate">Expiry Date *</label>
                      <input
                        id="expiryDate"
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiryDate}
                        onChange={(e) => handleCardChange('expiryDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cvv">CVV *</label>
                      <input
                        id="cvv"
                        type="text"
                        placeholder="123"
                        maxLength="4"
                        value={cardDetails.cvv}
                        onChange={(e) => handleCardChange('cvv', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="security-note">
                    🔒 Your card details are encrypted and secure
                  </div>
                </div>
              )}

              {/* UPI */}
              {paymentMethod === 'upi' && (
                <div className="payment-form">
                  <div className="form-group">
                    <label htmlFor="upiName">Your Name *</label>
                    <input
                      id="upiName"
                      type="text"
                      placeholder="Enter your name"
                      value={cardDetails.cardName}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, cardName: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="upiId">UPI ID *</label>
                    <input
                      id="upiId"
                      type="text"
                      placeholder="yourname@upi"
                      value={upiDetails.upiId}
                      onChange={(e) => handleUpiChange('upiId', e.target.value)}
                    />
                  </div>

                  <div className="upi-providers">
                    <p>Popular UPI Providers:</p>
                    <div className="providers-list">
                      <span className="provider-badge">Google Pay</span>
                      <span className="provider-badge">PhonePe</span>
                      <span className="provider-badge">PayTM</span>
                      <span className="provider-badge">Bhim</span>
                    </div>
                  </div>

                  <div className="security-note">
                    🔒 You'll be redirected to your UPI app to complete the payment
                  </div>
                </div>
              )}

              {/* Net Banking */}
              {paymentMethod === 'netbanking' && (
                <div className="payment-form">
                  <div className="form-group">
                    <label htmlFor="netbankName">Your Name *</label>
                    <input
                      id="netbankName"
                      type="text"
                      placeholder="Enter your name"
                      value={cardDetails.cardName}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, cardName: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bankSelect">Select Your Bank *</label>
                    <select id="bankSelect">
                      <option value="">Choose Bank</option>
                      <option value="sbi">State Bank of India (SBI)</option>
                      <option value="hdfc">HDFC Bank</option>
                      <option value="icici">ICICI Bank</option>
                      <option value="axis">Axis Bank</option>
                      <option value="pnb">Punjab National Bank</option>
                      <option value="kotak">Kotak Mahindra Bank</option>
                      <option value="boi">Bank of India</option>
                      <option value="union">Union Bank</option>
                    </select>
                  </div>

                  <div className="security-note">
                    🔒 You'll be redirected to your bank's secure login page
                  </div>
                </div>
              )}

              {/* Digital Wallet */}
              {paymentMethod === 'wallet' && (
                <div className="payment-form">
                  <div className="wallet-info">
                    <div className="wallet-balance">
                      <span className="balance-label">Available Wallet Balance:</span>
                      <span className="balance-amount">₹500.00</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="walletName">Your Name *</label>
                    <input
                      id="walletName"
                      type="text"
                      placeholder="Enter your name"
                      value={cardDetails.cardName}
                      onChange={(e) => setCardDetails(prev => ({ ...prev, cardName: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="walletAmount">Amount to Use *</label>
                    <input
                      id="walletAmount"
                      type="number"
                      placeholder={`Max: ₹${Math.min(amount, 500)}`}
                      max={Math.min(amount, 500)}
                      defaultValue={Math.min(amount, 500)}
                    />
                    {amount > 500 && (
                      <p className="form-hint">Remaining ₹{amount - 500} can be paid via card or UPI</p>
                    )}
                  </div>
                </div>
              )}

              {/* Cash on Delivery */}
              {paymentMethod === 'cash_on_delivery' && (
                <div className="payment-form">
                  <div className="form-group">
                    <label htmlFor="cashName">Full Name *</label>
                    <input
                      id="cashName"
                      type="text"
                      placeholder="Enter your full name"
                      value={cashDetails.fullName}
                      onChange={(e) => handleCashChange('fullName', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cashPhone">Contact Number *</label>
                    <input
                      id="cashPhone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={cashDetails.phone}
                      onChange={(e) => handleCashChange('phone', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cashAddress">Service Address *</label>
                    <textarea
                      id="cashAddress"
                      placeholder="Enter the service address where payment will be made"
                      rows="3"
                      value={cashDetails.address}
                      onChange={(e) => handleCashChange('address', e.target.value)}
                    ></textarea>
                  </div>

                  <div className="cash-info-box">
                    <h4>Payment Details:</h4>
                    <ul>
                      <li>✓ Our technician will collect ₹{amount} at service location</li>
                      <li>✓ Payment due before service completion</li>
                      <li>✓ Receipt will be provided</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="payment-summary">
              <div className="summary-row">
                <span>Service Charge:</span>
                <span>₹{amount}</span>
              </div>
              <div className="summary-row">
                <span>Tax & Fees:</span>
                <span>₹0</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>₹{amount}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="payment-actions">
              <button className="btn-cancel" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="btn-pay"
                onClick={handlePaymentSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? '⏳ Processing...' : `✓ Pay ₹${amount}`}
              </button>
            </div>
          </>
        ) : (
          <>
            {showInvoice ? (
              <InvoiceGenerator 
                paymentData={paymentDetails}
                bookingId={bookingId}
                onClose={onCancel}
                onSuccess={(billingRecord) => {
                  // Handle successful invoice generation
                  console.log('Billing record created:', billingRecord);
                }}
              />
            ) : (
              <>
                {/* Success Message */}
                <div className="payment-success">
                  <div className="success-icon">✅</div>
                  <h2>Payment Successful!</h2>
                  <p className="success-message">
                    Your payment of <strong>₹{amount}</strong> has been processed successfully.
                  </p>

                  <div className="success-details">
                    <div className="detail-item">
                      <span className="label">Service:</span>
                      <span className="value">{serviceName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Amount:</span>
                      <span className="value">₹{amount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Payment Method:</span>
                      <span className="value">
                        {paymentMethods.find(m => m.id === paymentMethod)?.name}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Transaction ID:</span>
                      <span className="value">TXN{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                    </div>
                  </div>

                  <p className="confirmation-text">
                    A confirmation email with receipt has been sent to your registered email address.
                  </p>

                  <button className="btn-done" onClick={onCancel}>
                    Done
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentGateway;
