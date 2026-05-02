# AutoX — AUTOX – Smart Garage, Breakdown &  Modification 
## Complete System Architecture & Documentation

---

**Project Title:** AUTOX – Smart Garage, Breakdown &  Modification 
**Academic Purpose:** MSc IT Final Year Project  
**Document Version:** 1.0  
**Date:** March 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Objectives](#2-objectives)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Module Inventory](#5-module-inventory)
6. [Module Descriptions](#6-module-descriptions)
7. [Missing & Incomplete Modules](#7-missing--incomplete-modules)
8. [System Flow](#8-system-flow)
9. [User Flow](#9-user-flow)
10. [Admin Flow](#10-admin-flow)
11. [API Flow](#11-api-flow)
12. [Database Flow](#12-database-flow)
13. [Entity Relationship Explanation](#13-entity-relationship-explanation)
14. [Data Flow Architecture](#14-data-flow-architecture)
15. [Security Implementation](#15-security-implementation)
16. [Performance Analysis](#16-performance-analysis)
17. [Improvements & Scalability Recommendations](#17-improvements--scalability-recommendations)
18. [Professional Verdict](#18-professional-verdict)

---

## 1. Project Overview

AutoX is a full-stack web-based Garage Services Management System designed to digitalise and streamline operations of an automobile service centre. The platform serves three distinct stakeholder groups — **customers**, **administrators**, and **mechanics** — providing end-to-end management of service bookings, vehicle repairs, emergency breakdown assistance, vehicle modifications, inventory management, billing, notifications, and analytics.

The system follows a **client-server architecture** with a React-based Single Page Application (SPA) frontend communicating with a Node.js/Express RESTful API backend, persisted by a MongoDB (Atlas) NoSQL database. The platform supports role-based access control, OTP-based authentication, real-time notification management, and comprehensive business analytics dashboards.

**Key Capabilities:**
- Online service booking with slot availability management
- Emergency roadside breakdown call system with mechanic dispatch
- Vehicle repair scheduling and tracking
- Vehicle modification quoting and ordering workflow
- Spare parts inventory management with low-stock alerts
- Mechanic assignment and job progress tracking
- Billing, invoicing, and payment processing (Razorpay integration)
- Service package subscription and renewal
- Customer and admin notification system (in-app, email, SMS)
- Analytics dashboard with revenue, booking trends, and satisfaction metrics
- Report generation and scheduling
- Light/dark theme support
- PDF invoice generation

---

## 2. Objectives

| # | Objective |
|---|-----------|
| 1 | Develop a responsive web platform for garage service management accessible by customers and administrators |
| 2 | Implement a secure authentication system with JWT tokens, OTP-based login, and password reset |
| 3 | Provide online service booking with real-time slot availability and rescheduling |
| 4 | Enable emergency breakdown call submission with mechanic geolocation dispatch |
| 5 | Digitalise vehicle repair workflow from request through diagnosis to delivery |
| 6 | Support vehicle modification quoting, approval, and order lifecycle |
| 7 | Manage spare parts inventory with automated low-stock alerts and part ordering |
| 8 | Implement mechanic assignment, workload tracking, and job progress monitoring |
| 9 | Provide comprehensive billing, invoicing, payment verification, and refund management |
| 10 | Deliver real-time analytics dashboard with revenue, booking, and customer satisfaction metrics |
| 11 | Implement a notification system supporting in-app, email, and SMS channels |
| 12 | Generate downloadable PDF invoices and scheduled business reports |
| 13 | Ensure role-based access control (Customer, Admin, Mechanic, Manager, Support) |
| 14 | Implement light/dark theme toggling for improved user experience |

---

## 3. Technology Stack

### 3.1 Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2.3 |
| Routing | React Router DOM | 7.13.0 |
| UI Component Library | Mantine Core | 6.0.22 |
| Data Tables | Mantine React Table | 1.3.4 |
| Icons | Tabler Icons React | 3.36.1 |
| Charting | Recharts | 3.7.0 |
| PDF Generation | jsPDF + jspdf-autotable | 4.1.0 / 5.0.7 |
| Screenshot Capture | html2canvas | 1.4.1 |
| Build Tool | react-scripts (CRA) | 5.0.1 |
| Testing | Jest + React Testing Library | — |

### 3.2 Backend

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | — |
| Framework | Express | 5.2.1 |
| Database Driver | MongoDB Native Driver | 7.1.0 |
| ODM (Schema Definitions) | Mongoose | 8.19.3 |
| Authentication | jsonwebtoken (JWT) | 9.0.2 |
| Password Hashing | bcryptjs | 3.0.2 |
| Input Validation | express-validator | 7.3.1 |
| API Documentation | Swagger (swagger-jsdoc + swagger-ui-express) | 6.2.8 / 5.0.1 |
| Environment Config | dotenv | 17.2.3 |
| CORS | cors | 2.8.6 |

### 3.3 Database

| Component | Technology |
|-----------|-----------|
| Database | MongoDB Atlas (Cloud) |
| Database Name | AutoX |
| Connection Protocol | TLS-encrypted MongoDB Native Driver |
| Schema Strategy | Hybrid — Mongoose schemas defined for validation reference; runtime operations use MongoDB Native Driver directly |

### 3.4 External Integrations

| Integration | Purpose |
|-------------|---------|
| Razorpay | Payment gateway (initiated, not fully integrated) |
| AWS S3 | File storage provider (referenced in schema, base64 fallback used) |

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Public Pages │  │   Customer   │  │    Admin Dashboard       │ │
│  │  (Home,About, │  │  Dashboard   │  │  (Analytics, Manage*,    │ │
│  │   Services,   │  │  (Bookings,  │  │   Reports, Settings,     │ │
│  │   Contact)    │  │   Billing,   │  │   Billing, Inventory)    │ │
│  │              │  │   Vehicles)  │  │                          │ │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘ │
│         │                 │                        │               │
│  ┌──────┴─────────────────┴────────────────────────┴─────────────┐ │
│  │                    React Context Layer                         │ │
│  │  AuthContext │ BillingContext │ NotificationContext │ ThemeCtx  │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                             │                                      │
│  ┌──────────────────────────┴────────────────────────────────────┐ │
│  │              API Service Layer (apiClient.js)                  │ │
│  │              fetch() + Bearer JWT Token Injection              │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
└─────────────────────────────┼──────────────────────────────────────┘
                              │ HTTP/REST (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVER (Node.js/Express)                      │
│  ┌────────────┐  ┌────────────────┐  ┌───────────────────────────┐ │
│  │    CORS     │  │  Auth Middleware│  │ Validation Middleware     │ │
│  │  Middleware  │  │  (JWT verify)  │  │ (express-validator)       │ │
│  └──────┬──────┘  └───────┬────────┘  └────────────┬──────────────┘ │
│         └─────────────────┼─────────────────────────┘               │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Route Definitions (18 files)              │   │
│  │  auth │ user │ booking │ billing │ vehicle │ services │ ...  │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Controllers (18 files)                     │   │
│  │  Business logic, data transformation, response formatting    │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                Global Error Handler Middleware                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────────────────────┴───────────────────────────────────┐   │
│  │              Swagger UI (/api-docs)                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │ MongoDB Wire Protocol (TLS)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas (Cloud)                           │
│                     Database: "AutoX"                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  users   │ │ bookings │ │ payments │ │inventory │ │mechanics │ │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ │
│  │ vehicles │ │ services │ │ billing_ │ │ repairs  │ │breakdown │ │
│  │          │ │          │ │ records  │ │          │ │ _calls   │ │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ │
│  │ packages │ │ assigns  │ │ modific- │ │ notific- │ │ settings │ │
│  │          │ │          │ │ ations   │ │ ations   │ │          │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Architectural Pattern

- **Pattern:** Three-Tier Architecture (Presentation → Business Logic → Data)
- **API Style:** RESTful with JSON request/response envelopes
- **Frontend Pattern:** Component-based SPA with Context API for state management
- **Backend Pattern:** MVC (Model-View-Controller) without a dedicated View layer (API-only)
- **Authentication:** Stateless JWT-based with OTP support
- **Database Access:** Direct MongoDB Native Driver operations (bypassing Mongoose models at runtime)

---

## 5. Module Inventory

### 5.1 Fully Implemented Modules

| # | Module | Backend | Frontend | Status |
|---|--------|---------|----------|--------|
| 1 | Authentication & Authorisation | ✅ | ✅ | Complete |
| 2 | User Management | ✅ | ✅ | Complete |
| 3 | Service Catalogue | ✅ | ✅ | Complete |
| 4 | Service Booking | ✅ | ✅ | Complete |
| 5 | Vehicle Management | ✅ | ✅ | Complete |
| 6 | Breakdown Call Management | ✅ | ✅ | Complete |
| 7 | Repair Scheduling & Tracking | ✅ | ✅ | Complete |
| 8 | Vehicle Modification (Quote → Order) | ✅ | ✅ | Complete |
| 9 | Mechanic Management | ✅ | ✅ | Complete |
| 10 | Job Assignment & Progress | ✅ | ✅ | Complete |
| 11 | Inventory & Parts Management | ✅ | ✅ | Complete |
| 12 | Billing & Invoicing | ✅ | ✅ | Complete |
| 13 | Payment Processing | ✅ | ✅ | Complete |
| 14 | Notification System | ✅ | ✅ | Complete |
| 15 | Analytics Dashboard | ✅ | ✅ | Complete |
| 16 | Report Generation & Scheduling | ✅ | ✅ | Complete |
| 17 | Contact Form | ✅ | ✅ | Complete |
| 18 | Settings & Company Info | ✅ | ✅ | Complete |
| 19 | Location Management | ✅ | ✅ | Complete |
| 20 | Service Rate Management | ✅ | ✅ | Complete |
| 21 | Package Subscription & Renewal | ✅ | ✅ | Complete |
| 22 | Profile Photo Upload | ✅ | ✅ | Complete |
| 23 | PDF Invoice Generation | — | ✅ | Frontend only |
| 24 | Theme Management (Light/Dark) | — | ✅ | Frontend only |

### 5.2 Backend-Only Modules (Schema Defined, Controller Absent)

| # | Module | Schema | Controller | Notes |
|---|--------|--------|-----------|-------|
| 25 | Reviews & Ratings | ✅ | ❌ | Schema exists; analytics reads `reviews` collection but no dedicated CRUD controller |
| 26 | Location Geospatial | ✅ (2dsphere index) | Partial | Schema has GeoJSON; no geospatial query implementation |
| 27 | Report Schedule Execution | ✅ | ❌ | Schedule records created but no cron/scheduler to execute them |

---

## 6. Module Descriptions

### 6.1 Authentication & Authorisation Module

Handles user identity verification and session management.

| Feature | Description |
|---------|-------------|
| Registration | Email-based registration with name, email, password, phone, and role assignment |
| Login (Password) | Email + password credential verification with JWT token generation |
| Login (OTP) | OTP generation (6-digit), storage with expiry, and verification for passwordless login |
| Forgot Password | Reset token generation with 30-minute expiry |
| Reset Password | Token validation and password update |
| Session Management | JWT tokens with 1-hour expiry; bearer token authentication |
| Profile Management | Authenticated users can view and update their profile details |
| Account Deletion | Authenticated users can delete their own account |

**Collections:** `users`, `otp_codes`, `password_resets`

### 6.2 User Management Module (Admin)

Administrative CRUD operations for managing all system users.

| Feature | Description |
|---------|-------------|
| List Users | Retrieve all users with sensitive fields stripped |
| Get User | Fetch single user by ObjectId or numeric userId |
| Create User | Admin-created user with auto-increment userId |
| Update User | Partial update with field-level control |
| Delete User | Permanent user deletion |

**Collection:** `users`

### 6.3 Service Catalogue Module

Manages the master list of garage services offered.

| Feature | Description |
|---------|-------------|
| List Services | Retrieve all services sorted by ID |
| Get Service | Fetch by numeric ID with ObjectId fallback |
| Create Service | Add new service with name, price, description, category |
| Update Service | Selective field update |
| Delete Service | Remove service record |
| Search Services | Regex-based text search across name and description |
| Filter by Category | Category-based service filtering |

**Collection:** `services`

### 6.4 Service Booking Module

Core booking workflow supporting authenticated and public bookings.

| Feature | Description |
|---------|-------------|
| Create Booking (Auth) | Authenticated user creates booking linked to serviceId |
| Create Booking (Public) | Unauthenticated booking with customer details captured inline |
| List User Bookings | User's own bookings (auth-scoped) |
| List All Bookings | Admin view of all bookings |
| Get Booking | Single booking retrieval (user-scoped) |
| Cancel Booking | Status update to 'canceled' with timestamp |
| Reschedule Booking | Update scheduled date with previous date preserved |
| Update Status | Admin status progression (scheduled → in-progress → completed) |
| Available Slots | Time slot availability check for a given date |
| Booking Stats | Aggregate statistics (total, scheduled, completed, canceled, completion rate) |
| Delete Booking | Permanent deletion (user-scoped) |

**Collection:** `bookings`

### 6.5 Vehicle Management Module

User-scoped vehicle registry.

| Feature | Description |
|---------|-------------|
| List Vehicles | Authenticated user's vehicles |
| Create Vehicle | Add vehicle (make, model, year, plate) |
| Get Vehicle | Single vehicle by ID (user-scoped) |
| Update Vehicle | Selective field update (user-scoped) |
| Delete Vehicle | Remove vehicle record (user-scoped) |

**Collection:** `vehicles`

### 6.6 Breakdown Call Module

Emergency roadside assistance request system.

| Feature | Description |
|---------|-------------|
| Create Call | Submit breakdown with location, GPS coordinates, vehicle, description |
| List Calls | All breakdown calls sorted by recency |
| Get Call | Single call by ID |
| Update Status | Status progression + mechanic assignment + ETA |
| Find Nearest Mechanic | Returns up to 5 available mechanics sorted by distance |

**Collection:** `breakdown_calls`, `mechanics`

### 6.7 Repair Scheduling Module

Standalone repair request and tracking system.

| Feature | Description |
|---------|-------------|
| Schedule Repair | Submit repair request with vehicle, contact, preferred date/time, pickup option |
| Track Status | Lookup repair status by reference number, phone, or registration |

**Collection:** `repairs`

### 6.8 Vehicle Modification Module

Three-stage workflow: Catalogue → Quote → Order.

| Feature | Description |
|---------|-------------|
| List Modifications | Browse available vehicle modifications |
| Get Modification | Single modification details |
| Request Quote | Create quote at 110% of base price (automatic markup) |
| List Quotes | Filter by userId and status |
| Update Quote Status | Admin status update (quoted, approved, rejected) |
| Create Order | Convert approved quote into scheduled modification order |

**Collections:** `modifications`, `mod_quotes`, `mod_orders`

### 6.9 Mechanic Management Module

Mechanic master data management.

| Feature | Description |
|---------|-------------|
| List Mechanics | All mechanics, optionally filtered by status |
| Create Mechanic | Add mechanic with code, expertise, experience, rating |
| Update Mechanic | Partial update of mechanic details |

**Collection:** `mechanics`

### 6.10 Job Assignment Module

Links bookings to mechanics for execution tracking.

| Feature | Description |
|---------|-------------|
| List Assignments | All assignments |
| Create Assignment | Link booking to mechanic with status 'assigned' |
| Get Assignment | Single assignment by ID |
| Update Assignment | Status and notes update |
| Delete Assignment | Remove assignment |
| Mechanic Assignments | All assignments for a specific mechanic |
| Job Progress | 3-stage timeline (Assigned → In Progress → Completed) |

**Collection:** `assignments`

### 6.11 Inventory & Parts Module

Spare parts management with ordering capability.

| Feature | Description |
|---------|-------------|
| List Inventory | All parts sorted by ID |
| Add Part | Create part with SKU, name, category, price, stock, minStock |
| Update Stock | Update stock level, price, or name |
| Delete Part | Remove part |
| Low Stock Alerts | Parts where current stock < minimum threshold |
| Create Part Order | Order parts from supplier with 5-day expected delivery |

**Collections:** `inventory`, `part_orders`

### 6.12 Billing & Invoicing Module

Financial record management covering invoices, payments, and refunds.

| Feature | Description |
|---------|-------------|
| Create Billing | Auto-generated invoice number (INV-XXXX) |
| List by User | User-specific billing records |
| List All | Admin view with query filters (userId, status, verified) |
| Verify Invoice | Mark invoice as verified with timestamp |
| Refund Invoice | Process refund with reason |
| Create Payment | Initiate payment (PAY-XXXX) with method |
| Get Payment | Single payment lookup |
| User Payments | All payments for a user |
| Verify Payment | Mark payment completed (Razorpay integration fields) |
| Process Refund | Refund completed payment |
| List Invoices | Filtered invoice listing |
| Download Invoice | Invoice download link generation |

**Collections:** `billing_records`, `payments`

### 6.13 Notification Module

Multi-channel notification management.

| Feature | Description |
|---------|-------------|
| User Notifications | Get notifications by userId |
| My Notifications | Auth-scoped notification list |
| Send Notification | Create in-app notification |
| Mark as Read | Single notification read receipt |
| Mark All as Read | Bulk read for authenticated user |
| Delete Notification | Remove notification |
| Send Email | Log email notification to notification_logs |
| Send SMS | Log SMS notification to notification_logs |

**Collections:** `notifications`, `notification_logs`

### 6.14 Package Subscription Module

Service package lifecycle management.

| Feature | Description |
|---------|-------------|
| My Packages | Authenticated user's subscriptions |
| Subscribe | Create new package (duplicate check, PKG-XXXX ID) |
| Renew Package | Create renewal record, update package status |

**Collections:** `packages`, `package_renewals`

### 6.15 Analytics & Reporting Module

Business intelligence dashboard data.

| Feature | Description |
|---------|-------------|
| Dashboard Metrics | Totals for bookings, customers, services, revenue |
| Revenue Analytics | Total revenue, monthly breakdown, top customers |
| Booking Trends | Daily booking counts with completed/canceled split |
| Customer Satisfaction | Rating distribution and average from reviews |
| Generate Report | Create report record with summary data |
| Schedule Report | Create scheduled report entry |

**Collections:** `bookings`, `users`, `services`, `payments`, `reviews`, `reports`, `report_schedules`

### 6.16 Settings Module

System configuration management.

| Feature | Description |
|---------|-------------|
| Get Settings | System settings with auto-seeded defaults |
| Update Settings | Upsert system configuration |
| Company Info | Company details with auto-seeded defaults |
| Location Management | CRUD for branch locations |
| Service Rates | Manage service rate cards |

**Collections:** `settings`, `locations`, `service_rates`

### 6.17 Upload Module

File upload handling.

| Feature | Description |
|---------|-------------|
| Profile Photo | Base64 image storage with user profile update |

**Collections:** `uploads`, `users`

### 6.18 Contact Form Module

Customer enquiry handling.

| Feature | Description |
|---------|-------------|
| Submit | Public contact form submission |
| List | Admin view of all submissions |

**Collection:** `contact_submissions`

---

## 7. Missing & Incomplete Modules

### 7.1 Missing Modules

| # | Module | Impact | Recommendation |
|---|--------|--------|----------------|
| 1 | **Review & Rating CRUD** | Schema defined (`reviewSchema`) and analytics reads `reviews` collection, but no controller/routes for creating, updating, or listing reviews | Implement full CRUD — POST `/api/reviews`, GET `/api/reviews/booking/:bookingId`, GET `/api/reviews/user/:userId` |
| 2 | **Scheduled Report Execution** | `report_schedules` collection populated but no scheduler (cron/agenda) to execute reports at `nextRun` | Implement `node-cron` or `agenda.js` worker to process due scheduled reports |
| 3 | **Email/SMS Delivery** | `sendEmailNotification` and `sendSmsNotification` only log to database; no actual email (Nodemailer/SendGrid) or SMS (Twilio) provider | Integrate Nodemailer/SendGrid for email and Twilio for SMS delivery |
| 4 | **File Upload (Actual)** | Profile photo stored as base64 in MongoDB; `UploadAsset` schema references S3 but not implemented | Integrate `multer` + AWS S3 SDK for proper file storage |
| 5 | **Mechanic Portal** | Role `mechanic` exists but no dedicated mechanic-facing UI or API endpoints | Create mechanic dashboard for viewing assignments, updating progress, managing availability |
| 6 | **Manager/Support Roles** | Roles defined in enum but no role-specific permissions or UI | Implement role-based middleware and dedicated flows |
| 7 | **Audit Logging** | No system-wide audit trail for critical operations | Implement audit collection with user, action, timestamp, and metadata |
| 8 | **Search (Global)** | Text index on services but no unified search across bookings, users, mechanics | Implement MongoDB Atlas Search or Elasticsearch integration |
| 9 | **Password Hashing in Auth** | `authController.js` stores passwords in plaintext; `userController.js` also stores plaintext | Critical: Implement bcrypt hashing using the existing `setPassword()` method from the Mongoose schema |
| 10 | **Rate Limiting** | No rate limiting on authentication endpoints | Implement `express-rate-limit` on `/auth/*` routes |

### 7.2 Partial Implementations

| # | Area | Issue |
|---|------|-------|
| 1 | Mongoose vs Native Driver | Mongoose schemas defined with validation, indexes, and methods but controllers use `getDB()` (native driver) — schemas serve only as documentation |
| 2 | Razorpay Payment Gateway | Payment schema has `gatewayProvider`, `gatewayPaymentId`, `gatewayOrderId` fields but no actual Razorpay SDK integration |
| 3 | Geospatial Queries | 2dsphere indexes defined on `breakdown_calls` and `locations` but `findNearestMechanic` sorts by a plain `distance` field instead of `$near`/`$geoNear` |
| 4 | Invoice PDF Download | Backend returns `/invoices/{id}.pdf` URL but no PDF generation or file serving logic exists server-side (frontend has jsPDF generation) |
| 5 | User Roles Enforcement | Auth middleware verifies JWT but does not check roles — all authenticated users can access all auth-protected routes |

---

## 8. System Flow (Step-by-Step Execution)

### 8.1 Application Startup

```
1. server.js loads environment variables (dotenv)
2. Express app initialised with CORS, JSON body parser
3. 18 route modules imported and mounted on '/' base path
4. Swagger documentation compiled from JSDoc annotations
5. Swagger UI served at /api-docs
6. Global error handler middleware registered
7. connectDB() establishes TLS connection to MongoDB Atlas (Database: "AutoX")
8. Express HTTP server starts on configured PORT (default 3000)
9. Console outputs: "MongoDB Connected" and "Server running at http://localhost:{PORT}"
```

### 8.2 Request Processing Pipeline

```
Incoming HTTP Request
        │
        ▼
   ┌─── CORS Middleware ───┐
   │  Origin validation    │
   │  Headers injection    │
   └───────┬───────────────┘
           ▼
   ┌─── JSON Body Parser ─┐
   │  req.body populated   │
   └───────┬───────────────┘
           ▼
   ┌─── Route Matching ───┐
   │  18 route files       │
   │  checked sequentially │
   └───────┬───────────────┘
           ▼
   ┌─── Auth Middleware ──────────────────┐  (if route requires auth)
   │  Extract Bearer token from header    │
   │  Verify JWT signature + expiry       │
   │  Populate req.user = { id, email,    │
   │    name, role }                      │
   └───────┬──────────────────────────────┘
           ▼
   ┌─── Validation Middleware ────────────┐  (if validators defined)
   │  express-validator checks body/      │
   │    params/query                      │
   │  Returns 400 with error array        │
   │    if validation fails               │
   └───────┬──────────────────────────────┘
           ▼
   ┌─── Controller ───────────────────────┐
   │  Get DB handle via getDB()           │
   │  Execute MongoDB collection ops      │
   │  Format response: { success, data }  │
   │  Call next(error) on failure          │
   └───────┬──────────────────────────────┘
           ▼
   ┌─── Error Handler ───────────────────┐  (if error thrown/passed)
   │  Log error stack                     │
   │  Return { success: false, message }  │
   │  Status code: err.status || 500      │
   └──────────────────────────────────────┘
```

### 8.3 Frontend Initialisation

```
1. index.js renders <App /> as React root
2. App.js wraps application in provider hierarchy:
   AuthProvider → BillingProvider → NotificationProvider → ThemeProvider
3. AuthProvider checks localStorage for cached user and JWT token
4. If token exists, calls GET /auth/me to validate and refresh user data
5. ThemeProvider reads saved theme preference, applies CSS class
6. Router renders AnimatedRoutes with page transition animations
7. Route matching renders appropriate page component
8. Protected routes check user role via useAuth() hook
```

---

## 9. User Flow (Customer Journey)

### 9.1 Registration & Login

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  Visit /     │────▶│ Click Login  │────▶│  Login Form   │────▶│  Enter Email  │
│  Homepage    │     │  / Register  │     │  (AdminLogin)  │     │  + Password   │
└─────────────┘     └──────────────┘     └───────────────┘     └──────┬───────┘
                                                                       │
              ┌────────────────────────────────┬───────────────────────┘
              ▼                                ▼
    ┌─────────────────┐              ┌─────────────────┐
    │ Password Login   │              │  OTP Login       │
    │ POST /auth/login │              │ POST send-otp    │
    │ ─── JWT Token ──▶│              │ ─── Enter OTP ──▶│
    └────────┬────────┘              │ POST verify-otp  │
             │                        │ ─── JWT Token ──▶│
             │                        └────────┬────────┘
             └────────────┬────────────────────┘
                          ▼
               ┌─────────────────────┐
               │  Token stored in     │
               │  localStorage        │
               │  User data in Context│
               │  Redirect to         │
               │  /customer/dashboard │
               └─────────────────────┘
```

### 9.2 Service Booking Flow

```
1. Customer visits /services or /service-catalog
2. Browses available services (fetched from GET /api/services)
3. Clicks "Book Now" on desired service
4. Redirected to /book-service/:serviceId (ServiceBooking component)
5. BookingWizard opens with multi-step form:
   a. Select date → Available slots fetched (GET /bookings/slots?date=YYYY-MM-DD)
   b. Enter vehicle details
   c. Add notes/preferences
   d. Review booking summary
6. Submit booking → POST /api/bookings (public) or POST /bookings (auth)
7. Billing record created via BillingContext
8. Notification sent via NotificationContext
9. Booking confirmed → appears in Customer Dashboard "Upcoming Bookings"
```

### 9.3 Customer Dashboard Features

```
Customer Dashboard (Tab-based navigation)
├── Overview Tab
│   ├── Profile card (name, photo, member since, rating)
│   ├── Quick stats (upcoming bookings, services used, packages)
│   └── Recent activity feed
├── Bookings Tab
│   ├── Upcoming bookings table (CommonTable/Mantine)
│   ├── Booking actions: Cancel, Reschedule
│   ├── Service history table
│   └── New booking wizard
├── Services Tab
│   ├── Browse all services
│   └── Direct booking from service card
├── Packages Tab
│   ├── Active package subscriptions
│   ├── Package renewal
│   └── New package subscription
├── Billing Tab
│   ├── Billing history (CustomerBillingHistory)
│   ├── Invoice list
│   └── PDF invoice download (PDFInvoiceGenerator)
└── Profile Tab
    ├── Edit name, phone, address
    ├── Upload profile photo
    └── Account management
```

### 9.4 Breakdown Emergency Flow

```
1. Customer visits /breakdown/call or /emergency/sos
2. Enters location (text + GPS coordinates if available)
3. Describes vehicle issue
4. Submits → POST /api/breakdown-calls
5. System creates ticket (BRK-XXXX)
6. Admin assigns mechanic → PUT /api/breakdown-calls/:id
7. Customer checks status at /breakdown/request
8. Status progression: open → assigned → en-route → resolved
```

### 9.5 Repair Request Flow

```
1. Customer visits /repair/schedule
2. Enters: name, phone, vehicle, registration, preferred date/time
3. Selects pickup/drop option
4. Describes issue
5. Submits → POST /api/repairs/schedule (creates RP-XXXX ticket)
6. Tracks status at /repair/status using reference number, phone, or registration
7. Status progression: received → diagnosis → in-progress → ready → delivered
```

### 9.6 Vehicle Modification Flow

```
1. Customer visits /mods/explore
2. Browses modifications (GET /api/modifications)
3. Selects modification → /mods/quote
4. Requests quote → POST /api/mod-quotes
5. System generates quote at 110% of base price
6. Admin reviews and updates quote status
7. Customer approves quote
8. Admin creates modification order → POST /api/mod-orders
9. Order executed: created → scheduled → in-progress → completed
```

---

## 10. Admin Flow

### 10.1 Admin Login & Navigation

```
1. Admin visits /admin/login (same as /login)
2. Logs in with admin role credentials
3. ProtectedAdminRoute validates role === 'admin'
4. Redirected to /admin → AdminDashboard
5. AdminNav sidebar provides navigation to all admin pages
```

### 10.2 Admin Dashboard Module Map

```
Admin Dashboard
├── Analytics (default view)
│   ├── Key metrics: revenue, bookings, services, rating
│   ├── Revenue chart (monthly bar chart)
│   ├── Booking trends (daily line/composed chart)
│   ├── Service category distribution (pie chart)
│   └── Customer satisfaction (rating distribution)
├── Dashboard
│   ├── Stat cards (bookings, users, services, vehicles)
│   ├── Quick stats (weekly bookings, pending, in-progress, completed)
│   ├── Performance indicators (satisfaction, on-time, retention)
│   └── Recent activity feed
├── Reports
│   ├── Generate report (POST /api/reports/generate)
│   └── Schedule report (POST /api/reports/schedule)
├── Billing (ManageBilling)
│   ├── List all billing records with filters
│   ├── Verify invoices
│   ├── Process refunds
│   └── View payment details
├── Data Grid
│   └── Advanced tabular data view (DataGrid component)
├── Manage Services
│   ├── List, Create, Update, Delete services
│   └── Category management
├── Manage Bookings
│   ├── List all bookings
│   ├── Update booking status
│   └── View booking details
├── Manage Breakdown
│   ├── List breakdown calls
│   ├── Assign mechanics
│   └── Update status/ETA
├── Manage Mechanics
│   ├── List mechanics with status filter
│   ├── Create new mechanic
│   └── Update mechanic details
├── Manage Inventory
│   ├── List parts with stock levels
│   ├── Add/update/delete parts
│   ├── Low stock alerts
│   └── Create part orders
├── Manage Assignments
│   ├── Create booking-mechanic assignments
│   ├── Track assignment progress
│   └── Update assignment status
├── Manage Modifications
│   ├── List modifications
│   ├── Manage quotes (approve/reject/price)
│   └── Create modification orders
├── Manage Users
│   ├── List all users
│   ├── Create/update/delete users
│   └── Role management
└── Settings
    ├── System settings configuration
    ├── Company information
    ├── Branch location management
    └── Service rate management
```

---

## 11. API Flow (Request-Response Lifecycle)

### 11.1 Standard Response Envelope

**Success Response:**
```json
{
  "success": true,
  "message": "Operation description",
  "data": { /* resource object or array */ },
  "count": 10
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "msg": "Field-level error", "param": "fieldName" }]
}
```

### 11.2 Authentication Flow (API Level)

```
POST /auth/register
  Request:  { name, email, password, phone?, role? }
  Response: { success, token, data: { id, name, email, role } }
  Status: 201 Created | 409 Conflict

POST /auth/login
  Request:  { email, password }
  Response: { success, token, data: { id, name, email, role } }
  Status: 200 OK | 401 Unauthorized

POST /auth/login/send-otp
  Request:  { email }
  Response: { success, data: { email, expiresAt, otp } }
  Status: 200 OK | 404 Not Found

POST /auth/login/verify-otp
  Request:  { email, otp }
  Response: { success, token, data: { id, name, email, role } }
  Status: 200 OK | 400 Invalid

GET /auth/me [Requires: Bearer Token]
  Response: { success, data: { id, name, email, role } }
  Status: 200 OK | 401 Unauthorized | 404 Not Found
```

### 11.3 Booking Lifecycle (API Level)

```
POST /api/bookings  [Public]
  → Creates booking record (status: pending)
  → Returns booking with auto-generated numeric ID

GET /bookings/slots?date=2026-03-15
  → Returns available time slots for the given date
  → Excludes slots with existing non-canceled bookings

PUT /bookings/:id/status  [Admin]
  → Transitions: pending → scheduled → in-progress → completed | canceled

POST /bookings/:id/reschedule  [Auth]
  → Updates scheduledAt, preserves previousScheduledAt

PUT /bookings/:id/cancel  [Auth]
  → Sets status: 'canceled', records canceledAt timestamp
```

### 11.4 Payment Lifecycle (API Level)

```
POST /api/payments
  → Initiates payment (status: initiated, paymentId: PAY-XXXX)

POST /api/payments/verify
  → Verifies with Razorpay IDs (status: completed)

POST /api/refunds
  → Refunds completed payment (status: refunded)
```

### 11.5 Complete API Endpoint Summary

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| Authentication | 9 | 3 of 9 |
| Users | 7 | 2 of 7 |
| Bookings | 14 | 8 of 14 |
| Billing & Payments | 15 | 1 of 15 |
| Services | 9 | 0 of 9 |
| Vehicles | 6 | 6 of 6 |
| Breakdown | 5 | 0 of 5 |
| Repairs | 2 | 0 of 2 |
| Modifications | 6 | 0 of 6 |
| Mechanics | 3 | 0 of 3 |
| Assignments | 7 | 0 of 7 |
| Inventory | 6 | 0 of 6 |
| Notifications | 8 | 2 of 8 |
| Packages | 3 | 3 of 3 |
| Analytics | 6 | 0 of 6 |
| Settings | 8 | 0 of 8 |
| Upload | 1 | 1 of 1 |
| Contact | 2 | 0 of 2 |
| **Total** | **97** | **26 of 97** |

---

## 12. Database Flow

### 12.1 Database Architecture

```
MongoDB Atlas Cluster
└── Database: "AutoX"
    ├── users                 (User accounts, credentials, roles)
    ├── otp_codes             (OTP tokens for login/registration)
    ├── password_resets        (Password reset tokens)
    ├── vehicles              (User vehicles)
    ├── services              (Service catalogue)
    ├── bookings              (Service bookings)
    ├── mechanics             (Mechanic profiles)
    ├── assignments           (Booking-mechanic links)
    ├── breakdown_calls       (Emergency breakdown tickets)
    ├── repairs               (Repair requests)
    ├── inventory             (Spare parts stock)
    ├── part_orders           (Parts procurement orders)
    ├── modifications         (Modification catalogue)
    ├── mod_quotes            (Modification price quotes)
    ├── mod_orders            (Modification work orders)
    ├── billing_records       (Invoices)
    ├── payments              (Payment transactions)
    ├── packages              (Service package subscriptions)
    ├── package_renewals      (Package renewal records)
    ├── notifications         (In-app notifications)
    ├── notification_logs     (Email/SMS delivery logs)
    ├── contact_submissions   (Contact form enquiries)
    ├── uploads               (File upload metadata)
    ├── settings              (System configuration key-value)
    ├── locations             (Branch locations)
    ├── service_rates         (Service pricing rates)
    ├── reports               (Generated report records)
    ├── report_schedules      (Scheduled report config)
    └── reviews               (Customer service reviews)
```

**Total Collections: 28**

### 12.2 Data Flow Patterns

#### Booking-to-Payment Flow
```
User creates Booking → Booking record (status: pending)
                           │
Admin assigns mechanic → Assignment record created
                           │
Service completed → Booking status: completed
                           │
Invoice generated → BillingRecord (INV-XXXX)
                           │
Payment initiated → Payment record (PAY-XXXX, status: initiated)
                           │
Payment verified → Payment status: completed
                           │
(Optional) Refund → Payment status: refunded
                    BillingRecord status: refunded
```

#### Modification Workflow Flow
```
Modification catalogue → User requests quote → ModQuote (10% markup)
                                                   │
                              Admin quotes/approves → status: approved
                                                   │
                              Admin creates order → ModOrder (scheduled)
                                                   │
                              Execution → in-progress → completed
```

#### Breakdown Resolution Flow
```
User submits breakdown → BreakdownCall (status: open)
                              │
Admin assigns mechanic → status: assigned, mechanicId set
                              │
Mechanic en route → status: en-route, ETA set
                              │
Issue resolved → status: resolved
```

---

## 13. Entity Relationship Explanation

### 13.1 Core Relationships

```
USER (1) ────────── (N) VEHICLE
  │                       User owns multiple vehicles
  │
  ├── (1) ────────── (N) BOOKING
  │                       User creates multiple bookings
  │
  ├── (1) ────────── (N) BILLING_RECORD
  │                       User has multiple invoices
  │
  ├── (1) ────────── (N) PAYMENT
  │                       User makes multiple payments
  │
  ├── (1) ────────── (N) NOTIFICATION
  │                       User receives multiple notifications
  │
  ├── (1) ────────── (N) PACKAGE
  │                       User subscribes to multiple packages
  │
  ├── (1) ────────── (N) MOD_QUOTE
  │                       User requests multiple modification quotes
  │
  ├── (1) ────────── (N) MOD_ORDER
  │                       User has multiple modification orders
  │
  ├── (1) ────────── (N) BREAKDOWN_CALL
  │                       User submits multiple breakdown calls
  │
  ├── (1) ────────── (N) REVIEW
  │                       User writes multiple reviews
  │
  └── (1) ────────── (N) UPLOAD_ASSET
                          User uploads multiple files

BOOKING (1) ────────── (N) ASSIGNMENT
  │                        Booking can have multiple mechanic assignments
  │
  ├── (1) ────────── (1) BILLING_RECORD
  │                       Booking linked to one invoice
  │
  ├── (1) ────────── (1) PAYMENT
  │                       Booking linked to one payment
  │
  ├── (N) ────────── (1) SERVICE
  │                       Multiple bookings for one service
  │
  ├── (N) ────────── (1) VEHICLE
  │                       Multiple bookings for one vehicle
  │
  └── (1) ────────── (1) REVIEW
                          Booking may have one review

MECHANIC (1) ────────── (N) ASSIGNMENT
  │                         Mechanic receives multiple assignments
  │
  └── (1) ────────── (N) BREAKDOWN_CALL
                           Mechanic assigned to multiple breakdowns

MODIFICATION (1) ────── (N) MOD_QUOTE
                             Modification generates multiple quotes
MOD_QUOTE (1) ─────── (1) MOD_ORDER
                           Approved quote becomes one order

PACKAGE (1) ─────────── (N) PACKAGE_RENEWAL
                             Package has multiple renewal records

INVENTORY_PART (1) ──── (N) PART_ORDER
                             Part has multiple procurement orders

BILLING_RECORD (1) ──── (1) PAYMENT
                             Invoice linked to one payment

REPORT (N) ──────────── (1) USER (generatedBy)
                             Reports generated by admin users
```

### 13.2 Relationship Summary Table

| Parent Entity | Child Entity | Cardinality | Foreign Key (Child) |
|---------------|-------------|-------------|-------------------|
| User | Vehicle | 1:N | vehicle.userId |
| User | Booking | 1:N | booking.userId |
| User | BillingRecord | 1:N | billing.userId |
| User | Payment | 1:N | payment.userId |
| User | Notification | 1:N | notification.userId |
| User | Package | 1:N | package.userId |
| User | ModQuote | 1:N | modQuote.userId |
| User | ModOrder | 1:N | modOrder.userId |
| User | BreakdownCall | 1:N | breakdown.userId |
| User | Review | 1:N | review.userId |
| User | UploadAsset | 1:N | upload.userId |
| User | Report | 1:N | report.generatedBy |
| Service | Booking | 1:N | booking.serviceId |
| Vehicle | Booking | 1:N | booking.vehicleId |
| Vehicle | BreakdownCall | 1:N | breakdown.vehicleId |
| Booking | Assignment | 1:N | assignment.bookingId |
| Booking | BillingRecord | 1:1 | billing.bookingId |
| Booking | Payment | 1:1 | payment.bookingId |
| Booking | Review | 1:1 | review.bookingId |
| Booking | Repair | 1:1 | repair.bookingId |
| Mechanic | Assignment | 1:N | assignment.mechanicId |
| Mechanic | BreakdownCall | 1:N | breakdown.assignedMechanicId |
| Modification | ModQuote | 1:N | modQuote.modId |
| ModQuote | ModOrder | 1:1 | modOrder.modQuoteId |
| Package | PackageRenewal | 1:N | renewal.packageId |
| InventoryPart | PartOrder | 1:N | partOrder.partId |
| BillingRecord | Payment | 1:1 | payment.invoiceId |

---

## 14. Data Flow Architecture

### 14.1 Frontend Data Flow

```
┌───────────────────────────────────────────────────────────┐
│                    React Component Tree                     │
│                                                             │
│  Page Component (e.g., CustomerDashboard)                  │
│       │                                                     │
│       ├── useState (local UI state)                        │
│       │                                                     │
│       ├── useAuth() ──────▶ AuthContext                    │
│       │                     ├── user object                │
│       │                     ├── login/logout/register      │
│       │                     └── JWT token management       │
│       │                                                     │
│       ├── useBilling() ──▶ BillingContext                  │
│       │                    ├── billingRecords state        │
│       │                    ├── createBillingRecord()       │
│       │                    ├── processRefund()             │
│       │                    └── verifyInvoice()             │
│       │                                                     │
│       ├── useNotifications() ──▶ NotificationContext       │
│       │                         ├── notifications state    │
│       │                         ├── addNotification()      │
│       │                         └── markAsRead()           │
│       │                                                     │
│       └── Direct API calls ──▶ apiService.js               │
│                                   │                         │
│                                   ▼                         │
│                              apiClient.js                   │
│                              ├── JWT injection              │
│                              ├── fetch() wrapper            │
│                              └── Error handling             │
└───────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/JSON
                              ▼
                    Backend REST API
```

### 14.2 Backend Data Flow

```
Controller receives validated request
         │
         ├── getDB() → MongoDB Native client
         │
         ├── Collection operation:
         │   ├── find / findOne       (Read)
         │   ├── insertOne            (Create)
         │   ├── updateOne            (Update)
         │   ├── deleteOne            (Delete)
         │   └── aggregate            (Analytics)
         │
         ├── Auto-ID generation:
         │   ├── getNextId() — numeric auto-increment
         │   └── Timestamp-based IDs (PKG-{ts}, RPT-{ts})
         │
         └── Response formatting:
             └── { success: true/false, data: {}, message: "" }
```

---

## 15. Security Implementation

### 15.1 Implemented Security Measures

| # | Feature | Implementation | Status |
|---|---------|---------------|--------|
| 1 | JWT Authentication | `jsonwebtoken` with configurable secret, 1-hour expiry | ✅ Active |
| 2 | Bearer Token Scheme | Authorization header extraction and verification | ✅ Active |
| 3 | Input Validation | `express-validator` on 68 of 97 endpoints | ✅ Active |
| 4 | CORS Configuration | Explicit origin whitelist (localhost:3000/3001/3002) | ✅ Active |
| 5 | Password Hashing (Schema) | bcryptjs with 12 salt rounds defined in Mongoose schema | ⚠️ Defined but not used |
| 6 | OTP Expiry | 10-minute OTP expiry with `used` flag | ✅ Active |
| 7 | Reset Token Expiry | 30-minute password reset token expiry | ✅ Active |
| 8 | Sensitive Field Stripping | Password/hash excluded from API responses | ✅ Active |
| 9 | MongoDB TLS | TLS-encrypted database connection | ✅ Active |
| 10 | Error Handling | Centralised error middleware prevents error leakage | ✅ Active |
| 11 | Swagger API Docs | API documentation with Bearer auth schema | ✅ Active |

### 15.2 Security Gaps

| # | Gap | Severity | Recommendation |
|---|-----|----------|----------------|
| 1 | **Plaintext Password Storage** | 🔴 Critical | Passwords stored as plaintext in `authController.register()` and `login()`. Must implement bcrypt hashing |
| 2 | **No Role-Based Access Control** | 🔴 Critical | Auth middleware verifies token but does not enforce role restrictions. Any logged-in user can access any auth-protected endpoint |
| 3 | **No Rate Limiting** | 🟠 High | Authentication endpoints vulnerable to brute force attacks |
| 4 | **OTP Returned in Response** | 🟠 High | `sendLoginOtp` returns the OTP value in the API response — should be sent via email/SMS only |
| 5 | **JWT Secret Fallback** | 🟠 High | Falls back to hard-coded `'dev-secret'` if `JWT_SECRET` env var not set |
| 6 | **No CSRF Protection** | 🟡 Medium | No CSRF tokens for state-changing requests |
| 7 | **No Helmet.js** | 🟡 Medium | Missing security headers (X-Frame-Options, CSP, etc.) |
| 8 | **Open Admin Endpoints** | 🟡 Medium | Analytics, settings, services, mechanics, assignments, inventory endpoints require no authentication |
| 9 | **Base64 Image Storage** | 🟡 Medium | Profile photos stored as base64 in database — risk of document size bloat and no access control |
| 10 | **No Request Size Limit** | 🟡 Medium | No explicit body size limit could allow large payload attacks |

---

## 16. Performance Analysis

### 16.1 Identified Performance Issues

| # | Issue | Location | Impact | Recommendation |
|---|-------|----------|--------|----------------|
| 1 | **In-Memory Low Stock Filtering** | `inventoryController.getLowStockAlerts` | Fetches ALL inventory items then filters in JavaScript | Use MongoDB query: `{ stock: { $lt: minStock } }` or aggregation with `$expr` |
| 2 | **No Pagination** | All `find()` operations across all controllers | Returns entire collections without limit/skip | Implement cursor-based or offset pagination on all list endpoints |
| 3 | **No Database Indexes at Runtime** | Mongoose indexes not applied (native driver used) | Full collection scans on frequently queried fields | Create indexes via migration script or MongoDB Atlas UI |
| 4 | **Sequential Auto-ID Queries** | Every create operation queries for max ID first | Extra read per write operation | Use MongoDB `$inc` on a counters collection or UUID generation |
| 5 | **Base64 Image Storage** | `uploadController` | Large binary data in BSON documents; exceeds 16MB limit risk | Offload to S3/GridFS with URL reference |
| 6 | **No Connection Pooling Config** | `db.js` uses default MongoClient settings | Suboptimal under concurrent load | Configure `maxPoolSize`, `minPoolSize` in MongoClient options |
| 7 | **No Response Caching** | All GET endpoints query database on every request | Unnecessary database load for static data (services, settings) | Implement Redis/in-memory cache for catalogue data |
| 8 | **No Query Projection** | Most `find()` calls return all fields | Excess data transfer | Use projection: `{ password: 0, __v: 0 }` |
| 9 | **Aggregation on Every Dashboard Load** | `analyticsController.getDashboardMetrics` | Complex aggregation pipeline on every request | Pre-compute and cache dashboard metrics with TTL |
| 10 | **Unbounded Notifications Fetch** | `getMyNotifications` returns all user notifications | Growing response size over time | Add pagination and limit to last 50 by default |
| 11 | **Dual Route Patterns** | Same resources on `/` and `/api/` paths | Route matching overhead; confusion in maintenance | Standardise all routes under `/api/v1/` |
| 12 | **No Compression** | No gzip/brotli compression middleware | Larger response payloads | Add `compression` middleware |

---

## 17. Improvements & Scalability Recommendations

### 17.1 Critical Fixes (Priority 1)

| # | Improvement | Details |
|---|-------------|---------|
| 1 | **Implement Password Hashing** | Use `bcryptjs` (already installed) in `authController.register()` and compare in `login()` |
| 2 | **Enforce Role-Based Middleware** | Create `authorise(...roles)` middleware that checks `req.user.role` against allowed roles |
| 3 | **Remove OTP from API Response** | Send OTP via email (Nodemailer/SendGrid) only — never return in response body |
| 4 | **Add Rate Limiting** | Install `express-rate-limit`; apply to `/auth/*` routes (e.g., 5 attempts per 15 minutes) |
| 5 | **Use Mongoose Models Consistently** | Switch controllers from `getDB().collection()` to Mongoose models for schema validation, middleware hooks, and indexing |

### 17.2 Architecture Improvements (Priority 2)

| # | Improvement | Details |
|---|-------------|---------|
| 6 | **Standardise API Routes** | Prefix all routes with `/api/v1/` for versioning |
| 7 | **Add Pagination** | Implement `{ page, limit, sort }` query parameters on all list endpoints |
| 8 | **Implement Proper File Upload** | Use `multer` middleware + AWS S3 SDK for file uploads |
| 9 | **Add Helmet.js** | Security headers for all responses |
| 10 | **Add Compression** | `compression` middleware for gzip response encoding |
| 11 | **Implement Caching Layer** | Redis for session tokens, catalogue data, and analytics dashboards |
| 12 | **Add Request Logging** | `morgan` or `winston` for structured request/response logging |
| 13 | **Implement Audit Trail** | Log all create/update/delete operations with user, timestamp, and before/after snapshots |

### 17.3 Feature Enhancements (Priority 3)

| # | Enhancement | Details |
|---|-------------|---------|
| 14 | **Mechanic Mobile Portal** | Dedicated mechanic-facing interface for viewing assignments, updating progress |
| 15 | **Real-Time Notifications** | WebSocket (Socket.IO) for live push notifications |
| 16 | **Email/SMS Integration** | Nodemailer for email, Twilio for SMS delivery |
| 17 | **Review & Rating System** | Full CRUD for customer reviews post-service-completion |
| 18 | **Scheduled Report Execution** | `node-cron` or `agenda.js` for automated report generation |
| 19 | **Full Razorpay Integration** | Server-side order creation, webhook verification, signature validation |
| 20 | **Geospatial Mechanic Dispatch** | Use MongoDB `$geoNear` aggregation for actual proximity-based mechanic finding |
| 21 | **Multi-Tenant Support** | Support multiple garage locations with data isolation |

### 17.4 Scalability Architecture

```
Current Architecture (Monolith):
  React SPA → Express API → MongoDB Atlas

Recommended Evolution Path:

Phase 1: Optimised Monolith
  ├── Add Redis cache layer
  ├── Implement database indexes
  ├── Add pagination on all endpoints
  └── Implement connection pooling

Phase 2: Service Decomposition
  ├── Extract Auth Service (JWT, OTP, RBAC)
  ├── Extract Notification Service (email, SMS, push)
  ├── Extract Payment Service (Razorpay, refunds)
  └── API Gateway (rate limiting, routing)

Phase 3: Production Deployment
  ├── Containerise with Docker
  ├── Deploy on AWS ECS / Azure Container Apps
  ├── MongoDB Atlas M10+ with auto-scaling
  ├── CDN for static assets (CloudFront)
  ├── CI/CD pipeline (GitHub Actions)
  └── Monitoring (Datadog / New Relic)
```

---

## 18. Professional Verdict

### 18.1 Strengths

| # | Strength |
|---|----------|
| 1 | **Comprehensive Module Coverage** — 24 functional modules covering the complete garage service management lifecycle from booking to billing |
| 2 | **Well-Structured Codebase** — Clear separation of concerns with dedicated controllers, routes, middleware, and model definitions for each domain |
| 3 | **Consistent API Design** — Uniform `{ success, data, message }` response envelope across all 97 endpoints |
| 4 | **Modern Tech Stack** — React 19, Express 5, MongoDB Atlas with current dependency versions |
| 5 | **Input Validation** — 70% of endpoints have express-validator middleware with proper error responses |
| 6 | **Complete Frontend Ecosystem** — Context-based state management, centralised API layer, theme system, PDF generation, charting |
| 7 | **Swagger API Documentation** — Auto-generated OpenAPI 3.0 docs with JSDoc annotations on all route files |
| 8 | **Multi-Authentication Strategy** — Password + OTP-based login with forgot/reset password flow |
| 9 | **Rich Admin Dashboard** — Analytics with Recharts visualisation, comprehensive management pages for all resources |
| 10 | **User Experience** — Page transitions with animations, light/dark theme, responsive design, loading states |

### 18.2 Weaknesses

| # | Weakness |
|---|----------|
| 1 | **Critical Security Flaw** — Passwords stored in plaintext despite bcryptjs being installed and hash methods defined in schema |
| 2 | **Schema-Runtime Disconnect** — Mongoose schemas with thorough validation are defined but never used at runtime; controllers operate via native driver |
| 3 | **Insufficient Access Control** — Only 26 of 97 endpoints require authentication; most admin endpoints are publicly accessible |
| 4 | **No Pagination** — All list endpoints return unbounded result sets |
| 5 | **No Automated Testing** — Only one test file (PDFInvoiceGenerator.test.js); no backend tests |
| 6 | **OTP Insecurely Returned** — OTP value exposed in API response body |

### 18.3 Overall Assessment

| Criterion | Rating | Notes |
|-----------|--------|-------|
| Architecture Design | ★★★★☆ (4/5) | Well-structured three-tier with clear separation |
| Code Quality | ★★★☆☆ (3/5) | Consistent patterns but with schema-runtime mismatch |
| Feature Completeness | ★★★★☆ (4/5) | Comprehensive coverage with minor gaps in reviews, mechanic portal |
| Security | ★★☆☆☆ (2/5) | Critical plaintext password issue; insufficient RBAC |
| Performance | ★★☆☆☆ (2/5) | No pagination, no caching, no indexes at runtime |
| Scalability | ★★★☆☆ (3/5) | Good foundation; needs pagination, caching, and connection tuning |
| Documentation | ★★★★☆ (4/5) | Swagger docs present; schema serves as reference |
| User Experience | ★★★★☆ (4/5) | Polished UI with themes, transitions, and responsive design |
| Testing | ★☆☆☆☆ (1/5) | Nearly absent; no backend tests, minimal frontend tests |
| **Overall** | **★★★☆☆ (3/5)** | **Solid functional prototype with strong feature breadth that requires security hardening, performance optimisation, and testing before production readiness** |

### 18.4 Final Verdict

AutoX demonstrates a **functionally comprehensive and well-architected garage management system** suitable for an MSc IT final year project. The system covers an impressive breadth of 24 modules with 97 API endpoints serving three stakeholder roles. The codebase follows consistent design patterns, modern technology choices, and provides a polished user experience.

However, the system has **critical security vulnerabilities** — most notably plaintext password storage and insufficient role-based access control — that must be addressed before any production deployment. The disconnect between the well-designed Mongoose schemas and the runtime use of native MongoDB driver represents a significant missed opportunity for data validation and integrity enforcement.

**For academic submission**, the project demonstrates strong competency in full-stack web development, database design, REST API architecture, and frontend engineering. The breadth and depth of implemented features exceed typical final year project expectations.

**For production readiness**, the project requires: (1) immediate security remediation, (2) performance optimisation through pagination and caching, (3) comprehensive test coverage, and (4) proper infrastructure configuration including rate limiting, compression, and monitoring.

---

*Document generated for MSc IT final year project documentation purposes.*  
*Based on complete source code analysis of the AutoX Garage Services Management System.*
