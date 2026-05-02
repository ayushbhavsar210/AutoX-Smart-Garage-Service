import React, { useEffect, useMemo, useState } from 'react';
import { useBilling } from '../../context/BillingContext';
import { inventoryApi } from '../../utils/apiService';
import { createInvoicePdfFile, downloadInvoicePDF } from '../../utils/invoiceGenerator';
import { postPaymentRequest } from '../../utils/paymentRequest';
import CommonTable from '../../components/CommonTable';
import './ManageBilling.css';

const MERCHANT_NAME = 'AutoX Garage';

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

const GST_RATE_SERVICE = 18;
const GST_RATE_PARTS = 28;

const GST_RULES = [
  { label: 'Service / Labour Charge', rate: 18, keywords: ['service', 'labour', 'labor', 'washing', 'painting', 'denting'] },
  { label: 'Engine Oil / Lubricants', rate: 18, keywords: ['oil', 'lubricant', 'coolant', 'grease', 'fluid'] },
  { label: 'Electrical Parts', rate: 28, keywords: ['electrical', 'headlight', 'horn', 'battery'] },
  { label: 'Tyres / Tubes', rate: 28, keywords: ['tyre', 'tire', 'tube', 'wheel'] },
  { label: 'Brake Parts', rate: 28, keywords: ['brake'] },
  { label: 'Clutch Parts', rate: 28, keywords: ['clutch'] },
  { label: 'Filters', rate: 28, keywords: ['filter'] },
  { label: 'Body Parts', rate: 28, keywords: ['body', 'bumper', 'mirror', 'panel'] },
  { label: 'Accessories', rate: 28, keywords: ['accessor', 'seat cover', 'grip', 'visor'] },
  { label: 'Spare Parts', rate: 28, keywords: ['engine', 'transmission', 'suspension', 'exhaust', 'parts', 'part'] },
];

const resolveGstCategoryAndRate = ({ category = '', itemType = 'part', name = '' }) => {
  const haystack = `${String(category || '').toLowerCase()} ${String(name || '').toLowerCase()}`.trim();
  const matched = GST_RULES.find((rule) => rule.keywords.some((keyword) => haystack.includes(keyword)));
  if (matched) {
    return { gstCategory: matched.label, gstRate: matched.rate };
  }

  if (String(itemType || '').toLowerCase() === 'service') {
    return { gstCategory: 'Service / Labour Charge', gstRate: GST_RATE_SERVICE };
  }

  return { gstCategory: 'Spare Parts', gstRate: GST_RATE_PARTS };
};

const emptyLineItem = () => ({
  name: '',
  quantity: 1,
  price: 0,
  itemType: 'part',
  category: '',
  gstCategory: 'Spare Parts',
  gstRate: GST_RATE_PARTS,
});

const emptyForm = {
  customerType: 'registered',
  userId: '',
  customerDetails: { name: '', phone: '', email: '' },
  vehicleDetails: { number: '', model: '', company: '' },
  lineItems: [emptyLineItem()],
  serviceCharge: 0,
  discountPercent: 0,
  gst: 0,
  currency: 'INR',
  paymentMethod: 'cash',
  paymentStatus: 'pending',
  transactionId: '',
  status: 'issued',
};

function ManageBilling() {
  const {
    billingRecords,
    fetchAllBillingRecords,
    createBillingRecord,
    updateBillingRecord,
    fetchRegisteredCustomers,
    fetchRegisteredCustomerProfile,
    loading,
  } = useBilling();

  const [activeTab, setActiveTab] = useState('create');
  const [editingInvoice, setEditingInvoice] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [registeredCustomers, setRegisteredCustomers] = useState([]);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [inventoryParts, setInventoryParts] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [showPaymentCard, setShowPaymentCard] = useState(false);
  const [pendingBillingPayload, setPendingBillingPayload] = useState(null);
  const [paymentChoice, setPaymentChoice] = useState('cash');
  const [cashReference, setCashReference] = useState('');
  const [gatewayProcessing, setGatewayProcessing] = useState(false);

  const normalizeName = (value) => String(value || '').trim().toLowerCase();
  const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

  const inventoryPartLookup = useMemo(() => {
    const map = new Map();
    inventoryParts.forEach((part) => {
      const key = normalizeName(part.name);
      if (!key) return;
      map.set(key, part);
    });
    return map;
  }, [inventoryParts]);

  const getSuggestionsForRow = (query) => {
    const q = normalizeName(query);
    if (!q) return [];
    return inventoryParts
      .filter((part) => normalizeName(part.name).includes(q))
      .sort((a, b) => {
        const aName = normalizeName(a.name);
        const bName = normalizeName(b.name);
        const aStarts = aName.startsWith(q) ? 0 : 1;
        const bStarts = bName.startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return aName.localeCompare(bName);
      })
      .slice(0, 8);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await fetchAllBillingRecords();
      } catch (_error) {
        setRegisteredCustomers([]);
      }

      try {
        const customers = await fetchRegisteredCustomers();
        setRegisteredCustomers(customers);
      } catch (_error) {
        setRegisteredCustomers([]);
      }

      try {
        const inventoryRes = await inventoryApi.list();
        const parts = Array.isArray(inventoryRes?.data) ? inventoryRes.data : [];
        setInventoryParts(
          parts.map((part) => ({
            name: String(part.name || '').trim(),
            price: Number(part.sellingPrice || part.price || 0),
            category: String(part.category || '').trim(),
            ...resolveGstCategoryAndRate({
              category: String(part.category || '').trim(),
              itemType: 'part',
              name: String(part.name || '').trim(),
            }),
          }))
        );
      } catch (_error) {
        setInventoryParts([]);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const lineTotal = formData.lineItems.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      return sum + quantity * price;
    }, 0);

    const serviceCharge = Number(formData.serviceCharge || 0);
    const discountPercent = Math.min(100, Math.max(0, Number(formData.discountPercent || 0)));
    const lineItemsGst = formData.lineItems.reduce((sum, item) => {
      const lineAmount = Number(item.quantity || 0) * Number(item.price || 0);
      return sum + lineAmount * (Number(item.gstRate || 0) / 100);
    }, 0);
    const serviceChargeGst = serviceCharge * (GST_RATE_SERVICE / 100);

    const preDiscountTaxableAmount = lineTotal + serviceCharge;
    const discountAmount = round2(preDiscountTaxableAmount * (discountPercent / 100));
    const subtotal = Math.max(0, preDiscountTaxableAmount - discountAmount);
    const discountFactor = preDiscountTaxableAmount > 0
      ? Math.min(1, Math.max(0, subtotal / preDiscountTaxableAmount))
      : 1;
    const gst = round2((lineItemsGst + serviceChargeGst) * discountFactor);
    const finalTotal = round2(Math.max(0, subtotal + gst));

    return {
      lineTotal,
      serviceCharge,
      discountPercent,
      discountAmount,
      subtotal,
      gst,
      finalTotal,
    };
  }, [formData]);

  const billingColumns = useMemo(
    () => [
      { accessorKey: 'invoiceNumber', header: 'Invoice #', size: 140 },
      {
        accessorKey: 'customerDetails.name',
        header: 'Customer',
        cell: ({ row }) => row.original?.customerDetails?.name || '—',
      },
      {
        accessorKey: 'vehicleDetails.number',
        header: 'Vehicle Number',
        cell: ({ row }) => row.original?.vehicleDetails?.number || '—',
      },
      {
        accessorKey: 'customerType',
        header: 'Type',
        cell: ({ getValue }) => (getValue() === 'offline' ? 'Offline' : 'Registered'),
      },
      {
        accessorKey: 'finalTotal',
        header: 'Final Total',
        cell: ({ row }) => `₹${Number(row.original?.finalTotal || row.original?.totalAmount || 0).toFixed(2)}`,
      },
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('en-IN'),
      },
    ],
    []
  );

  const gstReference = useMemo(
    () => [
      'Service / Labour Charge - 18%',
      'Engine Oil / Lubricants - 18%',
      'Washing / Painting / Denting Service - 18%',
      'Spare Parts - 28%',
      'Electrical Parts - 28%',
      'Battery - 28%',
      'Tyres / Tubes - 28%',
      'Brake / Clutch Parts - 28%',
      'Filters / Body Parts / Accessories - 28%',
    ],
    []
  );

  const filteredBillings = useMemo(() => {
    return billingRecords.filter((record) => {
      const text = searchTerm.trim().toLowerCase();
      const customerName = String(record?.customerDetails?.name || '').toLowerCase();
      const vehicleNumber = String(record?.vehicleDetails?.number || '').toLowerCase();
      const matchesText =
        !text ||
        customerName.includes(text) ||
        vehicleNumber.includes(text) ||
        String(record?.invoiceNumber || '').toLowerCase().includes(text);

      if (!matchesText) return false;

      if (!searchDate) return true;
      const billDate = new Date(record?.createdAt || record?.paymentDate);
      const selectedDate = new Date(searchDate);
      return (
        billDate.getFullYear() === selectedDate.getFullYear() &&
        billDate.getMonth() === selectedDate.getMonth() &&
        billDate.getDate() === selectedDate.getDate()
      );
    });
  }, [billingRecords, searchDate, searchTerm]);

  const handleCustomerTypeChange = (customerType) => {
    setFormData((prev) => ({
      ...prev,
      customerType,
      userId: '',
      customerDetails: { name: '', phone: '', email: '' },
      vehicleDetails: { number: '', model: '', company: '' },
    }));
    setCustomerVehicles([]);
  };

  const handleRegisteredCustomerSelect = async (userId) => {
    if (!userId) return;
    const profile = await fetchRegisteredCustomerProfile(userId);
    if (!profile) return;

    setCustomerVehicles(profile.vehicles || []);
    setFormData((prev) => ({
      ...prev,
      userId: profile.userId || userId,
      customerDetails: profile.customerDetails || { name: '', phone: '', email: '' },
      vehicleDetails: profile.vehicleDetails || { number: '', model: '', company: '' },
    }));
  };

  const handleVehiclePick = (vehicleNumber) => {
    const found = customerVehicles.find((vehicle) => vehicle.number === vehicleNumber);
    if (!found) return;

    setFormData((prev) => ({
      ...prev,
      vehicleDetails: {
        number: found.number || '',
        model: found.model || '',
        company: found.company || '',
      },
    }));
  };

  const handleLineItemChange = (index, field, value) => {
    if (field === 'name') {
      const matchedPart = inventoryPartLookup.get(normalizeName(value));
      setFormData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.map((item, idx) => {
          if (idx !== index) return item;

          const fallbackMeta = resolveGstCategoryAndRate({
            category: item.category,
            itemType: item.itemType || 'part',
            name: value,
          });
          const partMeta = matchedPart
            ? {
                category: matchedPart.category,
                gstCategory: matchedPart.gstCategory,
                gstRate: matchedPart.gstRate,
              }
            : {
                category: item.category,
                gstCategory: fallbackMeta.gstCategory,
                gstRate: fallbackMeta.gstRate,
              };

          return {
            ...item,
            itemType: 'part',
            name: value,
            category: partMeta.category,
            gstCategory: partMeta.gstCategory,
            gstRate: Number(partMeta.gstRate || GST_RATE_PARTS),
            price: matchedPart ? Number(matchedPart.price || 0) : Number(item.price || 0),
          };
        }),
      }));
      return;
    }

    if (field === 'price') {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, idx) =>
        idx === index ? { ...item, [field]: field === 'name' || field === 'itemType' ? value : Number(value || 0) } : item
      ),
    }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({ ...prev, lineItems: [...prev.lineItems, emptyLineItem()] }));
  };

  const removeLineItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.length <= 1 ? prev.lineItems : prev.lineItems.filter((_, idx) => idx !== index),
    }));
  };

  const mapInvoiceToForm = (invoice) => ({
    _baseForDiscountPercent:
      (Array.isArray(invoice.lineItems)
        ? invoice.lineItems.reduce((sum, item) => sum + Number(item?.quantity || 0) * Number(item?.price || 0), 0)
        : 0) + Number(invoice.serviceCharge || 0),
    customerType: invoice.customerType || 'registered',
    userId: invoice.userId || '',
    customerDetails: {
      name: invoice.customerDetails?.name || '',
      phone: invoice.customerDetails?.phone || '',
      email: invoice.customerDetails?.email || '',
    },
    vehicleDetails: {
      number: invoice.vehicleDetails?.number || '',
      model: invoice.vehicleDetails?.model || '',
      company: invoice.vehicleDetails?.company || '',
    },
    lineItems: Array.isArray(invoice.lineItems) && invoice.lineItems.length
      ? invoice.lineItems.map((item) => ({
          name: item.name || '',
          quantity: Number(item.quantity || 1),
          price: Number(item.price || 0),
          itemType: item.itemType || 'part',
          category: item.category || '',
          gstCategory: item.gstCategory || resolveGstCategoryAndRate({ category: item.category, itemType: item.itemType, name: item.name }).gstCategory,
          gstRate: Number(item.gstRate || resolveGstCategoryAndRate({ category: item.category, itemType: item.itemType, name: item.name }).gstRate),
        }))
      : [emptyLineItem()],
    serviceCharge: Number(invoice.serviceCharge || 0),
    discountPercent: 0,
    gst: Number(invoice.gst || 0),
    currency: invoice.currency || 'INR',
    paymentMethod: invoice.paymentMethod || 'cash',
    paymentStatus: invoice.paymentStatus || invoice.status || 'pending',
    transactionId: invoice.transactionId || '',
    status: invoice.status || 'issued',
  });

  const toFormWithDiscountPercent = (invoice) => {
    const mapped = mapInvoiceToForm(invoice);
    const discountAmount = Number(invoice?.discount || 0);
    const baseForDiscountPercent = Number(mapped._baseForDiscountPercent || 0);
    const derivedDiscountPercent = Number(invoice?.discountPercent);
    const discountPercent = Number.isFinite(derivedDiscountPercent)
      ? Math.min(100, Math.max(0, derivedDiscountPercent))
      : (baseForDiscountPercent > 0
        ? Math.min(100, Math.max(0, (discountAmount / baseForDiscountPercent) * 100))
        : 0);

    return {
      ...mapped,
      discountPercent,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...formData,
      lineItems: formData.lineItems
        .filter((item) => item.name.trim())
        .map((item) => {
          const matchedPart = inventoryPartLookup.get(normalizeName(item.name));
          const gstMeta = matchedPart
            ? {
                gstCategory: matchedPart.gstCategory,
                gstRate: matchedPart.gstRate,
                category: matchedPart.category,
              }
            : resolveGstCategoryAndRate({ category: item.category, itemType: item.itemType, name: item.name });

          return {
            ...item,
            itemType: 'part',
            category: matchedPart?.category || item.category || '',
            gstCategory: gstMeta.gstCategory,
            gstRate: Number(gstMeta.gstRate || GST_RATE_PARTS),
            name: matchedPart?.name || item.name,
            price: matchedPart ? Number(matchedPart.price || 0) : Number(item.price || 0),
          };
        }),
      gst: totals.gst,
      discountPercent: totals.discountPercent,
      discount: totals.discountAmount,
      subtotal: totals.subtotal,
      finalTotal: totals.finalTotal,
    };

    if (!payload.lineItems.length) {
      alert('Please add at least one service or part item.');
      return;
    }

    const invalidItems = payload.lineItems.filter((item) => !inventoryPartLookup.has(normalizeName(item.name)));
    if (invalidItems.length > 0) {
      alert(`Please select valid inventory part(s): ${invalidItems.map((item) => item.name).join(', ')}`);
      return;
    }

    if (payload.customerType === 'registered' && !payload.userId) {
      alert('Please select a registered user.');
      return;
    }

    if (payload.customerType === 'offline' && (!payload.customerDetails.name || !payload.customerDetails.phone)) {
      alert('Please enter offline customer name and mobile number.');
      return;
    }

    if (payload.customerType === 'offline') {
      const email = String(payload.customerDetails?.email || '').trim();
      if (!email) {
        alert('Please enter walk-in customer email address.');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid walk-in customer email address.');
        return;
      }
    }

    if (!payload.vehicleDetails.number) {
      alert('Please enter/select vehicle number.');
      return;
    }

    setPendingBillingPayload(payload);
    setPaymentChoice('cash');
    setCashReference('');
    setShowPaymentCard(true);
  };

  const closePaymentCard = () => {
    if (gatewayProcessing) return;
    setShowPaymentCard(false);
    setPendingBillingPayload(null);
    setCashReference('');
    setPaymentChoice('cash');
  };

  const finalizeBillingSave = async ({ paymentMethod, transactionId = '' }) => {
    if (!pendingBillingPayload) return;

    const finalizedPayload = {
      ...pendingBillingPayload,
      paymentMethod,
      paymentStatus: 'paid',
      transactionId: String(transactionId || '').trim(),
      paymentDate: new Date().toISOString(),
    };

    try {
      if (editingInvoice) {
        await updateBillingRecord(editingInvoice, finalizedPayload);
        alert('Payment done and bill updated successfully.');
      } else {
        await createBillingRecord(finalizedPayload);
        alert('Payment done and bill created successfully.');
      }

      setEditingInvoice('');
      setFormData(emptyForm);
      setCustomerVehicles([]);
      await fetchAllBillingRecords();
      setActiveTab('records');
      setShowPaymentCard(false);
      setPendingBillingPayload(null);
      setCashReference('');
      setPaymentChoice('cash');
    } catch (error) {
      alert(error.message || 'Unable to save bill.');
    }
  };

  const handleConfirmCashPayment = async () => {
    await finalizeBillingSave({
      paymentMethod: 'cash',
      transactionId: cashReference,
    });
  };

  const handleConfirmRazorpayPayment = async () => {
    if (!pendingBillingPayload) return;

    try {
      setGatewayProcessing(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay checkout script');
      }

      const amount = Number(pendingBillingPayload.finalTotal || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Invalid bill amount for Razorpay payment');
      }

      const serviceName =
        pendingBillingPayload.lineItems
          ?.map((item) => item?.name)
          .filter(Boolean)
          .join(', ') || 'Billing Payment';

      const customerName = pendingBillingPayload.customerDetails?.name || 'Customer';
      const customerEmail = pendingBillingPayload.customerDetails?.email || undefined;
      const customerPhone = pendingBillingPayload.customerDetails?.phone || '';

      const createPaymentResult = await postPaymentRequest('/create-payment', {
        service_name: serviceName,
        email: customerEmail,
        amount,
      });

      const orderData = createPaymentResult?.data || {};

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: 'INR',
        name: MERCHANT_NAME,
        description: `Invoice Payment | ${MERCHANT_NAME}`,
        order_id: orderData.order_id,
        prefill: {
          name: customerName,
          email: customerEmail || '',
          contact: customerPhone,
        },
        handler: async (response) => {
          try {
            await postPaymentRequest('/verify-payment', {
              service_name: serviceName,
              email: customerEmail,
              amount,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            await finalizeBillingSave({
              paymentMethod: 'razorpay',
              transactionId: response.razorpay_payment_id,
            });
          } catch (verificationError) {
            alert(verificationError.message || 'Payment verification failed');
          } finally {
            setGatewayProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setGatewayProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        const errorMessage = response?.error?.description || 'Payment failed';
        setGatewayProcessing(false);
        alert(errorMessage);
      });
      razorpay.open();
    } catch (error) {
      setGatewayProcessing(false);
      alert(error.message || 'Unable to start Razorpay payment');
    }
  };

  const handleEditBill = async (record) => {
    setEditingInvoice(record.invoiceNumber);
    setFormData(toFormWithDiscountPercent(record));

    if (record.customerType === 'registered' && record.userId) {
      const profile = await fetchRegisteredCustomerProfile(record.userId);
      setCustomerVehicles(profile?.vehicles || []);
    } else {
      setCustomerVehicles([]);
    }

    setActiveTab('create');
  };

  const handleDownloadInvoice = (record) => {
    downloadInvoicePDF(record, {
      name: record?.customerDetails?.name || 'Customer',
      email: record?.customerDetails?.email || 'N/A',
      phone: record?.customerDetails?.phone || 'N/A',
      address: 'N/A',
      vehicleNumber: record?.vehicleDetails?.number || 'N/A',
      vehicleModel: record?.vehicleDetails?.model || 'N/A',
      vehicleCompany: record?.vehicleDetails?.company || 'N/A',
    });
  };

  const handleShareInvoice = async (record) => {
    const invoiceNumber = record?.invoiceNumber || 'N/A';
    const customerName = record?.customerDetails?.name || 'Customer';
    const vehicleNumber = record?.vehicleDetails?.number || 'N/A';
    const totalAmount = Number(record?.finalTotal || record?.totalAmount || 0).toFixed(2);
    const invoiceDate = record?.createdAt
      ? new Date(record.createdAt).toLocaleDateString('en-IN')
      : 'N/A';

    const shareText = [
      `Invoice: ${invoiceNumber}`,
      `Customer: ${customerName}`,
      `Vehicle: ${vehicleNumber}`,
      `Amount: INR ${totalAmount}`,
      `Date: ${invoiceDate}`,
    ].join('\n');

    const customerPayload = {
      name: record?.customerDetails?.name || 'Customer',
      email: record?.customerDetails?.email || 'N/A',
      phone: record?.customerDetails?.phone || 'N/A',
      address: 'N/A',
      vehicleNumber: record?.vehicleDetails?.number || 'N/A',
      vehicleModel: record?.vehicleDetails?.model || 'N/A',
      vehicleCompany: record?.vehicleDetails?.company || 'N/A',
    };

    try {
      const pdfFile = createInvoicePdfFile(record, customerPayload);

      if (
        pdfFile &&
        navigator.share &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        await navigator.share({
          title: `Invoice ${invoiceNumber}`,
          text: shareText,
          files: [pdfFile],
        });
        return;
      }

      downloadInvoicePDF(record, customerPayload);

      const waText = [
        `Invoice ${invoiceNumber} PDF is ready.`,
        'Please attach the downloaded PDF in this chat.',
        '',
        shareText,
      ].join('\n');

      const waWindow = window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');

      if (!waWindow && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(waText);
      }

      alert('Your browser cannot directly attach PDF to WhatsApp. PDF has been downloaded, please attach that file in WhatsApp.');
      return;
    } catch (error) {
      if (error?.name !== 'AbortError') {
        alert('Unable to share invoice right now.');
      }
    }
  };

  return (
    <div className="manage-billing">
      <div className="billing-page-header">
        <h1>Billing Management</h1>
        <p>Create, edit, view, search, and download professional invoices.</p>
      </div>

      <div className="billing-tabs">
        <button className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
          Create New Bill
        </button>
        <button className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>
          Billing Records
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'create' && (
          <form className="billing-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Select Customer Type</label>
                <select
                  className="billing-select customer-type-select"
                  value={formData.customerType}
                  onChange={(e) => handleCustomerTypeChange(e.target.value)}
                >
                  <option value="registered">Registered User</option>
                  <option value="offline">Offline Customer (Walk-in)</option>
                </select>
              </div>

              {formData.customerType === 'registered' ? (
                <>
                  <div className="form-group">
                    <label>Registered User</label>
                    <select
                      className="billing-select registered-user-select"
                      value={formData.userId}
                      onChange={(e) => handleRegisteredCustomerSelect(e.target.value)}
                    >
                      <option value="">Select customer</option>
                      {registeredCustomers.map((user) => (
                        <option key={user.id} value={user.userId || user.id}>
                          {user.name} {user.phone ? `(${user.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Customer Name</label>
                    <input type="text" value={formData.customerDetails.name} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input type="text" value={formData.customerDetails.phone} readOnly />
                  </div>

                  <div className="form-group">
                    <label>Vehicle Number</label>
                    <select
                      className="billing-select vehicle-number-select"
                      value={formData.vehicleDetails.number}
                      onChange={(e) => handleVehiclePick(e.target.value)}
                    >
                      <option value="">Select vehicle</option>
                      {customerVehicles.map((vehicle) => (
                        <option key={`${vehicle.number}-${vehicle.id || ''}`} value={vehicle.number}>
                          {vehicle.number}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Vehicle Model</label>
                    <input type="text" value={formData.vehicleDetails.model} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Company</label>
                    <input type="text" value={formData.vehicleDetails.company} readOnly />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Customer Name</label>
                    <input
                      type="text"
                      value={formData.customerDetails.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerDetails: { ...prev.customerDetails, name: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input
                      type="text"
                      value={formData.customerDetails.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerDetails: { ...prev.customerDetails, phone: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={formData.customerDetails.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          customerDetails: { ...prev.customerDetails, email: e.target.value.trim() },
                        }))
                      }
                      placeholder="walkin.customer@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Number</label>
                    <input
                      type="text"
                      value={formData.vehicleDetails.number}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vehicleDetails: { ...prev.vehicleDetails, number: e.target.value.toUpperCase() },
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Model</label>
                    <input
                      type="text"
                      value={formData.vehicleDetails.model}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vehicleDetails: { ...prev.vehicleDetails, model: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Company</label>
                    <input
                      type="text"
                      value={formData.vehicleDetails.company}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vehicleDetails: { ...prev.vehicleDetails, company: e.target.value },
                        }))
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <h3 className="section-title">Service & Parts Details</h3>
            <div className="line-items-table">
              <div className="line-items-header">
                <span>Service/Part Name</span>
                <span>Quantity</span>
                <span>Price</span>
                <span>Total</span>
                <span>Action</span>
              </div>
              {formData.lineItems.map((item, index) => (
                <div key={`line-item-${index}`} className="line-item-row">
                  <div className="line-item-name-cell">
                    <input
                      type="text"
                      value={item.name}
                      placeholder="Type part name (inventory only)"
                      onChange={(e) => {
                        handleLineItemChange(index, 'name', e.target.value);
                        setActiveSuggestionIndex(index);
                      }}
                      onFocus={() => setActiveSuggestionIndex(index)}
                      onBlur={() => {
                        setTimeout(() => {
                          setActiveSuggestionIndex((prev) => (prev === index ? -1 : prev));
                        }, 120);
                      }}
                      autoComplete="off"
                    />
                    {activeSuggestionIndex === index && getSuggestionsForRow(item.name).length > 0 ? (
                      <div className="part-suggestion-box">
                        {getSuggestionsForRow(item.name).map((suggestion) => (
                          <button
                            key={`${index}-${suggestion.name}`}
                            type="button"
                            className="part-suggestion-item"
                            onMouseDown={(event) => {
                              // Keep focus transition from cancelling selection.
                              event.preventDefault();
                              handleLineItemChange(index, 'name', suggestion.name);
                              setActiveSuggestionIndex(-1);
                            }}
                          >
                            <span className="part-suggestion-name">{suggestion.name}</span>
                            <span className="part-suggestion-price">
                              ₹{Number(suggestion.price || 0).toLocaleString('en-IN')} | GST {Number(suggestion.gstRate || 0)}%
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.price}
                    readOnly
                  />
                  <input type="text" value={`₹${(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}`} readOnly />
                  <button type="button" className="btn-danger" onClick={() => removeLineItem(index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="btn-secondary" onClick={addLineItem}>
                + Add Row
              </button>
            </div>

            <h3 className="section-title">Additional Billing Fields</h3>
            <div className="gst-reference-box">
              <strong>GST Auto Rules (Locked)</strong>
              <p>GST amount is calculated automatically by part/service category and cannot be edited manually.</p>
              <div className="gst-reference-list">
                {gstReference.map((entry) => (
                  <span key={entry} className="gst-chip">{entry}</span>
                ))}
              </div>
            </div>
            <div className="form-grid compact-grid">
              <div className="form-group">
                <label>Service Charge</label>
                <input
                  type="number"
                  min="0"
                  value={formData.serviceCharge}
                  onChange={(e) => setFormData((prev) => ({ ...prev, serviceCharge: Number(e.target.value || 0) }))}
                />
              </div>
              <div className="form-group">
                <label>Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData((prev) => ({ ...prev, discountPercent: Number(e.target.value || 0) }))}
                />
              </div>
              <div className="form-group">
                <label>GST (Auto by Category - Locked)</label>
                <input
                  type="text"
                  value={`₹${totals.gst.toFixed(2)}`}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Final Total</label>
                <input type="text" value={`₹${totals.finalTotal.toFixed(2)}`} readOnly />
              </div>
            </div>

            <p className="payment-step-note">
              Click <strong>Proceed to Payment</strong> to choose Cash or Razorpay. Bill will be generated only after successful payment.
            </p>

            <div className="summary-box">
              <div><span>Line Items:</span><strong>₹{totals.lineTotal.toFixed(2)}</strong></div>
              <div><span>Service Charge:</span><strong>₹{totals.serviceCharge.toFixed(2)}</strong></div>
              <div><span>Discount ({totals.discountPercent.toFixed(2)}%):</span><strong>- ₹{totals.discountAmount.toFixed(2)}</strong></div>
              <div><span>Subtotal:</span><strong>₹{totals.subtotal.toFixed(2)}</strong></div>
              <div><span>GST (Auto):</span><strong>₹{totals.gst.toFixed(2)}</strong></div>
              <div><span>Final Total:</span><strong>₹{totals.finalTotal.toFixed(2)}</strong></div>
            </div>

            <div className="form-actions">
              {editingInvoice ? (
                <button type="button" className="btn-secondary" onClick={() => {
                  setEditingInvoice('');
                  setFormData(emptyForm);
                  setCustomerVehicles([]);
                }}>
                  Cancel Edit
                </button>
              ) : null}
              <button type="submit" className="btn-primary">
                {editingInvoice ? 'Update Bill & Proceed to Payment' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'records' && (
          <>
            <div className="billing-filters-section">
              <div className="filter-box">
                <label>Search (Customer / Vehicle / Invoice)</label>
                <input
                  type="text"
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-box">
                <label>Date</label>
                <input
                  type="date"
                  className="search-date-input"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="loading-state"><p>Loading billing records...</p></div>
            ) : (
              <>
                <div className="table-wrapper">
                  <CommonTable data={filteredBillings} columns={billingColumns} />
                </div>
                <div className="billing-actions-grid">
                  {filteredBillings.map((record) => (
                    <div key={record.invoiceNumber} className="action-row">
                      <span className="invoice-ref">{record.invoiceNumber}</span>
                      <div className="action-buttons">
                        <button className="btn-action btn-view" onClick={() => setSelectedInvoice(record)}>View</button>
                        <button className="btn-action btn-edit" onClick={() => handleEditBill(record)}>Edit</button>
                        <button className="btn-action btn-download" onClick={() => handleDownloadInvoice(record)}>PDF</button>
                        <button className="btn-action btn-share" onClick={() => handleShareInvoice(record)}>Share</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showPaymentCard && (
        <div className="modal-overlay" onClick={closePaymentCard}>
          <div className="modal-content payment-card-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={closePaymentCard} disabled={gatewayProcessing}>✕</button>
            <h3>Choose Payment Method</h3>
            <p className="payment-card-subtitle">Complete payment to generate the bill.</p>

            <div className="payment-card-amount-row">
              <span>Total Payable</span>
              <strong>₹{Number(pendingBillingPayload?.finalTotal || 0).toFixed(2)}</strong>
            </div>

            <div className="payment-choice-grid">
              <button
                type="button"
                className={`payment-choice-btn ${paymentChoice === 'cash' ? 'active' : ''}`}
                onClick={() => setPaymentChoice('cash')}
                disabled={gatewayProcessing}
              >
                Cash
              </button>
              <button
                type="button"
                className={`payment-choice-btn ${paymentChoice === 'razorpay' ? 'active' : ''}`}
                onClick={() => setPaymentChoice('razorpay')}
                disabled={gatewayProcessing}
              >
                Razorpay
              </button>
            </div>

            {paymentChoice === 'cash' ? (
              <div className="payment-card-section">
                <label>Cash Receipt Reference (Optional)</label>
                <input
                  type="text"
                  value={cashReference}
                  onChange={(e) => setCashReference(e.target.value)}
                  placeholder="Receipt no."
                  disabled={gatewayProcessing}
                />
                <button
                  type="button"
                  className="btn-primary payment-card-confirm-btn"
                  onClick={handleConfirmCashPayment}
                  disabled={gatewayProcessing}
                >
                  {gatewayProcessing ? 'Processing...' : 'Confirm Cash & Generate Bill'}
                </button>
              </div>
            ) : (
              <div className="payment-card-section">
                <p className="payment-card-helper">Razorpay checkout will open in a secure payment window.</p>
                <button
                  type="button"
                  className="btn-primary payment-card-confirm-btn"
                  onClick={handleConfirmRazorpayPayment}
                  disabled={gatewayProcessing}
                >
                  {gatewayProcessing ? 'Opening Gateway...' : 'Pay with Razorpay'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedInvoice(null)}>✕</button>
            <h3>Invoice {selectedInvoice.invoiceNumber}</h3>
            <p>
              <strong>Customer:</strong> {selectedInvoice.customerDetails?.name || '—'}<br />
              <strong>Mobile:</strong> {selectedInvoice.customerDetails?.phone || '—'}<br />
              <strong>Vehicle:</strong> {selectedInvoice.vehicleDetails?.number || '—'} ({selectedInvoice.vehicleDetails?.company || '—'} {selectedInvoice.vehicleDetails?.model || ''})
            </p>
            <div className="mini-table">
              {(selectedInvoice.lineItems || []).map((item, index) => (
                <div key={`${item.name}-${index}`} className="mini-row">
                  <span>{item.name}</span>
                  <span>{item.quantity} × ₹{item.price}</span>
                  <strong>₹{item.total}</strong>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => handleDownloadInvoice(selectedInvoice)}>Download PDF</button>
              <button className="btn-primary" onClick={() => handleShareInvoice(selectedInvoice)}>Share Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageBilling;
