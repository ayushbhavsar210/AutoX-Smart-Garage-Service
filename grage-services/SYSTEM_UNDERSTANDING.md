# AutoX — System Understanding Document

**Project:** AUTOX – Smart Garage, Breakdown & Modification  
**Stack:** React 19 + Express 5 + MongoDB Atlas  
**Date:** March 2026

---

## 1. Implemented Modules

| # | Module | What It Does |
|---|--------|-------------|
| 1 | **Authentication** | Register, login (password + OTP), forgot/reset password, JWT session |
| 2 | **User Management** | Admin CRUD on all users, role assignment (customer/admin/mechanic) |
| 3 | **Service Catalogue** | List, create, update, delete garage services; search and filter by category |
| 4 | **Booking System** | Book services (auth + public), cancel, reschedule, slot availability, status tracking |
| 5 | **Vehicle Management** | User adds/edits/deletes own vehicles (make, model, year, plate) |
| 6 | **Breakdown Calls** | Emergency roadside assistance requests with location, GPS, mechanic dispatch |
| 7 | **Repair Scheduling** | Submit repair request, track status by reference/phone/registration |
| 8 | **Vehicle Modifications** | Browse mods → request quote (auto 10% markup) → admin approves → order created |
| 9 | **Mechanic Management** | Create/update mechanics, track expertise, availability, ratings |
| 10 | **Job Assignments** | Link bookings to mechanics, track 3-stage progress (Assigned → In Progress → Done) |
| 11 | **Inventory & Parts** | Manage spare parts stock, low-stock alerts, create part orders to suppliers |
| 12 | **Billing & Invoicing** | Auto-generated invoices (INV-XXXX), verify, refund, filter by user/status |
| 13 | **Payment Processing** | Initiate payments (PAY-XXXX), verify (Razorpay fields), process refunds |
| 14 | **Notifications** | In-app notifications per user, mark read, bulk mark, email/SMS logging |
| 15 | **Analytics Dashboard** | Revenue, booking trends, customer satisfaction, top services (Recharts charts) |
| 16 | **Reports** | Generate and schedule reports (daily/weekly/monthly) |
| 17 | **Package Subscriptions** | Subscribe to service packages, renew, track status/expiry |
| 18 | **Contact Form** | Public enquiry submission, admin listing |
| 19 | **Settings & Locations** | System config, company info, branch locations, service rates |
| 20 | **Profile Upload** | Base64 profile photo upload with user record update |
| 21 | **PDF Invoices** | Client-side PDF invoice generation (jsPDF) |
| 22 | **Theme Toggle** | Light/dark mode with localStorage persistence |

**Total: 22 modules, 97 API endpoints, 28 database collections**

---

## 2. Missing / Incomplete Modules

| # | What's Missing | Status |
|---|---------------|--------|
| 1 | **Review & Rating CRUD** | Schema exists, analytics reads it, but no create/list/delete endpoints |
| 2 | **Email/SMS Delivery** | Endpoints only log to DB — no actual Nodemailer/Twilio integration |
| 3 | **Scheduled Report Execution** | Reports can be scheduled but no cron job runs them |
| 4 | **Mechanic Portal** | Role exists but no dedicated mechanic-facing UI or endpoints |
| 5 | **Role-Based Access Control** | JWT verified but role not checked — any logged-in user can access any protected route |
| 6 | **File Upload (proper)** | Profile photo stored as base64 in MongoDB — no S3/multer integration |
| 7 | **Geospatial Queries** | 2dsphere indexes defined but `findNearestMechanic` doesn't use `$geoNear` |
| 8 | **Razorpay Integration** | Payment fields exist but no actual SDK — verification is manual |
| 9 | **Password Hashing** | bcryptjs installed + schema methods defined, but auth controller stores **plaintext** |
| 10 | **Mongoose Usage** | Schemas defined with validation/indexes but controllers use native MongoDB driver directly |

---

## 3. System Flow (Request → Response)

```
1. Browser sends HTTP request
2. Express CORS middleware → validates origin
3. JSON body parser → populates req.body
4. Route matching → finds handler among 18 route files
5. Auth middleware (if required) → extracts JWT from "Bearer" header → verifies → sets req.user
6. Validation middleware → express-validator checks body/params/query → 400 if invalid
7. Controller executes:
   a. Gets DB handle: getDB()
   b. Runs MongoDB collection operation (find/insert/update/delete/aggregate)
   c. Formats response: { success: true/false, data, message }
8. If error → global error handler returns { success: false, message }
9. Response sent to browser
```

---

## 4. User Flow (Customer)

**Registration & Login:**
```
Visit site → /register → enter name, email, password → POST /auth/register → JWT token issued → stored in localStorage → redirected to /customer/dashboard
```
Alternative: OTP login → enter email → receive OTP → verify → token issued

**Booking a Service:**
```
/services → browse services → click "Book Now" → /book-service/:id
→ BookingWizard: pick date → check available slots → enter vehicle info → add notes → confirm
→ POST /api/bookings → booking created (status: pending) → appears in dashboard
```

**Customer Dashboard Tabs:**
| Tab | What the customer does |
|-----|----------------------|
| Overview | See profile, quick stats, recent activity |
| Bookings | View upcoming bookings, cancel, reschedule; view service history |
| Services | Browse and book services directly |
| Packages | View subscriptions, renew, subscribe to new |
| Billing | View invoices, download PDF invoices |
| Profile | Edit name/phone, upload photo |

**Other Customer Actions:**
- `/breakdown/call` → submit emergency breakdown with location
- `/repair/schedule` → schedule repair request → track via `/repair/status`
- `/mods/explore` → browse mods → `/mods/quote` → request quote

---

## 5. Admin Flow

**Login:**
```
/admin/login → enter admin credentials → ProtectedAdminRoute checks role === 'admin' → /admin
```

**Admin Dashboard Pages:**

| Page | What admin does |
|------|----------------|
| **Analytics** | View revenue charts, booking trends, satisfaction metrics, service distribution |
| **Dashboard** | Stat cards (bookings, users, revenue), quick stats, performance indicators |
| **Reports** | Generate reports, schedule recurring reports |
| **Billing** | View all invoices, verify, process refunds |
| **Services** | CRUD services catalog |
| **Bookings** | View all bookings, update status (pending → scheduled → in-progress → completed) |
| **Breakdown** | List breakdown calls, assign mechanic, update status/ETA |
| **Mechanics** | List, create, update mechanic profiles |
| **Inventory** | Manage parts stock, low-stock alerts, order parts from suppliers |
| **Assignments** | Create booking↔mechanic links, track job progress |
| **Modifications** | Manage mod quotes (approve/reject/price), create orders |
| **Users** | List all users, create, update, delete |
| **Settings** | System config, company info, branch locations, service rates |

---

## 6. API Flow

```
Client (apiClient.js)
  │
  ├── Builds URL:  API_BASE_URL + path
  ├── Attaches JWT: Authorization: Bearer <token>
  ├── Sets Content-Type: application/json
  └── Calls fetch()
         │
         ▼
Server (Express)
  │
  ├── CORS check
  ├── Route match (18 route files, flat on '/')
  ├── [authMiddleware] → JWT verify → req.user = { id, email, name, role }
  ├── [validate] → express-validator → 400 on failure
  ├── Controller → getDB() → collection operation → return JSON
  └── [errorHandler] → catch-all → 500 with message
         │
         ▼
Response envelope: { success: boolean, data: any, message: string }
```

**Endpoint Distribution:**
- 97 total endpoints across 18 route files
- 26 require authentication (Bearer token)
- 68 have input validation
- All have Swagger/JSDoc annotations

---

## 7. Database Flow

**Database:** MongoDB Atlas → Database name: `AutoX`

### Collections (28 total):

| Group | Collections |
|-------|------------|
| **Auth** | `users`, `otp_codes`, `password_resets` |
| **Core** | `vehicles`, `services`, `bookings`, `mechanics`, `assignments` |
| **Emergency** | `breakdown_calls`, `repairs` |
| **Mods** | `modifications`, `mod_quotes`, `mod_orders` |
| **Finance** | `billing_records`, `payments`, `packages`, `package_renewals` |
| **Inventory** | `inventory`, `part_orders` |
| **Comms** | `notifications`, `notification_logs`, `contact_submissions` |
| **System** | `settings`, `locations`, `service_rates`, `uploads` |
| **Analytics** | `reports`, `report_schedules`, `reviews` |

### How Data Moves (Key Flows):

**Booking → Payment:**
```
User creates booking → status: pending
  → Admin assigns mechanic → Assignment created
  → Service done → status: completed
  → Invoice generated → BillingRecord (INV-XXXX)
  → Payment initiated → Payment (PAY-XXXX, status: initiated)
  → Payment verified → status: completed
```

**Modification Workflow:**
```
User requests quote → ModQuote (auto 110% of base price)
  → Admin approves → status: approved
  → Order created → ModOrder (status: scheduled → in-progress → completed)
```

**Breakdown Resolution:**
```
User submits call → BreakdownCall (status: open)
  → Admin assigns mechanic → status: assigned
  → Mechanic en route → status: en-route
  → Resolved → status: resolved
```

---

## 8. ER Relationships (Text Format)

**User is the central entity:**
```
User ──(has many)──→ Vehicles
User ──(has many)──→ Bookings
User ──(has many)──→ Billing Records
User ──(has many)──→ Payments
User ──(has many)──→ Notifications
User ──(has many)──→ Packages
User ──(has many)──→ Mod Quotes
User ──(has many)──→ Breakdown Calls
User ──(has many)──→ Reviews
User ──(has many)──→ Uploads
```

**Booking connects to multiple entities:**
```
Booking ──(belongs to)──→ User
Booking ──(belongs to)──→ Vehicle
Booking ──(belongs to)──→ Service
Booking ──(has many)────→ Assignments
Booking ──(has one)─────→ Billing Record
Booking ──(has one)─────→ Payment
Booking ──(has one)─────→ Review
```

**Other key relationships:**
```
Mechanic ──(has many)──→ Assignments
Mechanic ──(assigned to)──→ Breakdown Calls
Assignment ──(links)──→ Booking + Mechanic

Modification ──(has many)──→ Mod Quotes
Mod Quote ──(becomes)──→ Mod Order

Package ──(has many)──→ Package Renewals
Inventory Part ──(has many)──→ Part Orders
Billing Record ──(linked to)──→ Payment
Report ──(generated by)──→ User
```

---

## 9. Security Gaps

| # | Issue | Severity |
|---|-------|----------|
| 1 | **Passwords stored in plaintext** — `authController` saves raw password to DB | 🔴 Critical |
| 2 | **No role checking** — middleware verifies JWT but never checks `req.user.role` | 🔴 Critical |
| 3 | **OTP returned in response body** — should be sent via email/SMS only | 🟠 High |
| 4 | **JWT secret fallback** — defaults to `'dev-secret'` if env var missing | 🟠 High |
| 5 | **No rate limiting** — auth endpoints open to brute force | 🟠 High |
| 6 | **71 endpoints need no auth** — analytics, settings, services, inventory all public | 🟡 Medium |
| 7 | **No Helmet.js** — missing security headers (CSP, X-Frame-Options) | 🟡 Medium |
| 8 | **No CSRF protection** | 🟡 Medium |
| 9 | **No request body size limit** — large payload risk | 🟡 Medium |

---

## 10. Performance Issues

| # | Issue | Fix |
|---|-------|-----|
| 1 | **No pagination** on any list endpoint — returns entire collections | Add `?page=1&limit=20` using `.skip().limit()` |
| 2 | **Low-stock alert filters in JS** not in DB query | Use `{ $expr: { $lt: ["$stock", "$minStock"] } }` |
| 3 | **Mongoose indexes not applied** — schemas defined but native driver used | Create indexes via Atlas UI or migration script |
| 4 | **Extra query per write** — auto-increment ID requires a read before every insert | Use a `counters` collection with `$inc` |
| 5 | **No response caching** — services/settings queried on every request | Add in-memory or Redis cache with TTL |
| 6 | **No gzip compression** | Add `compression` middleware |
| 7 | **Dashboard aggregation on every load** | Pre-compute metrics, cache with 5-min TTL |
| 8 | **Base64 images in MongoDB** — bloats documents | Move to S3 + store URL only |
| 9 | **Dual route patterns** (`/bookings` + `/api/bookings` for same resource) | Standardise to `/api/v1/*` |

---

## 11. Simple Improvements

### Must Fix (Before Submission):
1. **Hash passwords** — use `bcrypt.hash()` in register, `bcrypt.compare()` in login (bcryptjs already installed)
2. **Add role middleware** — `const authorize = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json(...)` — apply to admin routes
3. **Remove OTP from response** — log it only or integrate Nodemailer
4. **Add pagination** — at minimum on bookings, users, billing, notifications

### Should Fix:
5. Switch controllers to use Mongoose models (gets you validation, indexes, hooks for free)
6. Add `helmet` and `compression` middleware (2 lines in server.js)
7. Add `express-rate-limit` on `/auth/*` endpoints
8. Implement actual email sending with Nodemailer/SendGrid
9. Add review CRUD endpoints (schema already exists)

### Nice to Have:
10. WebSocket notifications (Socket.IO)
11. Mechanic mobile portal
12. Redis caching layer
13. Full Razorpay SDK integration
14. Automated test suite

---

*Concise system understanding document — AutoX Garage Services Management System*
