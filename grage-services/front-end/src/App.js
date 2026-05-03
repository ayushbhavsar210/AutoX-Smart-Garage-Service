import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from "./components/Sidebar";
import Footer from "./components/Footer";
import Home from "./components/home";
import Services from "./components/services";
import ServiceDetail from "./components/ServiceDetail";
import ServiceCatalog from "./components/ServiceCatalog";
import About from "./components/about";
import Contact from "./components/contact";
import AdminLogin from "./components/AdminLogin";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import BookService from "./components/BookService";
import ViewPackages from "./components/ViewPackages";
import AdminDashboard from "./admin/AdminDashboard";
import CustomerDashboard from "./components/CustomerDashboard";
import BreakdownCall from "./components/BreakdownCall";
import BreakdownRequest from "./components/BreakdownRequest";
import ModsExplore from "./components/ModsExplore";
import ModsQuote from "./components/ModsQuote";
import RepairSchedule from "./components/RepairSchedule";
import RepairStatus from "./components/RepairStatus";
import EmergencySOS from "./components/EmergencySOS";
import EmergencyInfo from "./components/EmergencyInfo";
import Gallery from "./components/Gallery";
import LoadingAnimation from "./components/LoadingAnimation";
import ServiceBooking from "./components/ServiceBooking";
import PDFInvoiceGenerator from "./components/PDFInvoiceGenerator";
import ServicePayment from "./components/ServicePayment";
import PaymentSuccess from "./components/PaymentSuccess";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { BillingProvider } from "./context/BillingContext";
import { NotificationProvider } from "./context/NotificationContext";

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
      {showVideo && <LoadingAnimation onComplete={handleVideoComplete} />}
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
      </div>
    </>
  );
}

function App() {
  const [showLoading, setShowLoading] = useState(true);

  const handleLoadingComplete = () => {
    setShowLoading(false);
  };

  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <BillingProvider>
            {showLoading && <LoadingAnimation onComplete={handleLoadingComplete} />}
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
  );
}

export default App;
