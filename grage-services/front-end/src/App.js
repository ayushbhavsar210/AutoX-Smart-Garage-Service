import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import Navbar from "./components/Sidebar";
import Footer from "./components/Footer";

// Import critical (sync) components
import Home from "./components/home";
import Services from "./components/services";
import About from "./components/about";
import Contact from "./components/contact";
import AdminLogin from "./components/AdminLogin";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import LoadingAnimation from "./components/LoadingAnimation";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BillingProvider } from "./context/BillingContext";
import { NotificationProvider } from "./context/NotificationContext";
import { queryClient } from "./config/queryClient";

// Lazy load route-based components (code splitting)
const ServiceDetail = React.lazy(() => import("./components/ServiceDetail"));
const ServiceCatalog = React.lazy(() => import("./components/ServiceCatalog"));
const ResetPassword = React.lazy(() => import("./components/ResetPassword"));
const BookService = React.lazy(() => import("./components/BookService"));
const ViewPackages = React.lazy(() => import("./components/ViewPackages"));
const AdminDashboard = React.lazy(() => import("./admin/AdminDashboard"));
const CustomerDashboard = React.lazy(() => import("./components/CustomerDashboard"));
const BreakdownCall = React.lazy(() => import("./components/BreakdownCall"));
const BreakdownRequest = React.lazy(() => import("./components/BreakdownRequest"));
const ModsExplore = React.lazy(() => import("./components/ModsExplore"));
const ModsQuote = React.lazy(() => import("./components/ModsQuote"));
const RepairSchedule = React.lazy(() => import("./components/RepairSchedule"));
const RepairStatus = React.lazy(() => import("./components/RepairStatus"));
const EmergencySOS = React.lazy(() => import("./components/EmergencySOS"));
const EmergencyInfo = React.lazy(() => import("./components/EmergencyInfo"));
const Gallery = React.lazy(() => import("./components/Gallery"));
const ServiceBooking = React.lazy(() => import("./components/ServiceBooking"));
const PDFInvoiceGenerator = React.lazy(() => import("./components/PDFInvoiceGenerator"));
const ServicePayment = React.lazy(() => import("./components/ServicePayment"));
const PaymentSuccess = React.lazy(() => import("./components/PaymentSuccess"));

// Fallback loading component for lazy routes
const LazyLoadFallback = () => (
  <div className="lazy-load-fallback" style={{ 
    padding: '40px', 
    textAlign: 'center', 
    color: '#666',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <LoadingAnimation />
  </div>
);

// Simple route transition to animate page changes when navigating from the navbar
function ProtectedAdminRoute({ children }) {
  const { role, authLoading } = useAuth();
  
  if (authLoading) return <div className="auth-loading">Loading...</div>;
  
  if (role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function ProtectedCustomerRoute({ children }) {
  const { role, authLoading } = useAuth();
  
  if (authLoading) return <div className="auth-loading">Loading...</div>;
  
  if (role !== 'user') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AnimatedRoutes() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');
  const [showVideo, setShowVideo] = useState(false);

  // Start fade-out when the url changes
  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('fadeOut');
      setShowVideo(true);
    }
  }, [location, displayLocation.pathname]);

  // After fade-out completes, swap to the new route and fade back in
  useEffect(() => {
    if (transitionStage === 'fadeOut') {
      const timeout = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fadeIn');
      }, 250);
      return () => clearTimeout(timeout);
    }
  }, [transitionStage, location]);

  const handleVideoComplete = () => {
    setShowVideo(false);
  };

  return (
    <>
      {showVideo && <LoadingAnimation onComplete={handleVideoComplete} autoHideMs={250} />}
      {transitionStage === 'fadeOut' && (
        <>
          <div className="route-overlay" aria-hidden>
            <div className="route-brand">
              <span className="brand-letter">A</span>
              <span className="brand-letter">u</span>
              <span className="brand-letter">t</span>
              <span className="brand-letter">o</span>
              <span className="brand-letter">X</span>
            </div>
          </div>
        </>
      )}
      <div className={`page-transition ${transitionStage}`}>
        <Suspense fallback={<LazyLoadFallback />}>
          <Routes location={displayLocation}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/book-service/:serviceId" element={<ServiceBooking />} />
            <Route path="/service/:id" element={<ServiceDetail />} />
            <Route path="/service-catalog" element={<ServiceCatalog />} />
            <Route path="/mods/explore" element={<ModsExplore />} />
            <Route path="/mods/quote" element={<ModsQuote />} />
            <Route path="/emergency/sos" element={<EmergencySOS />} />
            <Route path="/emergency/info" element={<EmergencyInfo />} />
            <Route path="/breakdown/call" element={<BreakdownCall />} />
            <Route path="/breakdown/request" element={<BreakdownRequest />} />
            <Route path="/repair/schedule" element={<RepairSchedule />} />
            <Route path="/repair/status" element={<RepairStatus />} />
            <Route path="/book-service" element={<BookService />} />
            <Route path="/view-packages" element={<ViewPackages />} />
            <Route path="/about" element={<About />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/customer/dashboard" element={
              <ProtectedCustomerRoute>
                <CustomerDashboard />
              </ProtectedCustomerRoute>
            } />
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } />
            <Route path="/invoice-generator" element={
              <ProtectedCustomerRoute>
                <PDFInvoiceGenerator />
              </ProtectedCustomerRoute>
            } />
            <Route path="/service-payment" element={<ServicePayment />} />
            <Route path="/payment-success/:bookingId" element={
              <ProtectedCustomerRoute>
                <PaymentSuccess />
              </ProtectedCustomerRoute>
            } />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

function App() {
  const [showLoading, setShowLoading] = useState(() => {
    if (typeof document === 'undefined') {
      return true;
    }

    return document.readyState !== 'complete';
  });

  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    if (document.readyState === 'complete') {
      setShowLoading(false);
      return undefined;
    }

    const handleWindowLoad = () => {
      setShowLoading(false);
    };

    window.addEventListener('load', handleWindowLoad);

    return () => {
      window.removeEventListener('load', handleWindowLoad);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <BillingProvider>
              {showLoading && <LoadingAnimation onComplete={handleLoadingComplete} autoHideMs={null} />}
              <div className="app">
                {/* Navbar - Always visible */}
                <Navbar />

                {/* Main content - Changes based on route */}
                <main className="main">
                  <AnimatedRoutes />
                </main>

                {/* Footer - Always visible */}
                <Footer />
              </div>
            </BillingProvider>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
