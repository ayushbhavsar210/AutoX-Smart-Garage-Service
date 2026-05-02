import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { modificationsApi, vehiclesApi } from '../utils/apiService';
import "./Mods.css";

function ModsQuote({ embedded = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const preselectedCategory = location.state?.category || "";

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle: "",
    registration: "",
    category: preselectedCategory,
    mods: [],
    budget: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [decisionState, setDecisionState] = useState({ loading: false, submitted: false, decision: '' });
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('new');
  const [myRequests, setMyRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const getVehicleIdentifier = (vehicle) =>
    String(vehicle?.id || vehicle?._id || vehicle?.vehicleId || vehicle?.vehicle_id || vehicle?.plate || vehicle?.vehicle_number || '');

  const normalizeVehiclesFromResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.vehicles)) return response.vehicles;
    if (Array.isArray(response?.data?.vehicles)) return response.data.vehicles;
    return [];
  };

  const normalizeRequestsFromResponse = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.requests)) return response.requests;
    return [];
  };

  const featuredParts = [
    {
      name: "Body Kit",
      price: "From Rs 22,000",
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=70",
      blurb: "Aggressive exterior styling with premium finish.",
    },
    {
      name: "Custom Paint",
      price: "From Rs 16,000",
      image: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=1200&q=70",
      blurb: "Unique color themes with long-lasting protection.",
    },
    {
      name: "Alloy Wheels",
      price: "From Rs 18,000",
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=70",
      blurb: "Sporty look with better road grip.",
    },
    {
      name: "LED Lights",
      price: "From Rs 6,500",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=70",
      blurb: "Sharper visibility and premium styling.",
    },
    {
      name: "Window Tinting",
      price: "From Rs 5,500",
      image: "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=70",
      blurb: "Heat reduction and classy privacy finish.",
    },
    {
      name: "Engine Tuning",
      price: "From Rs 12,000",
      image: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=70",
      blurb: "Optimized power delivery and smoother response.",
    },
    {
      name: "Turbo Kit",
      price: "From Rs 48,000",
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=70",
      blurb: "Performance boost for high-output driving.",
    },
    {
      name: "Exhaust System",
      price: "From Rs 14,000",
      image: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=70",
      blurb: "Performance tone with airflow improvement.",
    },
    {
      name: "Air Intake",
      price: "From Rs 7,500",
      image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=70",
      blurb: "Better breathing for improved acceleration.",
    },
    {
      name: "Suspension",
      price: "From Rs 19,000",
      image: "https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&w=1200&q=70",
      blurb: "Balanced comfort and cornering control.",
    },
    {
      name: "Sound System",
      price: "From Rs 11,500",
      image: "https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=70",
      blurb: "Rich cabin audio with crisp output.",
    },
    {
      name: "Subwoofer",
      price: "From Rs 8,000",
      image: "https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?auto=format&fit=crop&w=1200&q=70",
      blurb: "Deep bass response for premium music feel.",
    },
    {
      name: "Amplifier",
      price: "From Rs 6,800",
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=1200&q=70",
      blurb: "Clearer and louder audio without distortion.",
    },
    {
      name: "Android Head Unit",
      price: "From Rs 9,500",
      image: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1200&q=70",
      blurb: "Smart infotainment, maps, and connectivity.",
    },
    {
      name: "Dash Cam",
      price: "From Rs 4,800",
      image: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=70",
      blurb: "Reliable driving evidence and safer trips.",
    },
    {
      name: "Parking Sensors",
      price: "From Rs 4,000",
      image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=70",
      blurb: "Safer reverse and tighter parking confidence.",
    },
    {
      name: "Reverse Camera",
      price: "From Rs 5,200",
      image: "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1200&q=70",
      blurb: "Wide-angle rear visibility for safe maneuvering.",
    },
    {
      name: "Seat Covers",
      price: "From Rs 3,900",
      image: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1200&q=70",
      blurb: "Comfort upgrade with durable interior finish.",
    },
    {
      name: "Floor Mats",
      price: "From Rs 2,500",
      image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=70",
      blurb: "Cabin protection with easy-clean premium mats.",
    },
    {
      name: "Sunroof",
      price: "From Rs 28,000",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=70",
      blurb: "Upgrade cabin feel with open-sky comfort.",
    },
  ];

  const budgets = [
    { value: "<25000", label: "Below ₹25,000" },
    { value: "25000-75000", label: "₹25,000 - ₹75,000" },
    { value: "75000-150000", label: "₹75,000 - ₹1,50,000" },
    { value: ">150000", label: "Above ₹1,50,000" },
  ];

  const categoryPartMap = {
    aesthetic: new Set(["Body Kit", "Custom Paint", "Alloy Wheels", "LED Lights", "Window Tinting", "Sunroof"]),
    performance: new Set(["Engine Tuning", "Turbo Kit", "Exhaust System", "Air Intake", "Suspension"]),
    audio: new Set(["Sound System", "Subwoofer", "Amplifier", "Android Head Unit"]),
    safety: new Set(["Dash Cam", "Parking Sensors", "Reverse Camera", "Seat Covers", "Floor Mats"]),
  };

  const getCategoryKey = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized.includes('aesthetic')) return 'aesthetic';
    if (normalized.includes('performance')) return 'performance';
    if (normalized.includes('audio') || normalized.includes('entertainment')) return 'audio';
    if (normalized.includes('safety') || normalized.includes('comfort')) return 'safety';
    return '';
  };

  const selectedCategoryKey = getCategoryKey(form.category);
  const visibleParts = featuredParts.filter((part) => {
    return selectedCategoryKey ? categoryPartMap[selectedCategoryKey]?.has(part.name) : true;
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || user?.fullName || user?.name || '',
      phone: prev.phone || user?.phone || '',
      email: prev.email || user?.email || '',
    }));
  }, [user?.fullName, user?.name, user?.phone, user?.email]);

  useEffect(() => {
    const visiblePartNames = new Set(visibleParts.map((part) => part.name));
    setForm((prev) => ({
      ...prev,
      mods: prev.mods.filter((mod) => visiblePartNames.has(mod)),
    }));
  }, [selectedCategoryKey]);

  useEffect(() => {
    let active = true;

    const loadSavedVehicles = async () => {
      const userParams = {
        userId: user?.userId || user?.id || '',
        userObjectId: user?._id || '',
        email: user?.email || '',
        customerName: user?.name || user?.fullName || '',
        mobile: user?.phone || user?.mobile || '',
      };

      try {
        const firstResponse = await vehiclesApi.listMine(userParams);
        let vehicles = normalizeVehiclesFromResponse(firstResponse);

        if (!vehicles.length) {
          const fallbackResponse = await vehiclesApi.listMine();
          vehicles = normalizeVehiclesFromResponse(fallbackResponse);
        }

        if (!vehicles.length) {
          const allResponse = await vehiclesApi.listAll();
          const allVehicles = normalizeVehiclesFromResponse(allResponse);
          const normalizedEmail = String(user?.email || '').trim().toLowerCase();
          const normalizedPhone = String(user?.phone || user?.mobile || '').trim();
          const normalizedName = String(user?.name || user?.fullName || '').trim().toLowerCase();
          const userIds = [user?.userId, user?.id, user?._id].map((value) => String(value || '').trim()).filter(Boolean);

          vehicles = allVehicles.filter((vehicle) => {
            const vehicleEmail = String(vehicle?.email || '').trim().toLowerCase();
            const vehiclePhone = String(vehicle?.mobile || vehicle?.phone || '').trim();
            const vehicleName = String(vehicle?.customer_name || vehicle?.customerName || '').trim().toLowerCase();
            const vehicleUserIds = [vehicle?.user_id, vehicle?.userId, vehicle?.userid, vehicle?.userObjectId]
              .map((value) => String(value || '').trim())
              .filter(Boolean);

            const idMatch = userIds.length > 0 && vehicleUserIds.some((id) => userIds.includes(id));
            const emailMatch = normalizedEmail && vehicleEmail === normalizedEmail;
            const phoneMatch = normalizedPhone && vehiclePhone === normalizedPhone;
            const nameMatch = normalizedName && vehicleName === normalizedName;

            return idMatch || emailMatch || phoneMatch || nameMatch;
          });
        }

        if (active) {
          const deduped = Array.from(
            new Map(
              vehicles.map((vehicle) => [
                getVehicleIdentifier(vehicle) || String(vehicle?.vehicle_number || vehicle?.plate || Math.random()),
                vehicle,
              ])
            ).values()
          );
          setSavedVehicles(deduped);
        }
      } catch (_error) {
        if (active) {
          setSavedVehicles([]);
        }
      }
    };

    loadSavedVehicles();

    return () => {
      active = false;
    };
  }, [user?.id, user?.userId, user?._id, user?.email, user?.name, user?.fullName, user?.phone, user?.mobile]);

  const loadMyRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await modificationsApi.listMine({
        userId: user?.userId || user?.id || '',
        userObjectId: user?._id || '',
        email: user?.email || '',
        customerName: user?.name || user?.fullName || '',
        mobile: user?.phone || user?.mobile || '',
      });
      setMyRequests(normalizeRequestsFromResponse(response));
    } catch (_error) {
      setMyRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    loadMyRequests();
  }, [user?.id, user?.userId, user?._id, user?.email, user?.name, user?.fullName, user?.phone, user?.mobile]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onVehicleSelect = (value) => {
    setSelectedVehicleId(value);

    if (value === 'new') {
      return;
    }

    const selected = savedVehicles.find((vehicle) => getVehicleIdentifier(vehicle) === String(value));
    if (!selected) return;

    const vehicleCompany = selected.vehicle_company || selected.vehicleCompany || selected.make || '';
    const vehicleModel = selected.vehicle_model || selected.vehicleModel || selected.model || '';
    const vehicleNumber = selected.vehicle_number || selected.vehicleNumber || selected.plate || '';

    setForm((prev) => ({
      ...prev,
      name: prev.name || selected.customer_name || user?.name || user?.fullName || '',
      phone: prev.phone || selected.mobile || user?.phone || '',
      email: prev.email || selected.email || user?.email || '',
      vehicle: `${vehicleCompany} ${vehicleModel}`.trim() || prev.vehicle,
      registration: vehicleNumber || prev.registration,
    }));
  };

  const onToggleMod = (mod) => {
    setForm((prev) => {
      const present = prev.mods.includes(mod);
      return { ...prev, mods: present ? prev.mods.filter((m) => m !== mod) : [...prev.mods, mod] };
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await modificationsApi.create({
        customer: form.name,
        vehicle: form.vehicle,
        modType: form.category || (form.mods.length > 0 ? form.mods[0] : '—'),
        description: form.mods.length > 0 ? form.mods.join(', ') : form.notes || '—',
        estimatedCost: form.budget || '—',
        phone: form.phone,
        status: 'Quote Requested',
        progress: 0,
        budget: form.budget,
        mods: form.mods,
        category: form.category,
        registration: form.registration,
        email: form.email,
        userId: user?.userId || user?.id || '',
        userObjectId: user?._id || '',
        status: 'Quote Requested',
      });

      const created = response?.data || response || null;
      setCreatedRequest(created);
      await loadMyRequests();
    } catch (err) {
      console.error('Error submitting modification quote:', err);
    }
    
    // Add notification for quote request
    addNotification({
      type: 'booking',
      title: 'Quote Request Submitted',
      message: `Your modification quote for ${form.vehicle} has been submitted successfully`,
      icon: '🎨',
    });
    
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 1800);
  };

  const handleRequestDecision = async (requestId, decision) => {
    try {
      if (decision === 'book') {
        const wantPickupDrop = window.confirm('Pickup & Drop service joiye? OK = Yes, Cancel = No');
        await modificationsApi.setDecision(requestId, {
          decision: 'book',
          pickupDropRequired: wantPickupDrop,
        });

        if (wantPickupDrop) {
          const pickupAddress = window.prompt('Pickup address enter karo:', form.registration || '');
          const pickupDate = window.prompt('Pickup date (YYYY-MM-DD):', '');
          const pickupSlot = window.prompt('Pickup slot (e.g. 10:00 AM - 12:00 PM):', '');
          const dropAddress = window.prompt('Drop address enter karo:', pickupAddress || '');

          await modificationsApi.updatePickupDrop(requestId, {
            required: true,
            pickupAddress: pickupAddress || '',
            pickupDate: pickupDate || '',
            pickupSlot: pickupSlot || '',
            dropAddress: dropAddress || '',
          });
        } else {
          await modificationsApi.updatePickupDrop(requestId, { required: false });
        }
      } else {
        await modificationsApi.setDecision(requestId, { decision: 'not_now' });
      }

      await loadMyRequests();
    } catch (err) {
      console.error('Error saving request decision:', err);
    }
  };

  const handleDecision = async (decision) => {
    try {
      setDecisionState({ loading: true, submitted: false, decision: '' });

      if (createdRequest?.id) {
        await modificationsApi.setDecision(createdRequest.id, { decision });
      }

      if (decision === 'book') {
        addNotification({
          type: 'service',
          title: 'Modification Booking Confirmed',
          message: `Great! We have marked your request for ${form.vehicle} as ready to book after quote approval.`,
          icon: '✅',
        });
      } else {
        addNotification({
          type: 'service',
          title: 'Quote Saved',
          message: `No worries. Your quote request for ${form.vehicle} is saved. You can book later anytime.`,
          icon: '📝',
        });
      }

      setDecisionState({ loading: false, submitted: true, decision });
    } catch (err) {
      console.error('Error saving modification decision:', err);
      setDecisionState({ loading: false, submitted: true, decision });
    }
  };

  if (submitted) {
    return (
      <div className={`mods-container ${embedded ? 'embedded' : ''}`}>
        <div className="payment-section">
          <div className="payment-header">
            <h2>Quote Request Sent ✓</h2>
            <p>Would you like to continue and book this modification after quote confirmation?</p>
          </div>

          <div className="quote-summary">
            <h3>Request Summary</h3>
            <div className="summary-item">
              <span>Vehicle:</span>
              <strong>{form.vehicle}</strong>
            </div>
            <div className="summary-item">
              <span>Selected Modifications:</span>
              <strong>{form.mods.length > 0 ? form.mods.join(', ') : 'Not specified'}</strong>
            </div>
            <div className="summary-item">
              <span>Budget Range:</span>
              <strong>{form.budget}</strong>
            </div>
            {createdRequest?.id && (
              <div className="summary-item">
                <span>Request ID:</span>
                <strong>#{createdRequest.id}</strong>
              </div>
            )}
          </div>

          <div className="payment-actions">
            <button
              className="btn-primary"
              disabled={decisionState.loading || decisionState.submitted}
              onClick={() => handleDecision('book')}
            >
              Yes, Book It
            </button>
            <button
              className="btn-secondary"
              disabled={decisionState.loading || decisionState.submitted}
              onClick={() => handleDecision('not_now')}
            >
              No, Not Now
            </button>
          </div>

          {decisionState.submitted && (
            <div className="payment-info">
              {decisionState.decision === 'book' ? (
                <p><strong>Confirmed:</strong> Booking intent saved. Team will contact you with final quote and schedule.</p>
              ) : (
                <p><strong>Saved:</strong> Quote request is active. You can decide to book later.</p>
              )}
            </div>
          )}

          {!embedded && (
            <div className="payment-actions" style={{ marginTop: 12 }}>
              <button className="btn-secondary" onClick={() => navigate('/')}>Back to Home</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`mods-container ${embedded ? 'embedded' : ''}`}>
      {embedded && (
        <div className="mods-hero" style={{ marginBottom: 14 }}>
          <h1 style={{ color: '#0f172a', textShadow: 'none', fontSize: '30px' }}>Modification Quote Assistant</h1>
          <p style={{ color: '#475569' }}>Request quote first, then confirm if you want to book it.</p>
        </div>
      )}
      {!embedded && (
        <div className="mods-hero">
          <h1>Get a Custom Quote</h1>
          <p>Tell us your vehicle details and desired upgrades. We’ll send a tailored estimate.</p>
        </div>
      )}

      <form className="mods-form" onSubmit={onSubmit}>
        <div className="form-group">
          <label>Select Registered Vehicle</label>
          <select value={selectedVehicleId} onChange={(e) => onVehicleSelect(e.target.value)}>
            <option value="new">Add details manually</option>
            {savedVehicles.map((vehicle) => (
              <option key={getVehicleIdentifier(vehicle)} value={getVehicleIdentifier(vehicle)}>
                {(vehicle.vehicle_number || vehicle.plate || '—')} - {(vehicle.vehicle_company || vehicle.make || '')} {(vehicle.vehicle_model || vehicle.model || '')}
              </option>
            ))}
          </select>
          {savedVehicles.length === 0 && (
            <small style={{ color: '#64748b' }}>No registered vehicle found. Please enter details manually.</small>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Name *</label>
            <input name="name" value={form.name} onChange={onChange} required placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label>Phone *</label>
            <input name="phone" type="tel" value={form.phone} onChange={onChange} required placeholder="9XXXXXXXXX" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@email.com" />
          </div>
          <div className="form-group">
            <label>Registration No.</label>
            <input name="registration" value={form.registration} onChange={onChange} placeholder="GJ-01-AB-1234" />
          </div>
        </div>

        <div className="form-group">
          <label>Vehicle *</label>
          <input name="vehicle" value={form.vehicle} onChange={onChange} required placeholder="e.g., 2021 Hyundai i20 N Line" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={form.category} onChange={onChange}>
              <option value="">Select category (optional)</option>
              <option>🎨 Aesthetic Mods</option>
              <option>⚡ Performance Upgrades</option>
              <option>🔊 Audio & Entertainment</option>
              <option>🛡️ Safety & Comfort</option>
            </select>
          </div>
          <div className="form-group">
            <label>Budget (optional)</label>
            <select name="budget" value={form.budget} onChange={onChange}>
              <option value="">Select budget</option>
              {budgets.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="parts-showcase">
          <div className="parts-head">
            <h3>Popular Parts and Upgrades</h3>
            <p>
              {selectedCategoryKey
                ? 'Showing parts based on selected category.'
                : 'Tap a card to quickly add/remove that part in your quote.'}
            </p>
          </div>
          <div className="parts-grid">
            {visibleParts.map((part) => {
              const selected = form.mods.includes(part.name);
              return (
                <button
                  type="button"
                  key={part.name}
                  className={`part-card ${selected ? 'selected' : ''}`}
                  onClick={() => onToggleMod(part.name)}
                >
                  <div className="part-image-wrap">
                    <img src={part.image} alt={part.name} className="part-image" loading="lazy" />
                  </div>
                  <div className="part-body">
                    <div className="part-title-row">
                      <h4>{part.name}</h4>
                      <span className="part-price">{part.price}</span>
                    </div>
                    <p>{part.blurb}</p>
                    <span className="part-cta">{selected ? 'Selected' : 'Add to Quote'}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedCategoryKey && visibleParts.length === 0 && (
            <p style={{ marginTop: 10, color: '#64748b' }}>
              No parts found for selected category.
            </p>
          )}
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea name="notes" rows="4" value={form.notes} onChange={onChange} placeholder="Any specific goals or references?" />
        </div>

        <div className="actions-row">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary">Request Quote</button>
        </div>
      </form>

      <div className="mods-form" style={{ marginTop: 18 }}>
        <div className="parts-head" style={{ marginBottom: 12 }}>
          <h3>My Modification Requests</h3>
          <p>Admin taraf thi exact quote aavse. Tame ahi thi confirm kari shako cho.</p>
        </div>

        {requestsLoading ? (
          <p style={{ color: '#64748b' }}>Loading requests...</p>
        ) : myRequests.length === 0 ? (
          <p style={{ color: '#64748b' }}>Koi request nathi madi.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {myRequests.slice(0, 8).map((req) => {
              const isQuoted = String(req?.status || '').toLowerCase().includes('quoted');
              const decision = String(req?.userDecision?.decision || req?.bookingDecision || 'pending');
              const price = req?.quote?.exactPrice || req?.estimatedCost || '—';

              return (
                <div key={req.id || req._id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <strong>{req.vehicle || 'Vehicle'} • {req.modType || 'Modification'}</strong>
                    <span style={{ color: '#475569' }}>Status: {req.status || 'Quote Requested'}</span>
                  </div>
                  <div style={{ marginTop: 6, color: '#334155' }}>
                    Exact Price: <strong>{price}</strong>
                  </div>
                  {req?.quote?.notes && (
                    <div style={{ marginTop: 4, color: '#475569' }}>Admin Note: {req.quote.notes}</div>
                  )}

                  {isQuoted && decision === 'pending' && (
                    <div className="actions-row" style={{ marginTop: 10 }}>
                      <button type="button" className="btn-primary" onClick={() => handleRequestDecision(req.id, 'book')}>
                        Confirm & Continue
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => handleRequestDecision(req.id, 'not_now')}>
                        Not Now
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ModsQuote;
