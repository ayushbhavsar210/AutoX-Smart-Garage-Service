import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBilling } from '../context/BillingContext';
import CommonTable from './CommonTable.jsx';
import PaymentGateway from './PaymentGateway';
import CustomerBillingHistory from './CustomerBillingHistory';
import BookingWizard from './BookingWizard';
import BreakdownCall from './BreakdownCall';
import ModsQuote from './ModsQuote';
import { servicesApi, packagesApi, bookingApi, authApi, uploadApi, customerApi, analyticsApi, mechanicsApi, reviewsApi } from '../utils/apiService';
import './CustomerDashboard.css';

function CustomerDashboard() {
    const assetPath = (path) => encodeURI(path);
  const toSafeDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const toSafeTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { fetchMyBillingRecords } = useBilling();

  const normalizePaymentStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();
    if (value === 'paid' || value === 'completed' || value === 'success' || value === 'successful') {
      return 'completed';
    }
    if (value === 'failed' || value === 'failure') {
      return 'failed';
    }
    return 'pending';
  };
  
  // Booking table columns - defined before conditional rendering
  const bookingColumns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'service', header: 'Service' },
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'time', header: 'Time' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'mechanic', header: 'Mechanic' },
  ], []);

  const historyColumns = useMemo(() => [
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'service', header: 'Service' },
    { accessorKey: 'mechanic', header: 'Mechanic' },
    { accessorKey: 'amount', header: 'Amount' },
    { accessorKey: 'status', header: 'Status' },
  ], []);
  
  const [activeTab, setActiveTab] = useState(() => location.state?.activeTab || 'overview');
  const [preselectedServiceId, setPreselectedServiceId] = useState(() => location.state?.preselectedServiceId || null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('details'); // 'details' or 'renew'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingModalType, setBookingModalType] = useState('reschedule'); // 'reschedule' or 'cancel'
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [activeBrowseService, setActiveBrowseService] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Profile states
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileName, setProfileName] = useState(
    user?.fullName || user?.name || user?.email?.split('@')[0] || 'User'
  );
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    phone: '',
    city: '',
    address: '',
    vehicle: '',
    registration: ''
  });
  
  const [savedProfileData, setSavedProfileData] = useState({
    phone: '',
    city: '',
    address: '',
    vehicle: '',
    registration: ''
  });

  // API-driven state
  const [allServices, setAllServices] = useState([]);
  const [servicePackages, setServicePackages] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [memberSince, setMemberSince] = useState('');
  const [userRating, setUserRating] = useState('—');
  const [loadingData, setLoadingData] = useState(true);
  const [apiErrors, setApiErrors] = useState({});
  const [recentPaymentSuccess, setRecentPaymentSuccess] = useState(null);
  const [ratingInsights, setRatingInsights] = useState({
    adminSources: [],
    averageRating: 0,
    totalRatedItems: 0,
  });
  const [reviewableBookings, setReviewableBookings] = useState([]);
  const [selectedReviewBookingId, setSelectedReviewBookingId] = useState('');
  const [pendingRating, setPendingRating] = useState(0);
  const [pendingComment, setPendingComment] = useState('');
  const [ratingSubmitState, setRatingSubmitState] = useState({ loading: false, message: '', type: '' });

  // Load data from APIs
  const loadDashboardData = useCallback(async () => {
    let ratingSources = [];
    let weightedRatingSum = 0;
    let weightedRatingCount = 0;

    const addRatingSource = (source) => {
      if (!source || source.total <= 0) return;
      ratingSources.push(source);
      weightedRatingSum += Number(source.average || 0) * Number(source.total || 0);
      weightedRatingCount += Number(source.total || 0);
    };

    try {
      setLoadingData(true);
      setApiErrors({});
      
      // Debug: Log user info
      console.log('🔍 Loading dashboard data for user:', user);

      const svcRes = await servicesApi.list();
      const svcList = svcRes?.data || svcRes || [];
      // Preserve local images/icons as fallback
      const defaultImages = [
        assetPath('/img/web-images/regular-services/pexels-19x14-8478233.jpg'),
        assetPath('/img/web-images/breakdown/pexels-edurawpro-21831855.jpg'),
        assetPath('/img/web-images/modification/pexels-bylukemiller-32725702.jpg'),
        assetPath('/img/web-images/regular-services/pexels-tami-19499386.jpg'),
        assetPath('/img/web-images/breakdown/pexels-a-q-91521018-18863497.jpg'),
        assetPath('/img/web-images/regular-services/pexels-artempodrez-8986139.jpg'),
        assetPath('/img/web-images/breakdown/pexels-jonathan-reynaga-861774-17429096.jpg'),
        assetPath('/img/web-images/breakdown/pexels-mikebirdy-943930.jpg'),
      ];
      setAllServices(svcList.map((s, i) => ({
        active: s.active !== false,
        id: s._id || s.id || i + 1,
        title: s.title || s.name || 'Service',
        icon: s.icon || '🚗',
        description: s.description || '',
        features: s.features || [],
        image: s.image || defaultImages[i % defaultImages.length],
      })).filter((s) => s.active));
    } catch (error) {
      console.error('❌ Services API error:', error);
      setApiErrors(prev => ({ ...prev, services: error.message }));
    }

    try {
      const pkgRes = await packagesApi.listAll('status=active');
      const pkgs = pkgRes?.data || pkgRes || [];
      const colors = ['#0EA5E9', '#F59E0B', '#DC2626'];
      setServicePackages(pkgs.map((p, i) => ({
        ...p,
        id: p._id || p.id || p.packageId || i,
        packageId: p.packageId || p._id,
        color: p.color || colors[i % colors.length],
        services: p.services || p.features || [],
        servicesUsed: p.servicesUsed || 0,
        totalServices: p.totalServices || p.features?.length || 0,
        nextDue: p.duration || '—',
        status: (p.status || 'active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
        validity: p.duration || p.validity || '—',
        originalPrice: p.originalPrice || p.price,
      })));
    } catch (error) {
      console.warn('⚠️ Packages API (optional):', error.message);
    }

    try {
      console.log('📊 Fetching bookings...');

      const getBookingsPromise = customerApi.bookings().catch((primaryBookingsError) => {
        console.warn('⚠️ /customer/bookings failed, trying /api/bookings/me:', primaryBookingsError?.message || primaryBookingsError);
        return bookingApi.listMine();
      });

      const getHistoryPromise = customerApi.serviceHistory().catch((primaryHistoryError) => {
        console.warn('⚠️ /customer/service-history failed, trying /api/bookings/history/me:', primaryHistoryError?.message || primaryHistoryError);
        return bookingApi.listHistory();
      });

      const [bookingsResult, historyResult] = await Promise.allSettled([getBookingsPromise, getHistoryPromise]);

      const bookingsRes = bookingsResult.status === 'fulfilled' ? bookingsResult.value : null;
      const historyRes = historyResult.status === 'fulfilled' ? historyResult.value : null;

      if (bookingsResult.status === 'rejected') {
        console.error('❌ Bookings endpoint failed:', bookingsResult.reason);
      }
      if (historyResult.status === 'rejected') {
        console.error('❌ Service history endpoint failed:', historyResult.reason);
      }

      console.log('📋 Bookings API response:', bookingsRes);
      console.log('📋 Service History API response:', historyRes);

      const allBookings = Array.isArray(bookingsRes?.data)
        ? bookingsRes.data
        : Array.isArray(bookingsRes)
          ? bookingsRes
          : [];

      const historyBookings = Array.isArray(historyRes?.data)
        ? historyRes.data
        : Array.isArray(historyRes)
          ? historyRes
          : [];

      console.log('✅ Parsed bookings:', { allBookings, historyBookings });

      const historyRatings = historyBookings
        .filter((item) => Number(item?.rating) > 0)
        .map((item) => ({
          id: item._id || item.id,
          label: item.serviceName || item.service || 'Service',
          rating: Number(item.rating),
          meta: item.date || toSafeDate(item.scheduledAt),
        }));

      if (historyRatings.length > 0) {
        const avgHistoryRating = historyRatings.reduce((sum, item) => sum + item.rating, 0) / historyRatings.length;
        addRatingSource({
          id: 'service-history-ratings',
          title: 'Rated Services',
          subtitle: 'Ratings found in your completed service history',
          average: Number(avgHistoryRating.toFixed(1)),
          total: historyRatings.length,
          type: 'list',
          items: historyRatings.slice(0, 8),
        });
      }

      // Set completed bookings as service history
      setServiceHistory(historyBookings.map(b => ({
        id: b._id || b.id,
        date: b.date || toSafeDate(b.scheduledAt),
        service: b.serviceName || b.service || '',
        amount: b.amount ? `₹${b.amount}` : '—',
        status: b.status || 'completed',
        mechanic: b.mechanicName || b.mechanic || '—',
      })));

      // Show all bookings for user so completed records are still visible in My Bookings tab.
      setUpcomingBookings(allBookings.map(b => ({
        id: b._id || b.id,
        service: b.serviceName || b.service || '',
        date: b.date || toSafeDate(b.scheduledAt),
        time: b.time || toSafeTime(b.scheduledAt),
        status: b.status || 'Confirmed',
        mechanic: b.mechanicName || b.mechanic || '—',
      })));

      console.log('✅ Bookings and history data set successfully');
      setApiErrors(prev => ({
        ...prev,
        bookings: bookingsResult.status === 'rejected' ? (bookingsResult.reason?.message || 'Failed to load bookings') : undefined,
        history: historyResult.status === 'rejected' ? (historyResult.reason?.message || 'Failed to load history') : undefined,
      }));
    } catch (error) {
      console.error('❌ Bookings API error:', error);
      console.error('Error message:', error?.message);
      console.error('Error response:', error?.response);
      setApiErrors(prev => ({ ...prev, bookings: error?.message || 'Failed to load bookings', history: error?.message || 'Failed to load history' }));
      // Set empty arrays on error so UI shows "No data found"
      setServiceHistory([]);
      setUpcomingBookings([]);
    }

    try {
      const satRes = await analyticsApi.customerSatisfaction();
      const sat = satRes?.data || satRes || {};
      const totalReviews = Number(sat.totalReviews || 0);
      const average = Number(sat.avgRating || sat.averageRating || 0);
      const distribution = Array.isArray(sat.ratings)
        ? sat.ratings
        : Object.entries(sat.ratingDistribution || {}).map(([star, count]) => ({
            rating: `${star} Star`,
            count,
          }));

      if (totalReviews > 0 || distribution.length > 0) {
        addRatingSource({
          id: 'customer-satisfaction',
          title: 'Customer Satisfaction',
          subtitle: 'Live review analytics used in Admin dashboard',
          average: Number(average.toFixed(1)),
          total: Math.max(totalReviews, distribution.reduce((sum, item) => sum + Number(item?.count || 0), 0)),
          type: 'distribution',
          items: distribution,
        });
      }
    } catch (error) {
      console.warn('⚠️ Customer satisfaction API (optional):', error?.message || error);
    }

    try {
      const mechanicsRes = await mechanicsApi.list();
      const mechanics = Array.isArray(mechanicsRes?.data)
        ? mechanicsRes.data
        : Array.isArray(mechanicsRes)
        ? mechanicsRes
        : [];

      const mechanicRatings = mechanics
        .filter((m) => Number(m?.rating) > 0)
        .map((m) => ({
          id: m._id || m.id,
          label: m.name || 'Mechanic',
          rating: Number(m.rating),
          meta: m.expertise || m.status || 'AutoX mechanic',
        }))
        .sort((a, b) => b.rating - a.rating);

      if (mechanicRatings.length > 0) {
        const avgMechanicRating = mechanicRatings.reduce((sum, item) => sum + item.rating, 0) / mechanicRatings.length;
        addRatingSource({
          id: 'mechanic-ratings',
          title: 'Mechanic Ratings',
          subtitle: 'Dynamic ratings currently configured in Admin → Mechanics',
          average: Number(avgMechanicRating.toFixed(1)),
          total: mechanicRatings.length,
          type: 'list',
          items: mechanicRatings.slice(0, 8),
        });
      }
    } catch (error) {
      console.warn('⚠️ Mechanics API (optional):', error?.message || error);
    }

    try {
      const reviewableRes = await reviewsApi.listReviewable();
      const reviewables = Array.isArray(reviewableRes?.data)
        ? reviewableRes.data
        : Array.isArray(reviewableRes)
        ? reviewableRes
        : [];

      setReviewableBookings(reviewables);

      const submittedRatings = reviewables
        .filter((item) => Number(item?.existingRating) > 0)
        .map((item) => ({
          id: item.bookingId,
          label: item.serviceName || `Booking #${item.bookingId}`,
          rating: Number(item.existingRating),
          meta: `${item.mechanicName || 'N/A'} • ${item.date || ''}`,
        }));

      if (submittedRatings.length > 0) {
        const avgSubmitted = submittedRatings.reduce((sum, item) => sum + item.rating, 0) / submittedRatings.length;
        addRatingSource({
          id: 'my-submitted-ratings',
          title: 'My Submitted Ratings',
          subtitle: 'Ratings you have provided for completed services',
          average: Number(avgSubmitted.toFixed(1)),
          total: submittedRatings.length,
          type: 'list',
          items: submittedRatings.slice(0, 8),
        });
        setUserRating(Number(avgSubmitted.toFixed(1)));
      } else {
        setUserRating('—');
      }

      if (reviewables.length > 0) {
        setSelectedReviewBookingId((prev) => {
          if (prev) return prev;
          const firstPending = reviewables.find((item) => Number(item?.existingRating || 0) === 0) || reviewables[0];
          setPendingRating(Number(firstPending.existingRating || 0));
          setPendingComment(firstPending.existingComment || '');
          return String(firstPending.bookingId);
        });
      }
    } catch (error) {
      console.warn('⚠️ Reviewable ratings API (optional):', error?.message || error);
      setReviewableBookings([]);
    }

    try {
      const billingRecords = await fetchMyBillingRecords();
      const successfulRecords = (Array.isArray(billingRecords) ? billingRecords : []).filter(
        (record) => normalizePaymentStatus(record.paymentStatus) === 'completed'
      );

      if (successfulRecords.length > 0) {
        const latest = [...successfulRecords].sort((a, b) => {
          const aTime = new Date(a.paymentDate || a.createdAt || 0).getTime();
          const bTime = new Date(b.paymentDate || b.createdAt || 0).getTime();
          return bTime - aTime;
        })[0];
        setRecentPaymentSuccess(latest);
      } else {
        setRecentPaymentSuccess(null);
      }
    } catch (error) {
      console.warn('⚠️ Billing API (optional):', error?.message || error);
      setRecentPaymentSuccess(null);
    }

    try {
      const meRes = await authApi.me();
      const profile = meRes?.data || meRes;
      if (profile) {
        if (profile.fullName || profile.name) setProfileName(profile.fullName || profile.name);
        if (profile.profilePhotoUrl || profile.profilePhoto) setProfilePhoto(profile.profilePhotoUrl || profile.profilePhoto);
        if (profile.rating) setUserRating(profile.rating);
        const created = profile.createdAt || profile.joinDate;
        if (created) setMemberSince(`Member since ${new Date(created).getFullYear()}`);
        const pd = {
          phone: profile.phone || '',
          city: profile.city || '',
          address: profile.address || '',
          vehicle: profile.vehicle || '',
          registration: profile.registration || '',
        };
        setProfileData(pd);
        setSavedProfileData(pd);
      }
    } catch (error) {
      console.error('❌ Profile API error:', error);
      setApiErrors(prev => ({ ...prev, profile: error.message }));
    }

    setRatingInsights({
      adminSources: ratingSources,
      averageRating: weightedRatingCount > 0 ? Number((weightedRatingSum / weightedRatingCount).toFixed(1)) : 0,
      totalRatedItems: weightedRatingCount,
    });
    
    setLoadingData(false);
  }, [user, fetchMyBillingRecords]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  useEffect(() => {
    // Load dashboard data on mount and when activeTab changes
    if (activeTab === 'bookings' || activeTab === 'history' || activeTab === 'overview' || activeTab === 'billing' || activeTab === 'ratings') {
      loadDashboardData();
    }
  }, [activeTab, loadDashboardData]);

  useEffect(() => {
    const nextTab = location.state?.activeTab;
    const nextServiceId = location.state?.preselectedServiceId;

    if (nextTab) {
      setActiveTab(nextTab);
    }
    if (nextServiceId) {
      setPreselectedServiceId(nextServiceId);
    }

    if (nextTab || nextServiceId) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  // Also load key data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('🚀 Component mounted, loading initial data...');
      setLoadingData(true);
      try {
        // Pre-fetch bookings so they're visible immediately
        console.log('📥 Pre-fetching bookings data...');
        await Promise.all([
          customerApi.bookings()
            .catch(() => bookingApi.listMine())
            .then(res => {
              const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
              console.log('✓ Bookings pre-loaded:', data.length, 'records');
            })
            .catch(e => console.warn('⚠️ Pre-fetch bookings error:', e.message)),
          customerApi.serviceHistory()
            .catch(() => bookingApi.listHistory())
            .then(res => {
              const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
              console.log('✓ Service history pre-loaded:', data.length, 'records');
            })
            .catch(e => console.warn('⚠️ Pre-fetch history error:', e.message)),
        ]);
      } catch (e) {
        console.error('⚠️ Initial data load error:', e.message);
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [user]);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'browse-services', label: 'Browse Services', icon: '🛠' },
    { id: 'packages', label: 'Packages', icon: '📦' },
    { id: 'history', label: 'Service History', icon: '✓' },
    { id: 'bookings', label: 'My Bookings', icon: '📅' },
    { id: 'new-booking', label: 'New Booking', icon: '🔧' },
    { id: 'breakdown', label: 'Breakdown', icon: '🆘' },
    { id: 'modification', label: 'Modification', icon: '⚙️' },
    { id: 'billing', label: 'Billing', icon: '🧾' },
    { id: 'ratings', label: 'Ratings', icon: '⭐' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setProfilePhoto(reader.result);
        try {
          await uploadApi.profilePhoto({
            imageBase64: reader.result,
            fileName: file.name,
            mimeType: file.type,
          });
        } catch { /* upload failed – photo still shown locally */ }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameSave = () => {
    if (profileName.trim()) {
      setIsEditingName(false);
      alert('Profile name updated successfully!');
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      await authApi.updateProfile({ ...profileData, name: profileName });
      setSavedProfileData(profileData);
      alert('All changes saved successfully! ✓');
    } catch {
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleDiscardChanges = () => {
    setProfileData(savedProfileData);
    alert('All changes discarded.');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const selectedReviewBooking = reviewableBookings.find(
    (item) => String(item.bookingId) === String(selectedReviewBookingId)
  );

  const handleReviewSelection = (bookingId) => {
    setSelectedReviewBookingId(String(bookingId));
    const selected = reviewableBookings.find((item) => String(item.bookingId) === String(bookingId));
    setPendingRating(Number(selected?.existingRating || 0));
    setPendingComment(selected?.existingComment || '');
    setRatingSubmitState({ loading: false, message: '', type: '' });
  };

  const handleSubmitRating = async () => {
    if (!selectedReviewBookingId) {
      setRatingSubmitState({ loading: false, message: 'Please select a completed booking first.', type: 'error' });
      return;
    }

    if (!pendingRating || pendingRating < 1 || pendingRating > 5) {
      setRatingSubmitState({ loading: false, message: 'Please choose a star rating between 1 and 5.', type: 'error' });
      return;
    }

    try {
      setRatingSubmitState({ loading: true, message: '', type: '' });
      const response = await reviewsApi.submit({
        bookingId: Number(selectedReviewBookingId),
        rating: Number(pendingRating),
        comment: pendingComment.trim(),
      });

      setRatingSubmitState({
        loading: false,
        message: response?.message || 'Rating submitted successfully.',
        type: 'success',
      });

      await loadDashboardData();
    } catch (error) {
      setRatingSubmitState({
        loading: false,
        message: error?.message || 'Failed to submit rating. Please try again.',
        type: 'error',
      });
    }
  };

  return (
    <div className="customer-dashboard">
      {/* Sidebar Navigation */}
      <nav className={`customer-nav ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="customer-nav-header">
          <div className="customer-nav-title-wrap">
            <h2>{isSidebarCollapsed ? 'AX' : 'AutoX'}</h2>
            {!isSidebarCollapsed && <p>Customer Portal</p>}
          </div>
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="split-view-icon" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        <ul className="customer-nav-menu">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="customer-nav-footer">
          <div className="user-info">
            <div className="user-avatar">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="sidebar-profile-image" />
              ) : (
                '👤'
              )}
            </div>
            <div className="user-details">
              <p className="user-name">{profileName}</p>
              <p className="user-email">{user.email}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="customer-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="content-section">
            <div className="section-header">
              <h1>Welcome Back, {profileName}</h1>
              <p>Here's your service summary</p>
            </div>

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h3>{servicePackages.length}</h3>
                  <p>Active Packages</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✓</div>
                <div className="stat-info">
                  <h3>{serviceHistory.length}</h3>
                  <p>Services Completed</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>{upcomingBookings.length}</h3>
                  <p>Upcoming Bookings</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <h3>{userRating}</h3>
                  <p>Your Rating</p>
                </div>
              </div>
            </div>

            {recentPaymentSuccess && (
              <div className="content-card overview-payment-success-card">
                <div className="overview-payment-success-head">
                  <h2>Recent Payment Success</h2>
                  <span className="overview-payment-success-pill">PAID</span>
                </div>
                <p className="overview-payment-success-note">
                  This booking payment was successful.
                </p>
                <div className="overview-payment-success-grid">
                  <div>
                    <span className="label">Service Name</span>
                    <span className="value">{recentPaymentSuccess.serviceName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="label">Transaction ID</span>
                    <span className="value">{recentPaymentSuccess.transactionId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="label">Invoice Number</span>
                    <span className="value">{recentPaymentSuccess.invoiceNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="label">Amount Paid</span>
                    <span className="value">₹{recentPaymentSuccess.totalAmount || recentPaymentSuccess.amount || 0}</span>
                  </div>
                </div>
                <div className="overview-payment-success-actions">
                  <button className="overview-view-btn" onClick={() => setActiveTab('billing')}>
                    Open Billing & Invoice →
                  </button>
                </div>
              </div>
            )}

            {/* Active Packages */}
            <div className="content-card">
              <h2>Available Packages</h2>
              <div className="packages-grid-overview">
                {servicePackages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#6B7280' }}>
                    <p>No packages available right now.</p>
                  </div>
                )}
                {servicePackages.map(pkg => (
                  <div key={pkg.id} className="overview-package-card" style={{ borderLeftColor: pkg.color }}>
                    <div className="overview-package-icon" style={{ background: `${pkg.color}15` }}>
                      <span>{pkg.icon}</span>
                    </div>
                    <div className="overview-package-content">
                      <h3>{pkg.name}</h3>
                      <div className="overview-package-price">{pkg.price}</div>
                      <div className="overview-package-meta">
                        <span className="meta-item">
                          <span className="meta-icon">📅</span>
                          {pkg.nextDue}
                        </span>
                        <span className="meta-item">
                          <span className="meta-icon">✓</span>
                          {pkg.servicesUsed}/{pkg.totalServices} Used
                        </span>
                      </div>
                      <button 
                        className="overview-view-btn" 
                        style={{ background: `linear-gradient(135deg, ${pkg.color} 0%, ${pkg.color}dd 100%)` }}
                        onClick={() => setActiveTab('packages')}
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Services */}
            <div className="content-card">
              <h2>Recent Services</h2>
              <div className="history-list">
                {serviceHistory.slice(0, 3).map(item => (
                  <div key={item.id} className="history-item">
                    <div className="history-info">
                      <h4>{item.service}</h4>
                      <p>{item.date} • By {item.mechanic}</p>
                    </div>
                    <div className="history-amount">{item.amount}</div>
                    <span className="status-badge">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Browse Services Tab */}
        {activeTab === 'browse-services' && (
          <div className="content-section">
            <div className="section-header">
              <h1>Browse All Services</h1>
              <p>Explore our comprehensive range of automotive services</p>
            </div>

            <div className="content-card">
              <div className="services-grid dash">
                {allServices.map((service) => (
                  <div
                    key={service.id}
                    className={`service-card ${activeBrowseService === service.id ? 'active' : ''}`}
                    onClick={() => setActiveBrowseService(activeBrowseService === service.id ? null : service.id)}
                  >
                    <div className="service-image">
                      <img src={service.image} alt={service.title} />
                      <div className="service-overlay"></div>
                    </div>
                    <div className="service-content">
                      <h3>{service.title}</h3>
                      <p className="service-description">{service.description}</p>
                      
                      {activeBrowseService === service.id && (
                        <div className="service-features">
                          <h4>What's Included:</h4>
                          <ul>
                            {service.features.map((feature, index) => (
                              <li key={index}>
                                <span className="check-icon">✓</span> {feature}
                              </li>
                            ))}
                          </ul>
                          <div className="service-actions">
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreselectedServiceId(service.id);
                                setActiveTab('new-booking');
                              }}
                            >
                              Book Now
                            </button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/service/${service.id}`);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {activeBrowseService !== service.id && (
                        <button
                          className="btn-expand"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/service/${service.id}`);
                          }}
                        >
                          View Details →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="content-section">
            <div className="section-header">
              <h1>Packages</h1>
              <p>Explore the latest service packages managed by admin</p>
            </div>

            <div className="packages-container">
              {servicePackages.length === 0 && (
                <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
                  <h3 style={{ marginBottom: '8px', color: '#374151' }}>No Packages Available</h3>
                  <p style={{ color: '#6B7280', marginBottom: '24px' }}>Admin has not published any active package yet.</p>
                  <button
                    className="btn-primary"
                    style={{ padding: '12px 32px', fontSize: '16px', borderRadius: '12px', cursor: 'pointer' }}
                    onClick={() => navigate('/view-packages')}
                  >
                    🛒 Browse Packages
                  </button>
                </div>
              )}
              {servicePackages.map(pkg => (
                <div key={pkg.id} className="premium-package-card" style={{ borderTopColor: pkg.color }}>
                  <div className="package-card-header">
                    <div className="package-icon" style={{ background: `linear-gradient(135deg, ${pkg.color}15 0%, ${pkg.color}05 100%)` }}>
                      <span style={{ fontSize: '32px' }}>{pkg.icon}</span>
                    </div>
                    <div className="package-title-section">
                      <h3>{pkg.name}</h3>
                      <p className="package-description">{pkg.description}</p>
                    </div>
                    <span className="premium-status-badge" style={{ background: `${pkg.color}15`, color: pkg.color }}>
                      {pkg.status}
                    </span>
                  </div>

                  <div className="package-pricing-section">
                    <div className="price-display">
                      <span className="current-price">{pkg.price}</span>
                      <span className="original-price">{pkg.originalPrice}</span>
                      <span className="savings-badge">Save ₹{Math.max(0, parseInt(String(pkg.originalPrice).replace(/[^0-9]/g, '') || '0') - parseInt(String(pkg.price).replace(/[^0-9]/g, '') || '0'))}</span>
                    </div>
                    <div className="validity-badge">
                        <span className="validity-icon">⏰</span>
                        <span>{pkg.validity}</span>
                    </div>
                  </div>

                  <div className="package-usage-section">
                    <div className="usage-header">
                      <span className="usage-label">Included Features</span>
                      <span className="usage-count">{pkg.totalServices}</span>
                    </div>
                    <div className="usage-progress-bar">
                      <div 
                        className="usage-progress-fill" 
                        style={{ 
                          width: `${pkg.totalServices > 0 ? 100 : 0}%`,
                          background: `linear-gradient(90deg, ${pkg.color} 0%, ${pkg.color}dd 100%)`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="package-next-due">
                    <span className="due-icon">📅</span>
                    <span className="due-label">Duration:</span>
                    <span className="due-date">{pkg.nextDue}</span>
                  </div>

                  <div className="package-services-grid">
                    <h4 className="services-title">Included Services:</h4>
                    <div className="services-grid-items">
                      {pkg.services.map((service, idx) => (
                        <div key={idx} className="service-item-badge">
                          <span className="service-check" style={{ color: pkg.color }}>✓</span>
                          <span className="service-text">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="package-action-buttons">
                    <button
                      className="btn-package-action primary"
                      style={{ background: `linear-gradient(135deg, ${pkg.color} 0%, ${pkg.color}dd 100%)` }}
                      onClick={() => navigate('/view-packages')}
                    >
                      <span className="btn-icon">🛒</span>
                      Browse & Subscribe
                    </button>
                    <button 
                      className="btn-package-action secondary" 
                      style={{ borderColor: pkg.color, color: pkg.color }}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setModalType('details');
                        setShowModal(true);
                      }}
                    >
                      <span className="btn-icon">📋</span>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="content-section">
            <div className="section-header">
              <h1>Service History</h1>
              <p>All your completed services</p>
            </div>

            <div className="content-card">
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>Loading data...</div>
              ) : serviceHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  {apiErrors.history ? 'No data found (API error)' : 'No data found'}
                </div>
              ) : (
                <CommonTable 
                  columns={historyColumns} 
                  data={serviceHistory} 
                  fileName="service-history"
                  showSelection={false}
                />
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="content-section">
            <div className="section-header">
              <h1>My Bookings</h1>
              <p>Your upcoming service bookings</p>
            </div>

            <div className="content-card">
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>Loading data...</div>
              ) : upcomingBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  {apiErrors.bookings ? 'No data found (API error)' : 'No data found'}
                </div>
              ) : (
                <CommonTable 
                  columns={bookingColumns} 
                  data={upcomingBookings} 
                  fileName="my-bookings"
                  showSelection={false}
                />
              )}
            </div>
          </div>
        )}

        {/* New Booking Tab */}
        {activeTab === 'new-booking' && (
          <div className="content-section new-booking-section">
            <BookingWizard preselectedServiceId={preselectedServiceId} />
          </div>
        )}

        {/* Breakdown Tab */}
        {activeTab === 'breakdown' && (
          <div className="content-section">
            <BreakdownCall />
          </div>
        )}

        {/* Modification Tab */}
        {activeTab === 'modification' && (
          <div className="content-section">
            <ModsQuote embedded />
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="content-section">
            <div className="section-header">
              <h1>Billing & Invoices</h1>
              <p>View and download your invoices</p>
            </div>

            <CustomerBillingHistory />
          </div>
        )}

        {/* Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="content-section">
            <div className="section-header">
              <h1>Ratings & Reviews</h1>
              <p>Rate your completed services and view live rating insights</p>
            </div>

            <div className="content-card ratings-submit-card">
              <div className="ratings-submit-head">
                <h2>Give Your Rating</h2>
                <p>Choose a completed booking and submit your review.</p>
              </div>

              <div className="ratings-submit-form">
                <div className="ratings-field-group">
                  <label htmlFor="review-booking-select">Completed Booking</label>
                  <select
                    id="review-booking-select"
                    value={selectedReviewBookingId}
                    onChange={(e) => handleReviewSelection(e.target.value)}
                  >
                    {reviewableBookings.length === 0 && <option value="">No completed booking available</option>}
                    {reviewableBookings.map((item) => (
                      <option key={item.bookingId} value={item.bookingId}>
                        #{item.bookingId} • {item.serviceName} • {item.date}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ratings-field-group">
                  <label>Your Stars</label>
                  <div className="rating-star-input" role="radiogroup" aria-label="Select rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${pendingRating >= star ? 'active' : ''}`}
                        onClick={() => setPendingRating(star)}
                        aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ratings-field-group">
                  <label htmlFor="review-comment">Comment (optional)</label>
                  <textarea
                    id="review-comment"
                    rows="3"
                    maxLength={500}
                    placeholder="Write your service feedback..."
                    value={pendingComment}
                    onChange={(e) => setPendingComment(e.target.value)}
                  ></textarea>
                </div>

                {selectedReviewBooking && (
                  <div className="ratings-selected-meta">
                    <span>Mechanic: {selectedReviewBooking.mechanicName || 'N/A'}</span>
                    <span>
                      Existing: {Number(selectedReviewBooking.existingRating) > 0
                        ? `⭐ ${Number(selectedReviewBooking.existingRating).toFixed(1)}`
                        : 'Not rated yet'}
                    </span>
                  </div>
                )}

                {ratingSubmitState.message && (
                  <div className={`ratings-submit-message ${ratingSubmitState.type}`}>
                    {ratingSubmitState.message}
                  </div>
                )}

                <button
                  type="button"
                  className="btn-primary ratings-submit-btn"
                  disabled={ratingSubmitState.loading || reviewableBookings.length === 0}
                  onClick={handleSubmitRating}
                >
                  {ratingSubmitState.loading ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>

            <div className="ratings-summary-grid">
              <div className="rating-summary-card">
                <span className="summary-label">Overall Rating Index</span>
                <span className="summary-value">{ratingInsights.averageRating > 0 ? `${ratingInsights.averageRating}/5` : '—'}</span>
              </div>
              <div className="rating-summary-card">
                <span className="summary-label">Total Rated Records</span>
                <span className="summary-value">{ratingInsights.totalRatedItems}</span>
              </div>
              <div className="rating-summary-card">
                <span className="summary-label">Active Rating Sources</span>
                <span className="summary-value">{ratingInsights.adminSources.length}</span>
              </div>
            </div>

            {loadingData ? (
              <div className="content-card" style={{ textAlign: 'center', padding: '24px' }}>Loading ratings...</div>
            ) : ratingInsights.adminSources.length === 0 ? (
              <div className="content-card ratings-empty-state">
                <h3>No rating source is active</h3>
                <p>As soon as Admin enables ratings in modules, this page will show them automatically.</p>
              </div>
            ) : (
              ratingInsights.adminSources.map((source) => (
                <div key={source.id} className="content-card ratings-source-card">
                  <div className="ratings-source-head">
                    <div>
                      <h2>{source.title}</h2>
                      <p>{source.subtitle}</p>
                    </div>
                    <div className="ratings-source-stats">
                      <span>{source.average}/5 Avg</span>
                      <span>{source.total} Records</span>
                    </div>
                  </div>

                  {source.type === 'distribution' ? (
                    <div className="rating-distribution-list">
                      {source.items.map((item, index) => {
                        const count = Number(item?.count || 0);
                        const width = source.total > 0 ? Math.max(4, Math.round((count / source.total) * 100)) : 0;
                        return (
                          <div key={`${source.id}-${index}`} className="rating-distribution-row">
                            <span className="distribution-label">{item.rating}</span>
                            <div className="distribution-bar-track">
                              <div className="distribution-bar-fill" style={{ width: `${width}%` }}></div>
                            </div>
                            <span className="distribution-count">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rating-item-grid">
                      {source.items.map((item) => (
                        <div key={`${source.id}-${item.id}`} className="rating-item-card">
                          <div className="rating-item-main">
                            <h4>{item.label}</h4>
                            <p>{item.meta}</p>
                          </div>
                          <span className="rating-chip">⭐ {item.rating.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="content-section">
            <div className="section-header">
              <h1>My Profile</h1>
              <p>Manage and update your profile information</p>
            </div>

            <div className="profile-container">
              {/* Profile Header Card */}
              <div className="profile-header-card">
                <div className="profile-avatar-section">
                  <div className="profile-avatar-container">
                    <div className="profile-avatar-large">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="profile-image" />
                      ) : (
                        <span className="avatar-placeholder">👤</span>
                      )}
                    </div>
                    <label htmlFor="photo-upload" className="photo-upload-btn">
                      📷 Change Photo
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  <div className="profile-header-info">
                    <div className="profile-name-section">
                      {isEditingName ? (
                        <div className="name-edit-container">
                          <input
                            type="text"
                            className="name-edit-input"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
                            autoFocus
                          />
                          <button className="btn-save-name" onClick={handleNameSave}>
                            ✓ Save
                          </button>
                          <button className="btn-cancel-name" onClick={() => {
                            setProfileName(user.email.split('@')[0].toUpperCase());
                            setIsEditingName(false);
                          }}>
                            ✕ Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="name-display-container">
                          <h2>{profileName}</h2>
                          <button className="btn-edit-name" onClick={() => setIsEditingName(true)}>
                            ✏️ Edit Name
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="profile-member-since">{memberSince || 'Member'}</p>
                  </div>
                </div>
              </div>

              {/* Profile Information Card */}
              <div className="content-card">
                <div className="card-header">
                  <h3>Account Information</h3>
                  <p>Your account details</p>
                </div>
                
                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input id="email" type="email" value={user.email} readOnly />
                      <span className="readonly-note">This cannot be changed</span>
                    </div>
                    <div className="form-group">
                      <label htmlFor="name">Full Name</label>
                      <input id="name" type="text" value={profileName} readOnly />
                      <span className="readonly-note">Edit using the button above</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="content-card">
                <div className="card-header">
                  <h3>Contact Information</h3>
                  <p>Update your contact details</p>
                </div>
                
                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input 
                        id="phone" 
                        type="tel" 
                        placeholder="Enter your phone number" 
                        value={profileData.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input 
                        id="city" 
                        type="text" 
                        placeholder="Enter your city" 
                        value={profileData.city}
                        onChange={(e) => handleProfileChange('city', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <textarea 
                      id="address" 
                      placeholder="Enter your complete address"
                      value={profileData.address}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Additional Information Card */}
              <div className="content-card">
                <div className="card-header">
                  <h3>Additional Information</h3>
                  <p>Help us serve you better</p>
                </div>
                
                <div className="profile-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="vehicle">Vehicle Type</label>
                      <input 
                        id="vehicle" 
                        type="text" 
                        placeholder="e.g., Honda Civic, Maruti Swift" 
                        value={profileData.vehicle}
                        onChange={(e) => handleProfileChange('vehicle', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="registration">Registration Number</label>
                      <input 
                        id="registration" 
                        type="text" 
                        placeholder="e.g., GJ 01 AA 1234" 
                        value={profileData.registration}
                        onChange={(e) => handleProfileChange('registration', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="profile-form-actions">
                <button 
                  className="btn-primary btn-save-profile"
                  onClick={handleSaveProfile}
                >
                  💾 Save All Changes
                </button>
                <button 
                  className="btn-secondary"
                  onClick={handleDiscardChanges}
                >
                  🔄 Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Package Details and Renewal */}
      {showModal && selectedPackage && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content package-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>

            {modalType === 'details' ? (
              <>
                <div className="package-modal-header" style={{ background: `linear-gradient(135deg, ${selectedPackage.color} 0%, ${selectedPackage.color}dd 100%)` }}>
                  <div className="modal-header-icon">{selectedPackage.icon}</div>
                  <div className="modal-header-content">
                    <h2 className="modal-title">{selectedPackage.name}</h2>
                    <p className="modal-subtitle">{selectedPackage.description}</p>
                  </div>
                </div>

                <div className="modal-body package-modal-body">
                  <div className="modal-info-grid">
                    <div className="modal-info-card">
                      <div className="modal-info-icon" style={{ background: `${selectedPackage.color}15`, color: selectedPackage.color }}>💰</div>
                      <div className="modal-info-content">
                        <span className="modal-info-label">Package Price</span>
                        <span className="modal-info-value">{selectedPackage.price}</span>
                      </div>
                    </div>
                    <div className="modal-info-card">
                      <div className="modal-info-icon" style={{ background: `${selectedPackage.color}15`, color: selectedPackage.color }}>⏰</div>
                      <div className="modal-info-content">
                        <span className="modal-info-label">Validity</span>
                        <span className="modal-info-value">{selectedPackage.validity}</span>
                      </div>
                    </div>
                    <div className="modal-info-card">
                      <div className="modal-info-icon" style={{ background: `${selectedPackage.color}15`, color: selectedPackage.color }}>✅</div>
                      <div className="modal-info-content">
                        <span className="modal-info-label">Status</span>
                        <span className="modal-info-value" style={{ color: selectedPackage.color }}>{selectedPackage.status}</span>
                      </div>
                    </div>
                    <div className="modal-info-card">
                      <div className="modal-info-icon" style={{ background: `${selectedPackage.color}15`, color: selectedPackage.color }}>📅</div>
                      <div className="modal-info-content">
                        <span className="modal-info-label">Next Due</span>
                        <span className="modal-info-value">{selectedPackage.nextDue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section premium">
                    <h3 className="section-heading" style={{ color: selectedPackage.color }}>
                      <span className="section-icon">🛠️</span>
                      Included Services
                    </h3>
                    <div className="modal-services-grid">
                      {selectedPackage.services.map((service, idx) => (
                        <div key={idx} className="modal-service-item" style={{ borderLeftColor: selectedPackage.color }}>
                          <span className="modal-service-check" style={{ color: selectedPackage.color }}>✓</span>
                          <span className="modal-service-text">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-section premium">
                    <h3 className="section-heading" style={{ color: selectedPackage.color }}>
                      <span className="section-icon">📋</span>
                      How to Use This Package
                    </h3>
                    <div className="usage-steps">
                      <div className="usage-step">
                        <div className="step-number" style={{ background: `${selectedPackage.color}15`, color: selectedPackage.color }}>1</div>
                        <div className="step-content">
                          <h4>Book Your Service</h4>
                          <p>Navigate to "New Booking" and select this package</p>
                        </div>
                      </div>
                      <div className="usage-step">
                        <div className="step-number" style={{ background: `${selectedPackage.color}15`, color: selectedPackage.color }}>2</div>
                        <div className="step-content">
                          <h4>Choose Date & Time</h4>
                          <p>Select a convenient slot and confirm your booking</p>
                        </div>
                      </div>
                      <div className="usage-step">
                        <div className="step-number" style={{ background: `${selectedPackage.color}15`, color: selectedPackage.color }}>3</div>
                        <div className="step-content">
                          <h4>Service Confirmation</h4>
                          <p>Our mechanic will contact you within 2 hours</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section premium benefits-section" style={{ background: `${selectedPackage.color}08` }}>
                    <h3 className="section-heading" style={{ color: selectedPackage.color }}>
                      <span className="section-icon">⭐</span>
                      Package Benefits
                    </h3>
                    <div className="benefits-grid">
                      <div className="benefit-item">
                        <span className="benefit-icon">🔄</span>
                        <span>Free cancellation up to 24 hours</span>
                      </div>
                      <div className="benefit-item">
                        <span className="benefit-icon">⚡</span>
                        <span>Priority booking & scheduling</span>
                      </div>
                      <div className="benefit-item">
                        <span className="benefit-icon">🛡️</span>
                        <span>30-day warranty on services</span>
                      </div>
                      <div className="benefit-item">
                        <span className="benefit-icon">🎯</span>
                        <span>Dedicated customer support</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-actions premium-actions">
                  <button 
                    className="btn-modal-action primary"
                    style={{ background: `linear-gradient(135deg, ${selectedPackage.color} 0%, ${selectedPackage.color}dd 100%)` }}
                    onClick={() => setShowModal(false)}
                  >
                    <span>Got it, Thanks!</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="package-modal-header" style={{ background: `linear-gradient(135deg, ${selectedPackage.color} 0%, ${selectedPackage.color}dd 100%)` }}>
                  <div className="modal-header-icon">{selectedPackage.icon}</div>
                  <div className="modal-header-content">
                    <h2 className="modal-title">Renew {selectedPackage.name}</h2>
                    <p className="modal-subtitle">Continue enjoying premium services</p>
                  </div>
                </div>

                <div className="modal-body package-modal-body">
                  <div className="renewal-section premium">
                    <h3 className="section-heading" style={{ color: selectedPackage.color }}>
                      <span className="section-icon">📊</span>
                      Current Package Details
                    </h3>
                    <div className="renewal-info-grid">
                      <div className="renewal-info-item">
                        <span className="renewal-label">Package Name</span>
                        <span className="renewal-value">{selectedPackage.name}</span>
                      </div>
                      <div className="renewal-info-item">
                        <span className="renewal-label">Current Price</span>
                        <span className="renewal-value" style={{ color: selectedPackage.color }}>{selectedPackage.price}</span>
                      </div>
                      <div className="renewal-info-item">
                        <span className="renewal-label">Validity Period</span>
                        <span className="renewal-value">{selectedPackage.validity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="renewal-section premium">
                    <h3 className="section-heading" style={{ color: selectedPackage.color }}>
                      <span className="section-icon">🎁</span>
                      Choose Renewal Plan
                    </h3>
                    <div className="renewal-options-grid">
                      <div className="renewal-option-card" style={{ borderColor: `${selectedPackage.color}50` }}>
                        <input type="radio" id="renew-1month" name="renewal" defaultChecked />
                        <label htmlFor="renew-1month">
                          <div className="option-header">
                            <span className="option-period">1 Month</span>
                            <span className="option-price">{selectedPackage.price}</span>
                          </div>
                          <span className="option-desc">Standard renewal plan</span>
                        </label>
                      </div>
                      <div className="renewal-option-card recommended" style={{ borderColor: selectedPackage.color, background: `${selectedPackage.color}05` }}>
                        <div className="recommended-badge" style={{ background: selectedPackage.color }}>Most Popular</div>
                        <input type="radio" id="renew-3months" name="renewal" />
                        <label htmlFor="renew-3months">
                          <div className="option-header">
                            <span className="option-period">3 Months</span>
                            <span className="option-price">{selectedPackage.price} × 3</span>
                          </div>
                          <span className="option-desc">Save 10% • Get 1 extra service</span>
                        </label>
                      </div>
                      <div className="renewal-option-card" style={{ borderColor: `${selectedPackage.color}50` }}>
                        <input type="radio" id="renew-6months" name="renewal" />
                        <label htmlFor="renew-6months">
                          <div className="option-header">
                            <span className="option-period">6 Months</span>
                            <span className="option-price">{selectedPackage.price} × 6</span>
                          </div>
                          <span className="option-desc">Save 20% • Get 2 extra services</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-actions premium-actions">
                  <button 
                    className="btn-modal-action secondary"
                    onClick={() => setShowModal(false)}
                  >
                    <span>Cancel</span>
                  </button>
                  <button 
                    className="btn-modal-action primary"
                    style={{ background: `linear-gradient(135deg, ${selectedPackage.color} 0%, ${selectedPackage.color}dd 100%)` }}
                    onClick={() => {
                      setPaymentData({
                        packageName: selectedPackage.name,
                        amount: 500
                      });
                      setShowPayment(true);
                      setShowModal(false);
                    }}
                  >
                    <span>Proceed to Payment →</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Booking Modal for Reschedule and Cancel */}
      {showBookingModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowBookingModal(false)}>✕</button>

            {bookingModalType === 'reschedule' ? (
              <>
                <h2 className="modal-title">Reschedule Booking</h2>
                <div className="modal-body">
                  <div className="booking-info-section">
                    <h3>Current Booking Details</h3>
                    <div className="booking-info-grid">
                      <div className="info-item">
                        <span className="info-label">Service:</span>
                        <span className="info-value">{selectedBooking.service}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Current Date:</span>
                        <span className="info-value">{selectedBooking.date}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Current Time:</span>
                        <span className="info-value">{selectedBooking.time}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Mechanic:</span>
                        <span className="info-value">{selectedBooking.mechanic}</span>
                      </div>
                    </div>
                  </div>

                  <div className="booking-info-section">
                    <h3>Select New Date & Time</h3>
                    <div className="form-group">
                      <label htmlFor="new-date">New Date:</label>
                      <input type="date" id="new-date" min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="new-time">New Time:</label>
                      <select id="new-time">
                        <option value="">Select a time slot</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="02:00">02:00 PM</option>
                        <option value="03:00">03:00 PM</option>
                        <option value="04:00">04:00 PM</option>
                        <option value="05:00">05:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="booking-info-section">
                    <h3>Additional Notes (Optional)</h3>
                    <textarea 
                      placeholder="Add any special instructions or notes for rescheduling..."
                      rows="4"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    ></textarea>
                  </div>

                  <div className="booking-info-section">
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '0' }}>
                      ℹ️ You can reschedule your booking up to 24 hours before the scheduled time. A confirmation email will be sent to {user.email}
                    </p>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowBookingModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={async () => {
                      try {
                        await bookingApi.reschedule(selectedBooking.id, { date: selectedBooking.date, time: selectedBooking.time });
                        alert('Booking rescheduled successfully! Confirmation email will be sent.');
                        loadDashboardData();
                      } catch { alert('Reschedule failed. Please try again.'); }
                      setShowBookingModal(false);
                    }}
                  >
                    Confirm Reschedule
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="modal-title">Cancel Booking</h2>
                <div className="modal-body">
                  <div className="booking-info-section">
                    <h3>Booking Details</h3>
                    <div className="booking-info-grid">
                      <div className="info-item">
                        <span className="info-label">Service:</span>
                        <span className="info-value">{selectedBooking.service}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Date:</span>
                        <span className="info-value">{selectedBooking.date}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Time:</span>
                        <span className="info-value">{selectedBooking.time}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Mechanic:</span>
                        <span className="info-value">{selectedBooking.mechanic}</span>
                      </div>
                    </div>
                  </div>

                  <div className="booking-info-section warning-section">
                    <h3>⚠️ Cancellation Policy</h3>
                    <ul className="cancellation-policy">
                      <li><strong>Free Cancellation:</strong> Up to 24 hours before service - Full refund</li>
                      <li><strong>Partial Refund:</strong> Within 24 hours - 50% refund deducted</li>
                      <li><strong>No Refund:</strong> Less than 2 hours before service</li>
                    </ul>
                  </div>

                  <div className="booking-info-section">
                    <h3>Cancellation Reason</h3>
                    <div className="reason-options">
                      <div className="reason-option">
                        <input type="radio" id="reason-emergency" name="cancellation-reason" />
                        <label htmlFor="reason-emergency">Emergency / Urgent work</label>
                      </div>
                      <div className="reason-option">
                        <input type="radio" id="reason-reschedule" name="cancellation-reason" />
                        <label htmlFor="reason-reschedule">Want to reschedule</label>
                      </div>
                      <div className="reason-option">
                        <input type="radio" id="reason-no-longer" name="cancellation-reason" />
                        <label htmlFor="reason-no-longer">No longer need service</label>
                      </div>
                      <div className="reason-option">
                        <input type="radio" id="reason-other" name="cancellation-reason" />
                        <label htmlFor="reason-other">Other</label>
                      </div>
                    </div>
                  </div>

                  <div className="booking-info-section">
                    <h3>Additional Comments (Optional)</h3>
                    <textarea 
                      placeholder="Please share your feedback or reason in detail..."
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                    ></textarea>
                  </div>

                  <div className="booking-info-section info-box">
                    <p style={{ margin: '0', color: '#1f2937', fontSize: '13px' }}>
                      Refund will be processed within 5-7 business days to your original payment method.
                    </p>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowBookingModal(false)}
                  >
                    Keep Booking
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={async () => {
                      try {
                        await bookingApi.cancel(selectedBooking.id);
                        alert('Booking cancelled successfully! Refund will be processed soon.');
                        loadDashboardData();
                      } catch { alert('Cancellation failed. Please try again.'); }
                      setShowBookingModal(false);
                    }}
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      <PaymentGateway 
        amount={paymentData?.amount || 0}
        serviceName={paymentData?.packageName || 'Package Renewal'}
        isOpen={showPayment}
        onPaymentComplete={(paymentDetails) => {
          alert(`Payment of ₹${paymentData.amount} received successfully for ${paymentData.packageName}! Thank you for renewing your package.`);
          setShowPayment(false);
          setPaymentData(null);
        }}
        onCancel={() => {
          setShowPayment(false);
          setPaymentData(null);
        }}
      />
    </div>
  );
}

export default CustomerDashboard;
