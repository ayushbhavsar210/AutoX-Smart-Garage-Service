import React, { useState } from 'react';
import { postPaymentRequest } from '../utils/paymentRequest';

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

function ServicePayment() {
  const [serviceName, setServiceName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePayment = async () => {
    try {
      setMessage('');

      if (!serviceName.trim() || Number(amount) <= 0) {
        setMessage('Enter valid service name and amount.');
        return;
      }

      setLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay checkout script');
      }

      const createPaymentResult = await postPaymentRequest('/create-payment', {
        service_name: serviceName.trim(),
        amount: Number(amount),
      });

      const orderData = createPaymentResult.data;

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: 'INR',
        name: MERCHANT_NAME,
        description: `${serviceName.trim()} | ${MERCHANT_NAME}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            await postPaymentRequest('/verify-payment', {
              service_name: serviceName.trim(),
              amount: Number(amount),
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setMessage('Payment successful and verified.');
          } catch (verifyError) {
            setMessage(verifyError.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        const errorMessage = response?.error?.description || 'Payment failed';
        setMessage(errorMessage);
      });
      razorpay.open();
    } catch (error) {
      setMessage(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Service Payment</h2>
      <div>
        <label htmlFor="serviceName">Service Name</label>
        <input
          id="serviceName"
          type="text"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          placeholder="e.g. Booking Fee"
        />
      </div>

      <div>
        <label htmlFor="amount">Amount (INR)</label>
        <input
          id="amount"
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 499"
        />
      </div>

      <button type="button" onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>

      {message ? <p>{message}</p> : null}
    </div>
  );
}

export default ServicePayment;