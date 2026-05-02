| 1 | Authentication | \u2705 Complete | JWT, Email/Password, Password reset |
# AutoX Smart Garage

A full-stack MERN application to manage garage services, bookings, customers, and vehicle tracking efficiently.

## 🚀 Features

- User authentication (Login/Register)
- Book vehicle service online
- Manage customer records
- Track vehicle service status
- Admin dashboard for managing bookings & services
- Responsive UI for all devices

## 🛠️ Tech Stack

- Frontend: React.js
- Backend: Node.js, Express.js
- Database: MongoDB
- Other: REST API, JWT Authentication

## 📸 Screenshots

_Add your project screenshots here_

- Home Page
- Booking Page
- Admin Dashboard

![Home](./screenshots/home.png)

## ⚙️ Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/autox-smart-garage.git
```

2. Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

3. Run the project

```bash
# Start backend
cd server
npm start

# In a separate terminal, start frontend
cd client
npm start
```

## 📂 Project Structure

```md
## 📂 Project Structure

/client  → React frontend  
/server  → Node.js backend  
/models  → MongoDB schemas  
/routes  → API routes  
```

## 🔐 Environment Variables

Create a `.env` file and add:

```
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key
PORT=5000
```

## 🎯 Future Enhancements

- Online payment integration
- Email/SMS notifications
- Service history tracking
- Mobile app version

## 👨‍💻 Author

Ayush Bhavsar  
📧 ayushbhavsar70@gmail.com  
📱 9913828214

🔥 Pro Tips

❌ “This is my project” javu avoid karo
✅ Action words use karo (Manage, Track, Book, Optimize)
✅ Screenshots MUST add karo (impact 2x thai jay)
✅ Clean formatting → headings + spacing


---

## 🎯 Overview

## 🎯 Overview

**AutoX** is an enterprise-grade web application that completely digitalizes automobile service center operations. It's not just a booking system – it's a complete business management platform combining customer engagement, operational efficiency, and financial tracking.

### Who Uses AutoX?

| User Type | What They Do | Key Benefit |
|-----------|-------------|-----------|
| **👨‍💼 Customers** | Book services, track repairs, manage vehicles, pay online | Convenient, transparent service experience |
| **👨‍💻 Administrators** | Manage everything, track jobs, generate invoices, view analytics | Full operational control & business insights |

### Business Impact

```
Before AutoX                          After AutoX
─────────────────────────────────────────────────────
Manual booking (phone calls)    →    Online 24/7 booking
No vehicle tracking              →    Complete vehicle history
Cash-only payments               →    Online + Card payments
Paper invoices                   →    Digital PDFs
No job tracking or assignments   →    Real-time job tracking
No analytics/reports             →    Rich business analytics
Emergency calls scattered        →    Centralized request system
No profit margins calculated     →    Auto-calculated pricing
```

---

## 📊 Quick Demo – How It Works

### Customer Journey
```
1. Registration/Login
   ↓
2. Browse Services
   ↓
3. Select Service + Choose Date & Slot
   ↓
4. Register Vehicle (if new)
   ↓
5. Confirm Booking (get reference #)
   ↓
6. Receive Confirmation (Email/SMS)
   ↓
7. Track Job Status (Dashboard)
   ↓
8. Receive Invoice
   ↓
9. Make Payment (Razorpay)
   ↓
10. Complete! (Rate & Review)
```

### Admin Workflow
```
Dashboard Overview
├─ New Bookings (accept/reject)
├─ Assign jobs to staff
├─ Monitor Job Progress
├─ Generate Invoices
├─ Process Payments
├─ View Analytics
└─ Manage Inventory
```

### Emergency Breakdown Flow
```
User Submits: "I need breakdown assistance"
    ↓
Submit Breakdown Request + GPS Location
    ↓
Request Appears in Admin Dashboard
    ↓
Admin Reviews & Assigns to Available Staff
    ↓
Staff Member Accepts Job Assignment
    ↓
User Receives Assignment Confirmation
    ↓
Service Completed at Location
    ↓
Generate Invoice Instantly
    ↓
Payment Processed
```

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- ✅ **JWT Tokens** – Secure, stateless authentication
- ✅ **Email/Password Login** – Standard login with bcryptjs password hashing
- ✅ **Password Reset** – Forgot password → Email link → Set new password
- ✅ **Role-Based Access** – Customer and Admin roles with different permissions
- ✅ **Session Management** – Auto-logout after inactivity

**How It Works:**
```javascript
// Customer/Admin logs in with email + password
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "secure123"
}

// Server validates email and password hash, returns JWT token
Response: {
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "role": "customer", "name": "John" }
}

// Token stored in localStorage, sent with every request
// Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 🚗 Service Booking & Management
- ✅ **Slot Availability** – Real-time slot checking (prevents double booking)
- ✅ **Booking Wizard** – Step-by-step UI for easy booking
- ✅ **Status Tracking** – Pending → Confirmed → In Progress → Completed
- ✅ **Reschedule** – Change date/time before service starts
- ✅ **Cancellation** – Cancel with refund (admin configurable)
- ✅ **Service Search** – Filter by category, price, rating

**Booking Status Flow:**
```
Pending (user just booked)
  ↓
Confirmed (admin accepted)
  ↓
In Progress (staff member working)
  ↓
Completed (job done)
  ↓
Invoiced (invoice generated)
```

### 🆘 Emergency Breakdown Services
- ✅ **GPS Location** – Automatic location capture from user
- ✅ **Breakdown Request Submission** – Users submit emergency assistance requests
- ✅ **Admin Assignment** – Admin can view and manage breakdown requests
- ✅ **Status Tracking** – Real-time status updates on breakdown requests
- ✅ **Request History** – Track past breakdown service requests

### 🔧 Vehicle Management
- ✅ **Add Multiple Vehicles** – Each customer can register multiple cars
- ✅ **Complete Details** – Make, model, year, registration plate
- ✅ **Service History** – All past services for each vehicle
- ✅ **Maintenance Reminders** – Suggest services based on usage

### 🎨 Vehicle Modifications
- ✅ **Browse Catalog** – List of available modifications
- ✅ **Request Quote** – Customer asks for quote
- ✅ **Auto Pricing** – 10% markup automatically calculated
- ✅ **Admin Approval** – Admin approves/rejects quote
- ✅ **Order Creation** – Once approved, order can be placed
- ✅ **Progress Tracking** – Track modification status

### � Staff Management (Admin Only)
- ✅ **Team Profiles** – View and manage team member information
- ✅ **Expertise Tracking** – Track team specialties (AC, Engine, etc.)
- ✅ **Availability Management** – Set working hours and schedules
- ✅ **Performance Metrics** – View team performance and ratings
- ✅ **Job Assignment** – Assign jobs to team members

### 📦 Inventory Management
- ✅ **Parts Catalog** – Manage spare parts inventory
- ✅ **Stock Tracking** – Current quantity, low-stock threshold
- ✅ **Auto Alerts** – Alert when stock falls below threshold
- ✅ **Supplier Management** – Track suppliers and ordering
- ✅ **Usage Tracking** – Track which parts used in which jobs

### 💳 Billing & Payments
- ✅ **Auto Invoices** – Generated as INV-001, INV-002, etc.
- ✅ **Razorpay Integration** – Accept card/UPI/wallet payments
- ✅ **Payment Verification** – Verify payment details before marking paid
- ✅ **Refunds** – Process refunds with reason tracking
- ✅ **PDF Export** – Download invoices as PDF (jsPDF)
- ✅ **Payment Status** – Pending, Processing, Completed, Failed, Refunded

**Payment Flow:**
```
Invoice Created (total calculated)
  ↓
Customer clicks "Pay Now"
  ↓
Redirected to Razorpay checkout
  ↓
Customer enters card/payment details
  ↓
Payment processed
  ↓
Razorpay returns payment ID + status
  ↓
Backend verifies payment
  ↓
Invoice marked as "Paid"
  ↓
Email receipt sent to customer
```

### 📊 Analytics Dashboard
- ✅ **Revenue Dashboard** – Total revenue, this month, this week
- ✅ **Booking Trends** – Chart showing bookings over time
- ✅ **Customer Satisfaction** – Average ratings, top/bottom services
- ✅ **Staff Performance** – Jobs completed, team ratings, productivity
- ✅ **Inventory Insights** – Top selling parts, stock levels
- ✅ **Scheduled Reports** – Auto-generate daily/weekly/monthly reports

### 📢 Notifications
- ✅ **In-App Notifications** – Bell icon with unread count
- ✅ **Email Notifications** – Receipt, booking confirm, status updates
- ✅ **SMS Logging** – SMS events logged (actual SMS requires Twilio)
- ✅ **Real-time Updates** – Dashboard updates immediately
- ✅ **Read/Unread Tracking** – User can mark as read
- ✅ **Notification History** – View past notifications

### 📋 Package Subscriptions
- ✅ **Define Packages** – Create monthly/yearly plans
- ✅ **Include Services** – Add specific services to each package
- ✅ **Pricing** – Set package price (usually discounted vs à la carte)
- ✅ **Auto Renewal** – Auto-renew on expiry date
- ✅ **Usage Tracking** – Track services used in current period
- ✅ **Upgrade/Downgrade** – Switch to different package

---

## 🛠 Tech Stack

### Frontend (React 19)
| Tech | Version | Why |
|------|---------|-----|
| **React** | 19.2.3 | Modern UI library with latest hooks |
| **React Router** | 7.13.0 | Client-side navigation (no page reloads) |
| **Mantine Core** | 6.0.22 | Beautiful pre-built components |
| **Mantine React Table** | 1.3.4 | Advanced tables with sorting/filtering |
| **Recharts** | 3.7.0 | Charts/graphs for analytics |
| **Tabler Icons** | 3.36.1 | 2000+ professional icons |
| **jsPDF** | 4.1.0 | Generate PDF invoices client-side |
| **Axios** | 1.15.2 | HTTP requests with interceptors |

### Backend (Node.js + Express)
| Tech | Version | Why |
|------|---------|-----|
| **Node.js** | 20+ | Fast, non-blocking JavaScript runtime |
| **Express.js** | 5.2.1 | Lightweight, flexible web framework |
| **MongoDB** | 7.1.0 | Fast driver for NoSQL queries |
| **Mongoose** | 8.19.3 | Schema validation & relationships |
| **JWT** | 9.0.3 | Secure token-based authentication |
| **bcryptjs** | 3.0.3 | Password hashing (industry standard) |
| **Nodemailer** | 8.0.4 | Send emails programmatically |
| **Razorpay** | 2.9.6 | Payment gateway integration |
| **Helmet** | 8.1.0 | Secure HTTP headers |
| **express-validator** | 7.3.1 | Input validation middleware |
| **express-rate-limit** | 7.5.0 | Prevent abuse (rate limiting) |

### Database (MongoDB Atlas)
- ✅ Cloud-hosted NoSQL database
- ✅ Automatic backups & scalability
- ✅ 28 collections optimized for business logic
- ✅ Geospatial indexes for mechanic location
- ✅ Optimized indexes for fast queries
- ✅ TTL indexes for automatic data cleanup

---

## 🏗 System Architecture

### High-Level Flow
```
┌─────────────────────────────────────────────────────┐
│  CLIENT BROWSER (React 19 SPA)                      │
│  ├─ Components (Customer, Admin, Mechanic UI)       │
│  ├─ Components (Customer, Admin UI)
│  ├─ Pages (Dashboard, Booking, Payment, etc)        │
│  ├─ Services (API calls via Axios)                  │
│  └─ State (Context API + localStorage)              │
└─────────────────────────────────────────────────────┘
                    ↓ HTTP/HTTPS ↓
                (JSON + JWT Token)
┌─────────────────────────────────────────────────────┐
│  NODE.JS SERVER (Express 5)                         │
│  ├─ Routes (18 files, 97+ endpoints)                │
│  ├─ Controllers (Business logic)                    │
│  ├─ Middleware (Auth, Validation, Error handling)   │
│  ├─ Models (Mongoose schemas)                       │
│  └─ Utils (JWT, Email, OTP, helpers)                │
│  └─ Utils (JWT, Email, helpers)
│  └─ Utils (JWT, Email, helpers)
└─────────────────────────────────────────────────────┘
                    ↓ MongoDB Driver ↓
┌─────────────────────────────────────────────────────┐
│  MONGODB ATLAS (Cloud Database)                     │
│  ├─ 28 Collections                                  │
│  ├─ Indexes (unique, geospatial, TTL)               │
│  ├─ Validation schemas                              │
│  └─ Relationships (user → booking → mechanic)       │
│  └─ Relationships (user → booking → job assignment)
└─────────────────────────────────────────────────────┘
```

### Request-Response Cycle
```
1️⃣ Browser Request
   POST /api/bookings
   Header: Authorization: Bearer jwt_token
   Body: { service_id: 123, date: "2026-05-15", vehicle_id: 5 }

2️⃣ Express receives request
   ├─ CORS middleware checks origin
   ├─ JSON parser reads body
   └─ Route handler found

3️⃣ Auth Middleware
   ├─ Extract token from header
   ├─ Verify JWT signature
   ├─ Decode and get user ID
   └─ Set req.user = { id, email, role }

4️⃣ Validation Middleware
   ├─ Check service_id is valid number
   ├─ Check date is valid format
   ├─ Check vehicle_id exists for this user
   └─ Return 400 if any validation fails

5️⃣ Controller Function
   ├─ Get database connection
   ├─ Check if service exists
   ├─ Check slot availability
   ├─ Create booking document
   ├─ Save to MongoDB
   └─ Format response

6️⃣ Response sent to browser
   200 OK
   {
     "success": true,
     "data": {
       "booking_id": "BK-001",
       "status": "pending",
       "service": "AC Service"
     },
     "message": "Booking created successfully"
   }

7️⃣ React receives response
   ├─ Store booking in state
   ├─ Update UI
   └─ Navigate to confirmation page
```

---

## 🚀 Getting Started
- Bulk notification actions
- Notification logs and history

### 📊 Analytics & Reporting
- Real-time revenue analytics
- Booking trends and forecasting
- Customer satisfaction metrics
- Top services and mechanics performance
- Top services and staff performance
- Scheduled report generation (Daily/Weekly/Monthly)
- Data visualization with Recharts

### 📋 Additional Features
- Service package subscriptions with renewal tracking
- Customer contact form submissions
- Company settings and branch location management
- Base64 profile photo upload
- Theme toggle (Light/Dark mode) with localStorage persistence
- Responsive design for mobile, tablet, and desktop

## 🚀 Getting Started

### ⏱️ Time Required
- Backend setup: **3-5 minutes**
- Frontend setup: **3-5 minutes**
- Database connection: **2-3 minutes**
- **Total: ~10 minutes**

### Prerequisites Checklist
- ✅ Node.js 20+ installed (`node --version`)
- ✅ npm or yarn (`npm --version`)
- ✅ Git installed (`git --version`)
- ✅ MongoDB Atlas account (free tier available)
- ✅ ~500 MB free disk space
- ✅ Text editor or IDE (VS Code recommended)

### Step 1: Clone Repository
```bash
# Clone from GitHub
git clone https://github.com/YOUR-USERNAME/garage-services.git
cd garage-services/grage-services

# Verify structure
dir  # Windows
ls   # Mac/Linux
```

You should see:
```
grage-services/
├── back-end/
├── front-end/
├── README.md
└── documentation files...
```

### Step 2: Backend Setup

```bash
cd back-end

# 1. Install dependencies
npm install
# This creates node_modules/ folder (~500 MB)

# 2. Create .env file
cp .env.example .env
# (If .env.example doesn't exist, create manually)

# 3. Configure environment variables
# Edit .env file with your settings:
```

**Sample .env file:**
```env
# Database
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.mongodb.net/autox_garage?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=5000
NODE_ENV=development

# Email (for notifications)
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# Razorpay (optional for testing)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxx
```

**How to get MongoDB connection string:**
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free account
3. Create cluster (AWS, us-east-1, free tier)
4. Go to Database → Connect
5. Copy connection string
6. Replace `<password>` with your DB password
7. Replace `myFirstDatabase` with `autox_garage`

```bash
# 4. Start backend server
npm run dev

# You should see:
# ✓ Server running on http://localhost:5000
# ✓ Connected to MongoDB
```

### Step 3: Frontend Setup (New Terminal)

```bash
cd front-end

# 1. Install dependencies
npm install

# 2. Check proxy configuration
# Open package.json, verify this line exists:
# "proxy": "http://localhost:5000"

# 3. Start development server
npm start

# Browser should open http://localhost:3000 automatically
```

### Step 4: Verify Everything Works

**Test Backend:**
```bash
# Open new terminal, test API endpoint
curl http://localhost:5000/api/services

# Should return JSON array of services
```

**Test Frontend:**
- Open http://localhost:3000
- Click "Register"
- Create test account
- Login
- You should see dashboard!

### Step 5: Seed Sample Data (Optional)

```bash
cd back-end

# Add sample services, mechanics, inventory
npm run seed:temp

# Add inventory parts
npm run seed:inventory

# Add mechanics
npm run seed:mechanics
# (Optional) Add other seed data as needed
```

**After seeding, you can:**
- Book sample services from frontend
- See sample mechanics assigned
- All sample data ready to use
- Test payment flows

---

## 📁 Project Structure Explained

### Backend Folder Structure
```
back-end/
│
├── config/
│   ├── db.js              # MongoDB connection setup
│   └── mail.js            # Email configuration
│
├── controllers/           # Business logic (one per feature)
│   ├── authController.js         # Login, register, JWT
│   ├── bookingController.js      # Booking CRUD
│   ├── paymentController.js      # Payment processing
│   ├── analyticsController.js    # Dashboard data
│   └── ... (17 controllers total)
│
├── middleware/            # Request processing
│   ├── authMiddleware.js         # Verify JWT token
│   ├── validationMiddleware.js   # Check input data
│   ├── errorMiddleware.js        # Handle errors
│   └── adminMiddleware.js        # Check admin role
│
├── models/                # Database schemas
│   └── index.js          # All 28 Mongoose schemas
│
├── routes/               # API endpoints (18 files)
│   ├── authRoutes.js            # /api/auth/*
│   ├── bookingRoutes.js         # /api/bookings/*
│   ├── paymentRoutes.js         # /api/payments/*
│   └── ... (18 route files)
│
├── scripts/              # Helper scripts
│   ├── seed.js           # Seed initial data
│   └── seed-mechanics.js # Seed mechanics
│
├── utils/
│   ├── jwt.js            # JWT token functions
│   ├── otp.js            # OTP generation
│   └── sendEmail.js      # Email sending
│
├── server.js             # Main app entry point
├── package.json          # Dependencies list
└── .env                  # Environment variables (not in git)
```

**Key Controller Example:**
```javascript
// controllers/bookingController.js
exports.createBooking = async (req, res) => {
  try {
    // 1. Get user ID from token
    const userId = req.user.id;
    
    // 2. Get booking data from request
    const { serviceId, date, vehicleId } = req.body;
    
    // 3. Validate inputs
    if (!serviceId || !date) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    // 4. Check slot availability
    const existingBooking = await db
      .collection('bookings')
      .findOne({ service_id: serviceId, date: date });
    
    if (existingBooking) {
      return res.status(409).json({ error: 'Slot not available' });
    }
    
    // 5. Create booking
    const booking = {
      user_id: userId,
      service_id: serviceId,
      date: date,
      vehicle_id: vehicleId,
      status: 'pending',
      created_at: new Date()
    };
    
    const result = await db.collection('bookings').insertOne(booking);
    
    // 6. Send response
    res.json({
      success: true,
      data: { booking_id: result.insertedId, ...booking }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Frontend Folder Structure
```
front-end/
│
├── public/               # Static files
│   └── index.html       # Main HTML file
│
├── src/
│   ├── components/      # Reusable React components
│   │   ├── Layout/      # Header, Sidebar, Footer
│   │   ├── Auth/        # Login, Register forms
│   │   ├── Dashboard/   # Dashboard sections
│   │   └── Common/      # Buttons, Cards, Modals
│   │
│   ├── pages/           # Full page components
│   │   ├── LoginPage.jsx
│   │   ├── CustomerDashboard/
│   │   ├── AdminDashboard/
│   │   └── NotFound.jsx
│   │
│   ├── services/        # API integration
│   │   ├── api.js                    # Axios configuration
│   │   ├── authService.js            # Auth API calls
│   │   ├── bookingService.js         # Booking API calls
│   │   └── ... (one per feature)
│   │
│   ├── utils/           # Helper functions
│   │   ├── localStorage.js  # Token management
│   │   ├── formatters.js    # Date, currency formatting
│   │   └── constants.js     # App-wide constants
│   │
│   ├── context/         # React Context (global state)
│   │   ├── AuthContext.js   # User auth state
│   │   └── ThemeContext.js  # Light/dark theme
│   │
│   ├── App.jsx          # Main app with routing
│   ├── App.css          # Global styles
│   └── index.js         # React entry point
│
├── package.json         # Dependencies
└── .env.local          # Environment variables (optional)
```

**Key Component Example:**
```jsx
// pages/LoginPage.jsx
import { useState } from 'react';
import { Container, TextInput, PasswordInput, Button } from '@mantine/core';
import { login } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call API
      const response = await login(email, password);
      
      // Store token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput
          label="Password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <Button type="submit" loading={loading} fullWidth>
          Login
        </Button>
      </form>
    </Container>
  );
}
```

---

## 🔌 Complete API Reference

### Authentication Endpoints

#### Register User
```bash
POST /api/auth/register

Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123",
  "phone": "9876543210"
}

Response (201):
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "60d5ec49f1b2c72a8e8b4567",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

#### Login
```bash
POST /api/auth/login

Request:
{
  "email": "john@example.com",
  "password": "secure123"
}

Response (200):
{
  "success": true,
  "token": "eyJhbGc...",
  "user": { ... }
}
```



### Booking Endpoints

#### Get All Bookings
```bash
GET /api/bookings
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "BK-001",
      "service": "AC Service",
      "date": "2026-05-15",
      "status": "confirmed",
      "total": 500
    },
    { ... more bookings }
  ]
}
```

#### Create Booking
```bash
POST /api/bookings
Authorization: Bearer {token}

Request:
{
  "service_id": "SRV-001",
  "vehicle_id": "VEH-001",
  "date": "2026-05-15",
  "time_slot": "10:00-11:00",
  "notes": "Check AC cooling"
}

Response (201):
{
  "success": true,
  "data": {
    "booking_id": "BK-001",
    "status": "pending",
    "created_at": "2026-05-02T10:30:00Z"
  }
}
```

#### Update Booking Status (Admin Only)
```bash
PUT /api/bookings/{id}
Authorization: Bearer {admin-token}

Request:
{
  "status": "confirmed",
  "mechanic_id": "MECH-001",
    "assigned_staff_id": "STAFF-001",
  "notes": "Assigned to Raj Kumar"
}

Response (200):
{
  "success": true,
  "data": { ... updated booking }
}
```

#### Cancel Booking
```bash
DELETE /api/bookings/{id}
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Booking cancelled. Refund will be processed."
}
```

### Payment Endpoints

#### Initiate Payment
```bash
POST /api/payments/initiate
Authorization: Bearer {token}

Request:
{
  "invoice_id": "INV-001",
  "amount": 500
}

Response (200):
{
  "success": true,
  "razorpay_order_id": "order_IluGWxBm9U8zJ8",
  "amount": 50000  // in paise
}
```

#### Verify Payment
```bash
POST /api/payments/verify
Authorization: Bearer {token}

Request:
{
  "order_id": "order_IluGWxBm9U8zJ8",
  "payment_id": "pay_IluHGQpqCrsJ7O",
  "signature": "5b99b11e2c89..."
}

Response (200):
{
  "success": true,
  "message": "Payment verified successfully"
}
```

### Analytics Endpoints

#### Get Dashboard Summary
```bash
GET /api/analytics/dashboard
Authorization: Bearer {admin-token}

Response (200):
{
  "success": true,
  "data": {
    "total_revenue": 125000,
    "this_month_revenue": 45000,
    "total_bookings": 156,
    "this_month_bookings": 42,
    "customer_satisfaction": 4.5,
    "pending_jobs": 5
  }
}
```

---

## 💾 Database Deep Dive

### The 28 Collections Explained

#### 1. **users** - All user accounts
```javascript
{
  _id: ObjectId,
  name: "John Doe",
  email: "john@example.com",
  password_hash: "bcrypt_hashed_password",
  phone: "9876543210",
  role: "customer", // customer | admin | mechanic
    role: "customer", // customer | admin
  profile_photo: "base64_encoded_image",
  address: "123 Main St",
  created_at: ISODate,
  updated_at: ISODate,
  is_active: true
}
```

#### 2. **services** - Available garage services
```javascript
{
  _id: ObjectId,
  name: "AC Service",
  description: "Full AC servicing...",
  category: "cooling_system", // air_conditioning, engine, transmission, etc
  base_price: 500,
  duration_minutes: 60,
  created_by: ObjectId(admin_user_id),
  is_active: true
}
```

#### 3. **bookings** - Customer service bookings
```javascript
{
  _id: ObjectId,
  booking_ref: "BK-001",
  user_id: ObjectId,
  service_id: ObjectId,
  vehicle_id: ObjectId,
  date: ISODate,
  time_slot: "10:00-11:00",
  mechanic_id: ObjectId, // Null until assigned
    assigned_staff_id: ObjectId, // Null until assigned
  status: "pending", // pending | confirmed | in_progress | completed | cancelled
  notes: "Customer notes",
  created_at: ISODate
}
```

#### 4. **vehicles** - Customer vehicles
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  make: "Toyota",
  model: "Camry",
  year: 2020,
  registration_plate: "KA01AB1234",
  color: "Silver",
  vin: "vehicle_identification_number"
}
```

#### 5. **mechanics** - Mechanic profiles
#### 5. **staff** - Staff/Team member profiles
```javascript
{
  _id: ObjectId,
  name: "Raj Kumar",
  email: "raj@example.com",
  phone: "9876543210",
  specialties: ["AC Service", "Engine Repair"],
  hourly_rate: 500,
  rating: 4.8,
  total_jobs: 125,
  availability: {
    monday: { from: "09:00", to: "18:00" },
    tuesday: { from: "09:00", to: "18:00" },
    // ... other days
  },
  location: {
    type: "Point",
    coordinates: [72.8479, 19.0760]  // [longitude, latitude] for geospatial queries
  }
}
```

#### 6. **payments** - Payment records
```javascript
{
  _id: ObjectId,
  user_id: ObjectId,
  invoice_id: ObjectId,
  amount: 500,
  status: "completed", // pending | completed | failed | refunded
  payment_method: "razorpay_card",
  razorpay_order_id: "order_IluGWxBm9U8zJ8",
  razorpay_payment_id: "pay_IluHGQpqCrsJ7O",
  razorpay_signature: "signature_hash",
  created_at: ISODate
}
```

#### 7. **invoices** - Generated invoices
```javascript
{
  _id: ObjectId,
  invoice_no: "INV-001",
  user_id: ObjectId,
  booking_id: ObjectId,
  items: [
    { service: "AC Service", quantity: 1, unit_price: 500, total: 500 }
  ],
  subtotal: 500,
  tax: 90,
  total: 590,
  status: "unpaid", // unpaid | paid | refunded
  due_date: ISODate,
  paid_on: ISODate,
  created_at: ISODate
}
```

*... and 21 more collections for inventory, notifications, analytics, repairs, breakdowns, etc.*

### Database Relationships

```
users
  ├─→ bookings (one user can have many bookings)
  ├─→ vehicles (one user can have many vehicles)
  ├─→ payments (one user can have many payments)
  └─→ invoices (one user can have many invoices)

services
  └─→ bookings (one service in many bookings)

mechanics
  ├─→ bookings (assigned to many bookings)
  └─→ ratings (rated in many ratings)

bookings
  ├─→ users
  ├─→ services
  ├─→ vehicles
  ├─→ mechanics
  ├─→ invoices
  └─→ assignments
```

### Database Indexes

```javascript
// Faster queries on frequently searched fields
db.users.createIndex({ email: 1 });  // Email must be unique
db.bookings.createIndex({ user_id: 1, created_at: -1 }); // User's recent bookings
db.mechanics.createIndex({
  location: "2dsphere"  // Geospatial index for nearest mechanic
});
db.payments.createIndex({ razorpay_order_id: 1 });
db.notifications.createIndex({
  user_id: 1,
  read: 1  // Quick unread notification count
});
```

---

## 💻 Development Guide

### Common Development Workflows

#### Workflow 1: Adding a New Feature

**Example: Add "Service Rating" feature**

```
Step 1: Create Database Schema
├─ Add to back-end/models/index.js
├─ Define rating fields (service_id, user_id, rating, comment)
└─ Add validation (rating 1-5)

Step 2: Create Backend Endpoints
├─ POST /api/ratings (create rating)
├─ GET /api/ratings/:service_id (get ratings for service)
├─ PUT /api/ratings/:id (update rating)
└─ DELETE /api/ratings/:id (delete rating)

Step 3: Create Controller
├─ controllers/ratingController.js
├─ Implement all CRUD functions
└─ Add validation logic

Step 4: Create Routes
├─ routes/ratingRoutes.js
├─ Define endpoints with auth middleware
└─ Add authorization checks

Step 5: Test Backend (Postman/curl)
├─ Test POST /api/ratings (create)
├─ Test GET /api/ratings
└─ Verify database entries

Step 6: Create Frontend Service
├─ services/ratingService.js
├─ Add API call functions (getRatings, createRating, etc)
└─ Add error handling

Step 7: Create React Component
├─ components/RatingForm.jsx (input form)
├─ components/RatingsList.jsx (display ratings)
└─ Add state management

Step 8: Add to Page
├─ Integrate into ServiceDetails page
├─ Connect to API service
└─ Handle loading/error states

Step 9: Test Frontend
├─ Create test rating
├─ Verify it appears in list
└─ Test edit/delete

Step 10: Deploy
├─ Push to GitHub
├─ Deploy backend changes
└─ Deploy frontend changes
```

#### Workflow 2: Bug Fix

```
Step 1: Reproduce Bug
├─ Understand when it happens
├─ Note exact error message
└─ Find affected user/data

Step 2: Locate Code
├─ Search codebase for related code
├─ Check error logs
└─ Add console.logs for debugging

Step 3: Fix Code
├─ Make minimal targeted change
├─ Avoid unrelated refactoring
└─ Add comment explaining fix

Step 4: Test Fix
├─ Verify bug is gone
├─ Test related features
└─ Ensure no new bugs

Step 5: Commit & Deploy
├─ Commit with clear message
├─ Push to GitHub
└─ Deploy to production
```

### Debugging Tips

**Backend Debugging:**
```bash
# 1. Check server logs
# Terminal where you ran `npm run dev`
# Look for errors/warnings

# 2. Check database
# Go to MongoDB Atlas, view collections
# See if data was created/updated

# 3. Test API directly
curl http://localhost:5000/api/services

# 4. Add console.logs
// controllers/bookingController.js
console.log("Received request:", req.body);
console.log("User ID:", req.user.id);

# 5. Use Postman
# Test endpoints with different data
```

**Frontend Debugging:**
```javascript
// 1. Browser DevTools (F12)
// Network tab: See API calls
// Console tab: See errors
// Application tab: See localStorage

// 2. React DevTools
// Install "React Developer Tools" extension
// See component hierarchy
// Inspect component state

// 3. Add console.logs
import { useEffect, useState } from 'react';

function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  
  useEffect(() => {
    console.log("Component mounted");
    fetchBookings().then(data => {
      console.log("Bookings fetched:", data);
      setBookings(data);
    });
  }, []);
  
  return <div>{bookings.length} bookings</div>;
}

// 4. Check localStorage
// localStorage.getItem('token')
// localStorage.getItem('user')
```

---

## 📊 All 22 Modules Explained

| 1 | Authentication | ✅ Complete | JWT, OTP, Password reset |
| 2 | User Management | ✅ Complete | CRUD on all users, role assignment |
| 3 | Service Catalogue | ✅ Complete | Create, list, update, delete services |
| 4 | Booking System | ✅ Complete | Create, reschedule, cancel bookings |
| 5 | Vehicle Management | ✅ Complete | Register, track multiple vehicles |
| 6 | Breakdown Calls | ✅ Complete | Emergency assistance with dispatch |
| 7 | Repair Scheduling | ✅ Complete | Submit and track repairs |
| 8 | Vehicle Modifications | ✅ Complete | Quote → approval → order flow |
| 9 | Staff Management | ✅ Complete | Profile, availability, team tracking |
| 10 | Job Assignments | ✅ Complete | Assign team, track progress |
| 11 | Inventory & Parts | ✅ Complete | Stock tracking, low-stock alerts |
| 12 | Billing & Invoicing | ✅ Complete | Auto-generated invoices (INV-XXXX) |
| 13 | Payment Processing | ✅ Complete | Razorpay integration, verification |
| 14 | Notifications | ✅ Complete | Multi-channel (In-app, Email, SMS log) |
| 15 | Analytics Dashboard | ✅ Complete | Revenue, trends, satisfaction metrics |
| 16 | Reports | ✅ Complete | Generate & schedule reports |
| 17 | Package Subscriptions | ✅ Complete | Subscribe, renew, track packages |
| 18 | Contact Form | ✅ Complete | Public inquiries, admin listing |
| 19 | Settings & Locations | ✅ Complete | System config, company info |
| 20 | Profile Upload | ✅ Complete | Base64 photo upload |
| 21 | PDF Invoices | ✅ Complete | Client-side PDF generation |
| 22 | Theme Toggle | ✅ Complete | Light/dark mode with persistence |
| ❌ | Mechanic Portal | ⛔ Not Implemented | No mechanic dashboard or portal |
| ❌ | OTP Login | ⛔ Not Implemented | Only email/password authentication |

---

## 🎯 Module #1: Authentication (JWT + OTP)

**What It Does:** Secure user login/registration system

**User Stories:**
- "I want to register with email/password"
- "I want to login without remembering a password (OTP)"
- "I forgot my password, let me reset it"

**How It Works:**
```
Registration Flow:
1. User enters name, email, password
2. Backend hashes password with bcryptjs
3. Create user record in DB
4. Generate JWT token
5. Return token to frontend
6. Frontend stores token in localStorage

Login Flow:
1. User enters email, password
2. Find user by email
3. Compare entered password with stored hash (bcryptjs)
4. If match: generate JWT token
5. Return token (valid for 7 days)
6. Subsequent requests include token in Authorization header

OTP Login Flow:
1. User enters email
2. Generate 6-digit OTP
3. Email OTP to user (or log to DB)
4. User enters OTP
5. Verify OTP
6. Generate JWT token (same as password login)
```



---

## 🎯 Module #1: Authentication (Email/Password Only)

**What It Does:** Secure user login/registration system

**User Stories:**
- "I want to register with email/password"
- "I want to login with my email and password"
- "I forgot my password, let me reset it"

**How It Works:**
```
Registration Flow:
1. User enters name, email, password
2. Backend hashes password with bcryptjs
3. Create user record in DB
4. Generate JWT token
5. Return token to frontend
6. Frontend stores token in localStorage

Login Flow:
1. User enters email, password
2. Find user by email
3. Compare entered password with stored hash (bcryptjs)
4. If match: generate JWT token
5. Return token (valid for 7 days)
6. Subsequent requests include token in Authorization header
```

**Backend Code:**
```javascript
// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  
  // Check if user exists
  const existing = await db.collection('users').findOne({ email });
  if (existing) return res.status(400).json({ error: 'Email already registered' });
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create user
  const user = {
    name,
    email,
    password_hash: hashedPassword,
    phone,
    role: 'customer',
    created_at: new Date()
  };
  
  const result = await db.collection('users').insertOne(user);
  
  // Generate token
  const token = jwt.sign(
    { user_id: result.insertedId, role: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  res.status(201).json({ token, user: { id: result.insertedId, email } });
};
```

**Frontend Code:**
```jsx
// Register page handles form submission
const handleRegister = async (data) => {
  const response = await axios.post('http://localhost:5000/api/auth/register', data);
  localStorage.setItem('token', response.data.token);
  navigate('/dashboard');
};
```

---

## 🎯 Module #2: Booking System

**What It Does:** Online service booking with real-time slots

**Key Features:**
- Browse available services
- Check slot availability
- Book with chosen date/time
- Reschedule booking
- Cancel booking
- Track booking status

**Booking Status Lifecycle:**
```
Customer creates booking
        ↓ (status: pending)
Admin accepts/confirms
        ↓ (status: confirmed)
Mechanic assigned and starts work
        ↓ (status: in_progress)
Service completed
        ↓ (status: completed)
Invoice generated
        ↓ (status: invoiced)
Payment processed
        ↓ (status: paid)
```

**How Slot Availability Works:**
```javascript
// Check if slot is free
const checkSlot = async (serviceId, date, timeSlot) => {
  const existingBooking = await db.collection('bookings').findOne({
    service_id: serviceId,
    date: date,
    time_slot: timeSlot,
    status: { $in: ['pending', 'confirmed', 'in_progress'] }  // Exclude cancelled
  });
  
  return !existingBooking;  // True if available
};
```

---

## 🎯 Module #3: Payment Processing

**What It Does:** Razorpay payment integration

**Payment Flow:**
```
Invoice created → Customer clicks "Pay" → Razorpay checkout → Payment done → Verification → Invoice marked paid
```

**Razorpay Integration:**
```javascript
// Step 1: Create order
const order = await razorpay.orders.create({
  amount: totalAmount * 100,  // Convert to paise
  currency: "INR",
  receipt: `receipt_${invoiceId}`
});

// Step 2: User completes payment in Razorpay UI
// (Frontend handles this)

// Step 3: Verify payment signature
const isSignatureValid = razorpay.utils.validateWebhookSignature(
  webhookBody,
  webhookSignature,
  process.env.RAZORPAY_KEY_SECRET
);

if (isSignatureValid) {
  // Mark invoice as paid
  await db.collection('invoices').updateOne(
    { _id: invoiceId },
    { $set: { status: 'paid', paid_date: new Date() } }
  );
}
```

---

## 🎯 Module #4: Analytics Dashboard

**What It Does:** Business insights and metrics

**Metrics Shown:**
```
┌─ Total Revenue (All time)
├─ This Month Revenue
├─ Today Revenue
├─ Total Bookings (All time)
├─ This Month Bookings
├─ Average Customer Rating
├─ Pending Jobs (not started)
└─ Top Services (by booking count)
```

**Charts Displayed:**
```
1. Revenue Trend (Line chart) - Revenue per day for last 30 days
2. Booking Trend (Line chart) - Bookings per day for last 30 days
3. Top Services (Bar chart) - Most booked services
4. Mechanic Performance (Bar chart) - Jobs completed by each mechanic
5. Payment Status (Pie chart) - Paid vs Unpaid invoices
```

---

## 🎯 Module #5-22 (Quick Reference)

| Module | Key Endpoints | What to Know |
|--------|---|---|
| **Vehicle Mgmt** | POST/GET/PUT/DELETE vehicles | Customers register their cars |
| **Breakdown Calls** | POST breakdown request | Emergency dispatch to nearest mechanic |
| **Repairs** | Submit repair request | Track by reference or phone |
| **Modifications** | Browse → Request quote → Order | 10% markup auto-calculated |
| **Staff Mgmt** | Manage team information | Track expertise, ratings, availability |
| **Job Assignments** | Assign jobs to staff | 3-stage progress tracking |
| **Inventory** | Manage parts, low-stock alerts | Track supplier orders |
| **Invoices** | Auto-generate INV-XXXX | Download as PDF |
| **Notifications** | Multi-channel system | In-app, Email, SMS logged |
| **Packages** | Subscribe to plans | Auto-renewal on expiry |
| **Contact Form** | Public inquiries | Admin reviews all |
| **Settings** | System configuration | Company info, locations |
| **Profile Upload** | Base64 photo upload | Stored in user document |
| **PDF Export** | Invoice PDFs | Generated client-side (jsPDF) |
| **Theme Toggle** | Light/dark mode | Persisted in localStorage |

---

## 🐛 Troubleshooting

### Problem: Backend won't start

**Error:** `Error: connect ECONNREFUSED localhost:27017`

**Solutions:**
```bash
# 1. Check if MongoDB is running
mongosh  # Connect to MongoDB (if local)

# 2. Check connection string
# Open .env, verify MONGODB_URI is correct

# 3. Check if cluster is active
# Go to MongoDB Atlas, check cluster status

# 4. Check whitelist IP
# In MongoDB Atlas: Network Access
# Add your IP address: 0.0.0.0/0 (for development)

# 5. Verify credentials
# Check username/password in connection string
```

### Problem: Frontend can't connect to backend

**Error:** `GET http://localhost:5000/api/services 404 (Not Found)`

**Solutions:**
```bash
# 1. Check if backend is running
# Terminal should show: ✓ Server running on http://localhost:5000

# 2. Check CORS settings
# In back-end/server.js, verify CORS middleware:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

# 3. Check proxy in package.json
# front-end/package.json should have:
# "proxy": "http://localhost:5000"

# 4. Try direct API call
curl http://localhost:5000/api/services
# Should return JSON array
```

### Problem: Authentication token not working

**Error:** `401 Unauthorized`

**Solutions:**
```bash
# 1. Check if token is in localStorage
# Browser DevTools → Application → LocalStorage
# Should show 'token' key with JWT value

# 2. Check token format
# Must include "Bearer " prefix in header
# Authorization: Bearer eyJhbGc...

# 3. Check token expiry
# Token is valid for 7 days
# If older, login again

# 4. Check JWT_SECRET
# In .env files, both must be same:
# backend/.env: JWT_SECRET=my-secret
# (Frontend doesn't need this, uses token only)

# 5. Verify token in header
// src/services/api.js
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;  // ← Check format
  }
  return config;
});
```

### Problem: Database connection string error

**Error:** `MongoParseError: Invalid connection string "mongodb://"`

**Solution:**
```
1. Go to MongoDB Atlas
2. Click "Connect" button on cluster
3. Choose "Drivers" tab
4. Copy full connection string
5. Replace <username> with your DB user
6. Replace <password> with your DB password
7. Replace myFirstDatabase with autox_garage
8. Paste into MONGODB_URI in .env

Example:
mongodb+srv://user:password@cluster0.mongodb.net/autox_garage?retryWrites=true&w=majority
```

### Problem: Password authentication failing

**Error:** `Invalid password for user 'admin'`

**Solutions:**
```
1. Reset DB password in MongoDB Atlas:
   - Cluster → Security → Database Users
   - Click "Edit" on your user
   - Click "Edit Password"
   - Generate new password
   - Copy and update .env

2. Verify no special characters issue:
   - If password has @ or %, URL encode it
   - @ → %40
   - % → %25
   
   Example: password = "abc@123"
   In connection string: abc%40123
```

### Problem: Email notifications not working

**Error:** Emails not received

**Solutions:**
```bash
# 1. Check email configuration
# In back-end/.env:
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=app-specific-password

# 2. Gmail app password (if using Gmail):
# - Go to myaccount.google.com
# - Security → App passwords
# - Generate password for "Mail" on "Windows Computer"
# - Use this 16-char password in EMAIL_PASSWORD

# 3. Check spam folder
# Email might be in spam

# 4. Check if email service is enabled
# In controllers, verify sendEmail is called:
await sendEmail(user.email, subject, htmlContent);

# 5. View email logs
# Go to MongoDB → notifications collection
# Check if email sending is logged
```

### Problem: Booking slots showing when should be empty

**Error:** Slots that shouldn't exist are shown as available

**Solutions:**
```javascript
// Check slot availability query in booking controller
// Should exclude cancelled bookings

const existingBooking = await db.collection('bookings').findOne({
  service_id: serviceId,
  date: date,
  time_slot: timeSlot,
  status: { $in: ['pending', 'confirmed', 'in_progress'] }
  // ↑ NOT including 'cancelled' or 'completed'
});

// If cancelled bookings are blocking slots, exclude them:
status: { $nin: ['cancelled', 'completed'] }  // Exclude these statuses
```

### Problem: Razorpay payment verification failing

**Error:** `Payment verification failed`

**Solutions:**
```javascript
// Check if signature validation is correct
const crypto = require('crypto');

const generateSignature = (orderId, paymentId, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
};

// In payment verification:
const computedSignature = generateSignature(
  order_id,
  payment_id,
  process.env.RAZORPAY_KEY_SECRET
);

const isValid = computedSignature === provided_signature;

// Common issues:
// 1. Wrong order of orderId and paymentId
// 2. Wrong secret key
// 3. Using test key in production
```



### Problem: CORS errors

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solutions:**
```javascript
// In back-end/server.js, add CORS middleware
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',      // Development
    'https://yourdomain.com'       // Production
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Problem: Invoice PDF not generating

**Error:** PDF blank or not downloading

**Solutions:**
```javascript
// In frontend, verify jsPDF is imported
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Check if invoice data exists
const generatePDF = (invoice) => {
  if (!invoice) {
    console.error('Invoice data is null');
    return;
  }
  
  const doc = new jsPDF();
  doc.text(`Invoice: ${invoice.invoice_no}`, 10, 10);
  // ... add more content
  doc.save(`Invoice-${invoice.invoice_no}.pdf`);
};
```

### Problem: localStorage not persisting data

**Error:** Token/user data lost on page refresh

**Solutions:**
```javascript
// In front-end/src/utils/localStorage.js
// Ensure data is being stored correctly

localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));

// On page load, retrieve:
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

// If not working, check browser settings:
// 1. Browser might have disabled localStorage
// 2. Private/Incognito mode doesn't save localStorage
// 3. Check browser console for errors
```

---

## ⚡ Performance Optimization

### Frontend Performance

```javascript
// 1. Code Splitting - Load pages only when needed
const CustomerDashboard = React.lazy(() => 
  import('./pages/CustomerDashboard')
);

// 2. Memoization - Prevent unnecessary re-renders
const BookingCard = React.memo(({ booking }) => {
  return <div>{booking.name}</div>;
});

// 3. Debounce Search - Don't call API for every keystroke
const debouncedSearch = useCallback(
  debounce((query) => {
    searchServices(query);
  }, 500),
  []
);

// 4. Pagination - Don't load all 10,000 bookings at once
// Load 20 at a time, load more on scroll

// 5. Image Optimization - Compress images before upload
```

### Backend Performance

```javascript
// 1. Database Indexing - Speed up queries
db.bookings.createIndex({ user_id: 1, created_at: -1 });

// 2. Connection Pooling - Reuse DB connections
// Mongoose handles this automatically

// 3. Caching - Don't query DB repeatedly for same data
const serviceCache = {};
exports.getServices = async (req, res) => {
  if (serviceCache['all']) {
    return res.json(serviceCache['all']);
  }
  const services = await db.collection('services').find().toArray();
  serviceCache['all'] = services;
  res.json(services);
};

// 4. Pagination in API - Return 20 items, not 1000
GET /api/bookings?page=1&limit=20

// 5. Select only needed fields - Don't return entire document
db.collection('users').find({}, { projection: { name: 1, email: 1 } })
```

---

## 📈 Scaling Your Application

### When You Have 1,000 Users
- Current setup works fine
- Monitor MongoDB performance

### When You Have 10,000 Users
- Add read replicas in MongoDB
- Implement caching layer (Redis)
- Add API rate limiting

### When You Have 100,000 Users
- Split database by region
- Use CDN for static files
- Implement microservices

### Database Scaling

```javascript
// Current: Single MongoDB cluster
// Problem: Single point of failure

// Solution 1: Replica Set (High Availability)
// Same data on 3 servers, one primary

// Solution 2: Sharding (Horizontal Scaling)
// Split data across multiple servers
// Shard key: user_id (all user's data on same server)

db.collection('bookings').createIndex({ user_id: 1 });
```

---

## ❓ FAQ

**Q: Can I use this project as a portfolio?**
A: Absolutely! It's a production-ready application with professional architecture.

**Q: Can I modify this for my garage business?**
A: Yes! Modify configs, branding, features as needed.

**Q: What happens to data if MongoDB goes down?**
A: MongoDB Atlas automatically backs up data. You can restore from backups.

**Q: How much will it cost to deploy?**
A: MongoDB Atlas (free tier) + Vercel (frontend, free tier) + Render (backend, ~$7/month) = ~$7/month.

**Q: Can I add more features later?**
A: Yes! The architecture supports adding new modules easily (follow Workflow 1 in Development Guide).

**Q: How do I handle multiple garages/branches?**
A: Add `branch_id` field to bookings, services, inventory. Filter by branch in queries.

**Q: Can customers rate services?**
A: Yes, ratings module exists (ratingSchema in models). Frontend UI needs to be added.

**Q: How do I prevent duplicate bookings?**
A: Database unique index + slot availability check in controller prevents double booking.

**Q: Do you have a mechanic/staff portal?**
A: No. Currently only Customer and Admin dashboards. Mechanic portal is not implemented.

**Q: Does the system support OTP login?**
A: No. Currently only email/password authentication with JWT tokens.

---

## 📚 Additional Resources

**MongoDB:**
- [MongoDB Documentation](https://docs.mongodb.com)
- [Mongoose Guide](https://mongoosejs.com)
- [Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/)

**React:**
- [React 19 Docs](https://react.dev)
- [React Router Guide](https://reactrouter.com)
- [Mantine Components](https://mantine.dev/components/)

**Backend:**
- [Express.js Guide](https://expressjs.com)
- [JWT Authentication](https://jwt.io)
- [Razorpay API](https://razorpay.com/docs/api/)

---

## 🎯 Next Steps

1. ✅ Clone repository
2. ✅ Setup backend & frontend
3. ✅ Seed database
4. ✅ Create test account
5. ✅ Explore all features
6. ✅ Modify for your needs
7. ✅ Deploy to production

---

## 📊 Module Inventory Summary

**Total Statistics:**
- 📦 **22 Modules** fully implemented
- 🔌 **97+ API Endpoints** ready to use
- 💾 **28 Database Collections** optimized
- 👥 **2 User Roles** (Customer, Admin)
- 📱 **Fully Responsive** UI
- 🔐 **Enterprise-Grade Security**
- ⚡ **Optimized Performance**
- 📈 **Production Ready**

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📝 License

ISC License – See [LICENSE](LICENSE) file

---

## 🙌 Acknowledgments

**Technologies:**
- React 19 – Modern UI framework
- Express.js – Robust backend
- MongoDB Atlas – Scalable database
- Mantine UI – Beautiful components
- Recharts – Data visualization
- Razorpay – Payment integration

**Built By:** A full-stack developer showcasing enterprise application development

---

**Last Updated:** May 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**License:** ISC

---

## 📞 Need Help?

- 📖 Read this README thoroughly (all answers are here!)
- 🐛 Check Troubleshooting section
- 📚 Review SYSTEM_UNDERSTANDING.md
- 💬 Check GitHub Issues
- ✉️ Contact project maintainer

**Happy Coding! 🚀**

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.

## \ud83c\udfaf Module #1: Authentication (Email/Password Only)
