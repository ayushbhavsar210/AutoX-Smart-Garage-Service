# Workspace Exploration Summary

## 1. DATABASE SCHEMA & MODELS

### Location: [back-end/models/index.js](back-end/models/index.js)

#### **Service Schema**
```javascript
const serviceSchema = new Schema({
  serviceCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  category: { type: String, required: true, trim: true, index: true },
  basePrice: { type: Number, required: true, min: 0 },
  estimatedDurationMinutes: { type: Number, min: 0 },
  active: { type: Boolean, default: true, index: true },
  // with timestamps
}, defaultSchemaOptions);
```
- **Collection:** `services`
- Indexes on: `name`, `description`, `category` (text search), `active`, `category`

#### **Booking Schema**
```javascript
const bookingSchema = new Schema({
  bookingNo: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true },
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', index: true },
  customerName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  vehicleNumber: { type: String, trim: true, uppercase: true },
  scheduledAt: { type: Date, required: true, index: true },
  notes: { type: String },
  amount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: BOOKING_STATUS_ENUM, default: 'pending', index: true },
  statusUpdatedAt: { type: Date },
  previousScheduledAt: { type: Date },
  rescheduledAt: { type: Date },
  canceledAt: { type: Date },
}, defaultSchemaOptions);
```
- **Collection:** `bookings`
- **Status Enum:** `['pending', 'scheduled', 'in-progress', 'completed', 'canceled', 'no-show']`
- Indexes on: `userId`, `status`, `scheduledAt`

#### **Billing Record Schema**
```javascript
const billingRecordSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, trim: true, minlength: 3, maxlength: 3 },
  status: { type: String, enum: INVOICE_STATUS_ENUM, default: 'issued', index: true },
  verified: { type: Boolean, default: false, index: true },
  verifiedAt: { type: Date },
  refundReason: { type: String },
  refundedAt: { type: Date },
}, defaultSchemaOptions);
```
- **Collection:** `billing_records`
- **Status Enum:** `['issued', 'paid', 'partially_paid', 'overdue', 'refunded', 'void']`
- Indexes on: `userId`, `invoiceNumber`, `status`

#### **Payment Schema**
```javascript
const paymentSchema = new Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
  invoiceId: { type: Schema.Types.ObjectId, ref: 'BillingRecord', index: true },
  amount: { type: Number, required: true, min: 0 },
  // ... payment details
}, defaultSchemaOptions);
```

#### **User Schema**
```javascript
const userSchema = new Schema({
  userId: { type: Number, index: true },  // Numeric user ID for compatibility
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
  phone: { type: String, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ROLE_ENUM, default: 'customer', index: true },
  isActive: { type: Boolean, default: true, index: true },
  profilePhotoUrl: { type: String },
  lastLoginAt: { type: Date },
}, defaultSchemaOptions);
```
- **Role Enum:** `['customer', 'admin', 'mechanic', 'manager', 'support']`

---

## 2. AUTHENTICATION & USER CONTEXT

### Authentication Flow

**File:** [back-end/middleware/authMiddleware.js](back-end/middleware/authMiddleware.js)

```javascript
const auth = async (req, res, next) => {
  // Extracts Bearer token from Authorization header
  const token = authHeader.substring(7);  // Remove "Bearer "
  
  // Verifies JWT with secret "qweuansdasdg123123"
  const decoded = jwt.verify(token, "qweuansdasdg123123");
  
  // Looks up user by ObjectId: decoded.id
  const user = await db.collection("users").findOne({
    _id: new ObjectId(decoded.id)
  });
  
  // Attaches to req.user:
  req.user = {
    _id: ObjectId,
    userId: Number,
    email: String,
    fullName: String,
    phone: String,
    role: String,
    isActive: Boolean,
    // ... other user fields
  };
};
```

**Key Points:**
- **Token Storage (Frontend):** `localStorage.getItem('authToken')`
- **User Retrieval:** Call `authApi.me()` to get current authenticated user
- **Customer ID Can Be:** `user._id` (ObjectId), `user.userId` (numeric), or `user.id`
- **Scope Validation:** Controllers check `req.user` to scope data to authenticated customer

### Frontend Auth Context

**File:** [front-end/src/context/AuthContext.js](front-end/src/context/AuthContext.js)

```javascript
// Hook usage in components
const { user, isAuthenticated, logout } = useAuth();

// user object contains:
{
  _id: ObjectId string,
  userId: Number,
  email: String,
  fullName: String,
  phone: String,
  role: String
}
```

---

## 3. CUSTOMER BOOKING API ENDPOINTS

### File: [back-end/routes/bookingRoutes.js](back-end/routes/bookingRoutes.js)

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| **GET** | `/bookings` | ✅ Yes | Get authenticated user's bookings |
| **GET** | `/api/bookings/me` | ✅ Yes | Get my bookings (same as above) |
| **GET** | `/api/bookings/history/me` | ✅ Yes | Get completed service history |
| **GET** | `/bookings/:id` | ✅ Yes | Get single booking by ID |
| **POST** | `/bookings` | ✅ Yes | Create booking (authenticated user) |
| **POST** | `/api/bookings` | ❌ No | Create booking (public/unregistered) |
| **PUT** | `/bookings/:id/cancel` | ✅ Yes | Cancel booking |
| **PUT** | `/api/bookings/:id/cancel` | ✅ Yes | Cancel booking (variant) |
| **POST** | `/api/bookings/:id/reschedule` | ✅ Yes | Reschedule booking |
| **PUT** | `/api/bookings/:id/status` | ❌ No | Update booking status (admin) |
| **GET** | `/bookings/stats` | ❌ No | Get booking statistics |

### Create Authenticated Booking Endpoint

**Request (POST `/bookings`):**
```json
{
  "serviceId": 2,
  "serviceName": "General Service",
  "scheduledAt": "2026-03-02T10:00:00.000Z",
  "notes": "Optional notes",
  "vehicleNumber": "GJ01XY1234",
  "vehicleCompany": "Maruti",
  "vehicleModel": "Swift",
  "vehicleType": "Car"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Booking created",
  "data": {
    "id": 42,
    "userId": 101,
    "user_id": 101,
    "serviceId": 2,
    "serviceName": "General Service",
    "scheduledAt": "2026-03-02T10:00:00.000Z",
    "customerName": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "vehicleNumber": "GJ01XY1234",
    "status": "scheduled",
    "createdAt": "2026-03-20T10:00:00.000Z"
  }
}
```

### Get User Bookings Endpoint

**Request (GET `/api/bookings/me`):**
- No request body
- Requires Bearer token

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "userId": 101,
      "serviceId": 2,
      "serviceName": "General Service",
      "scheduledAt": "2026-03-02T10:00:00.000Z",
      "vehicleNumber": "GJ01XY1234",
      "status": "scheduled",
      // ... other fields
    }
    // ... more bookings
  ]
}
```

### Using the API from Frontend

**File:** [front-end/src/utils/apiService.js](front-end/src/utils/apiService.js)

```javascript
export const bookingApi = {
  listAll: () => apiGet('/api/bookings'),
  listMine: () => apiGet('/api/bookings/me'),
  listHistory: () => apiGet('/api/bookings/history/me'),
  createAuthenticated: (payload) => apiPost('/bookings', payload),
  createPublic: (payload) => apiPost('/api/bookings', payload, { auth: false }),
  cancel: (id) => apiPut(`/api/bookings/${id}/cancel`),
  reschedule: (id, payload) => apiPost(`/api/bookings/${id}/reschedule`, payload),
  getStats: () => apiGet('/bookings/stats', { auth: false }),
  updateStatus: (id, payload) => apiPut(`/api/bookings/${id}/status`, payload),
  delete: (id) => apiDelete(`/api/bookings/${id}`),
};
```

---

## 4. BILLING / INVOICE API ENDPOINTS

### File: [back-end/routes/billingRoutes.js](back-end/routes/billingRoutes.js)

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| **POST** | `/api/billing/create` | ❌ No | Create billing record |
| **GET** | `/api/billing/me` | ✅ Yes | Get authenticated user's invoices |
| **GET** | `/api/billing/user/:userId` | ❌ No | Get invoices for specific user |
| **GET** | `/api/billing/:invoiceNumber` | ❌ No | Get single invoice details |
| **PUT** | `/api/billing/:invoiceNumber` | ❌ No | Update invoice |
| **GET** | `/api/billing/customers/registered` | ❌ No | List all registered customers (admin) |
| **GET** | `/api/billing/customers/registered/:userId` | ❌ No | Get customer profile & history |
| **POST** | `/api/billing/refund` | ❌ No | Create refund |
| **PATCH** | `/api/billing/verify/:invoiceNumber` | ❌ No | Verify/confirm payment |

### Create Billing Record

**Request (POST `/api/billing/create`):**
```json
{
  "customerType": "registered",  // or "offline"
  "userId": "101",
  "currency": "INR",
  "lineItems": [
    {
      "name": "Service Name",
      "itemType": "service",
      "quantity": 1,
      "price": 2499
    }
  ],
  "serviceCharge": 0,
  "discount": 0,
  "gst": 449,
  "paymentMethod": "online"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "invoiceNumber": "INV-1001",
    "userId": "101",
    "customerDetails": {
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com"
    },
    "lineItems": [ { "name": "...", "quantity": 1, "price": 2499, "total": 2499 } ],
    "subtotal": 2499,
    "serviceCharge": 0,
    "discount": 0,
    "gst": 449,
    "finalTotal": 2948,
    "status": "issued",
    "paymentStatus": "pending",
    "currency": "INR",
    "createdAt": "2026-03-20T10:00:00.000Z"
  }
}
```

### Using the API from Frontend

**File:** [front-end/src/utils/apiService.js](front-end/src/utils/apiService.js)

```javascript
export const billingApi = {
  create: (payload) => apiPost('/api/billing/create', payload),
  listByUser: (userId) => apiGet(`/api/billing/user/${userId}`),
  listMine: () => apiGet('/api/billing/me'),
  listAll: (queryString = '') => apiGet(`/api/billing/all${queryString ? `?${queryString}` : ''}`),
  getByInvoice: (invoiceNumber) => apiGet(`/api/billing/${invoiceNumber}`),
  update: (invoiceNumber, payload) => apiPut(`/api/billing/${invoiceNumber}`, payload),
  refund: (payload) => apiPost('/api/billing/refund', payload),
  verify: (invoiceNumber) => apiPatch(`/api/billing/verify/${invoiceNumber}`),
};
```

---

## 5. FRONTEND COMPONENTS

### Customer Dashboard

**File:** [front-end/src/components/CustomerDashboard.jsx](front-end/src/components/CustomerDashboard.jsx)

**Key Features:**
- Displays tabs: Overview, Service History, Bookings, Services, Packages, Billing, Profile
- Shows upcoming bookings with status
- Shows completed service history
- Shows active packages subscriptions
- Profile photo upload support
- Loads data from APIs:
  - `servicesApi.list()` → Browse services
  - `bookingApi.listMine()` → User's upcoming bookings
  - `bookingApi.listHistory()` → User's service history
  - `packagesApi.getMyPackages()` → User's packages

**Component Tabs:**
```javascript
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'history', label: 'Service History' },
  { id: 'bookings', label: 'My Bookings' },
  { id: 'new-booking', label: 'New Booking' },
  { id: 'breakdown', label: 'Breakdown' },
  { id: 'billing', label: 'Billing' },
  { id: 'profile', label: 'Profile' },
];
```

### Customer Billing History

**File:** [front-end/src/components/CustomerBillingHistory.jsx](front-end/src/components/CustomerBillingHistory.jsx)

**Key Features:**
- Displays customer's billing records in Mantine data table
- Columns: Invoice Number, Service, Amount, Payment Method, Status, Payment Date
- Filters: By payment status (all, completed, pending), by date range (7 days, 30 days, 90 days, 1 year)
- Statistics: Total billings, total amount, completed/pending payments, total refunds
- PDF invoice download functionality
- Data loaded from `BillingContext`:
  ```javascript
  const { billingRecords, fetchUserBillingRecords, loading } = useBilling();
  ```

**Normalized Billing Record Properties:**
```javascript
{
  invoiceNumber: "INV-1001",
  serviceName: "General Service",
  totalAmount: 2948,
  paymentMethod: "online",
  paymentStatus: "pending",  // completed, pending, refunded
  paymentDate: "2026-03-20",
  subtotal: 2499,
  serviceCharge: 0,
  discount: 0,
  gst: 449,
  finalTotal: 2948,
  customerType: "registered",
  customerDetails: { name, phone, email },
  vehicleDetails: { number, model, company },
  lineItems: [ { name, quantity, price, total } ]
}
```

### Booking Wizard Component

**File:** [front-end/src/components/BookingWizard.jsx](front-end/src/components/BookingWizard.jsx)

**Flow:**
1. Select service from list
2. Pick service date → Check available slots
3. Enter vehicle details
4. Add notes/preferences
5. Review booking summary
6. Submit booking → `bookingApi.createAuthenticated(payload)`

### Service Booking Component

**File:** [front-end/src/components/ServiceBooking.jsx](front-end/src/components/ServiceBooking.jsx)

- Displays single service detail
- Shows "Book Now" button
- Launches BookingWizard modal

---

## 6. SERVICES API & CATALOG

### File: [back-end/routes/servicesRoutes.js](back-end/routes/servicesRoutes.js)

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| **GET** | `/services` | ❌ No | List all services |
| **GET** | `/services/:id` | ❌ No | Get service details |
| **POST** | `/services` | ✅ Yes (admin) | Create service |
| **PUT** | `/services/:id` | ✅ Yes (admin) | Update service |
| **DELETE** | `/services/:id` | ✅ Yes (admin) | Delete service |

### Frontend Services API

```javascript
export const servicesApi = {
  list: () => apiGet('/api/services', { auth: false }),
  getById: (id) => apiGet(`/api/services/${id}`, { auth: false }),
  create: (payload) => apiPost('/api/services', payload),
  update: (id, payload) => apiPut(`/api/services/${id}`, payload),
  delete: (id) => apiDelete(`/api/services/${id}`),
};
```

### Service Response Structure

```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "General Service",
    "description": "Complete vehicle checkup",
    "category": "maintenance",
    "basePrice": 1499,
    "estimatedDurationMinutes": 60,
    "active": true,
    "createdAt": "2026-03-20T10:00:00.000Z"
  }
}
```

---

## 7. VEHICLE MANAGEMENT

### Vehicle Schema

```javascript
const vehicleSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  plate: { type: String, required: true, trim: true, uppercase: true },
  make: { type: String, required: true, trim: true },      // Company
  model: { type: String, required: true, trim: true },     // Model
  year: { type: Number, required: true, min: 1980, max: 2100 },
  color: { type: String, trim: true },
  fuelType: { type: String, trim: true },
  odometerKm: { type: Number, min: 0 },
  isPrimary: { type: Boolean, default: false },
}, defaultSchemaOptions);
```

### Vehicle API Endpoints

```javascript
export const vehiclesApi = {
  listAll: async (queryString = '') => { /* ... */ },
  listMine: () => apiGet('/api/vehicles/me'),
  listByUser: (userId) => apiGet(`/api/vehicles/user/${userId}`),
  create: (payload) => apiPost('/vehicles', payload),
  getById: (id) => apiGet(`/vehicles/${id}`),
  update: (id, payload) => apiPut(`/vehicles/${id}`, payload),
  delete: (id) => apiDelete(`/vehicles/${id}`),
};
```

---

## 8. API CLIENT SETUP

### File: [front-end/src/utils/apiClient.js](front-end/src/utils/apiClient.js)

```javascript
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

export const AUTH_TOKEN_STORAGE_KEY = 'authToken';

// Helper functions
export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
export const setAuthToken = (token) => localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

// Request building
const buildHeaders = (headers = {}, auth = true) => {
  const token = getAuthToken();
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };
  if (auth && token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }
  return baseHeaders;
};
```

### Request Pattern

```javascript
// Basic GET (with auth)
apiGet('/api/bookings/me')
  // Builds: Authorization: Bearer <token>

// POST with payload
apiPost('/bookings', { serviceId: 2, scheduledAt: '...' })
  // Builds: Authorization: Bearer <token>

// Public request (no auth)
apiGet('/api/services', { auth: false })
  // No Authorization header
```

---

## 9. BILLING CONTEXT (Frontend State Management)

### File: [front-end/src/context/BillingContext.js](front-end/src/context/BillingContext.js)

```javascript
const { billingRecords, fetchUserBillingRecords, loading, error } = useBilling();

// Fetch user's billing records
const records = await fetchUserBillingRecords(user?.id);

// Create billing record
const created = await createBillingRecord(paymentData, userId, bookingId);

// Update billing record
const updated = await updateBillingRecord(invoiceNumber, { status: 'paid' });
```

---

## 10. KEY FLOW: How Customer Books a Service & Gets Invoiced

### 1. **Authenticate User**
```
User logs in → POST /auth/login
→ JWT token returned
→ Stored in localStorage
→ AuthContext updates user state
```

### 2. **Browse Services**
```
Customer visits /services
→ GET /api/services (no auth needed)
→ ServiceCatalog displays list
→ Click "Book Now" on service
```

### 3. **Create Booking**
```
BookingWizard opens
→ User selects date, enters vehicle info, adds notes
→ POST /bookings (authenticated)
  payload: { serviceId, scheduledAt, vehicleNumber, ... }
→ Booking created with status: "scheduled"
→ Booking appears in "Upcoming Bookings"
```

### 4. **Create Invoice**
```
After booking created
→ BillingContext.createBillingRecord()
→ POST /api/billing/create
  payload: { userId, lineItems, gst, ... }
→ Invoice generated (status: "issued", paymentStatus: "pending")
```

### 5. **View Billing History**
```
Customer goes to "Billing" tab
→ CustomerBillingHistory loads
→ GET /api/billing/me (authenticated)
→ Displays invoices table with filters
→ Can download PDF or mark as paid
```

### 6. **Verify Payment**
```
Admin marks payment received
→ PATCH /api/billing/verify/:invoiceNumber
→ Invoice status changes to "paid"
```

---

## 11. DATABASE SAMPLE DATA

### Sample Service
```json
{
  "_id": ObjectId("..."),
  "id": 2,
  "name": "General Service",
  "description": "Oil change, filter replacement, fluid top-up",
  "category": "maintenance",
  "basePrice": 1499,
  "estimatedDurationMinutes": 60,
  "active": true,
  "createdAt": "2026-03-20T10:00:00.000Z",
  "updatedAt": "2026-03-20T10:00:00.000Z"
}
```

### Sample Booking
```json
{
  "_id": ObjectId("..."),
  "id": 42,
  "userId": 101,
  "user_id": 101,
  "serviceId": 2,
  "serviceName": "General Service",
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "vehicleNumber": "GJ01XY1234",
  "vehicleCompany": "Maruti",
  "vehicleModel": "Swift",
  "status": "scheduled",
  "scheduledAt": "2026-03-25T10:00:00.000Z",
  "notes": "Regular maintenance",
  "amount": 1499,
  "createdAt": "2026-03-20T10:00:00.000Z",
  "updatedAt": "2026-03-20T10:00:00.000Z"
}
```

### Sample Invoice
```json
{
  "_id": ObjectId("..."),
  "invoiceNumber": "INV-1001",
  "userId": "101",
  "bookingId": ObjectId("..."),
  "customerType": "registered",
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210"
  },
  "vehicleDetails": {
    "number": "GJ01XY1234",
    "model": "Swift",
    "company": "Maruti"
  },
  "lineItems": [
    {
      "name": "General Service",
      "itemType": "service",
      "quantity": 1,
      "price": 1499,
      "total": 1499
    }
  ],
  "subtotal": 1499,
  "serviceCharge": 0,
  "discount": 0,
  "gst": 449,
  "finalTotal": 2948,
  "status": "issued",
  "paymentStatus": "pending",
  "currency": "INR",
  "createdAt": "2026-03-20T10:00:00.000Z",
  "updatedAt": "2026-03-20T10:00:00.000Z"
}
```

---

## 12. IMPORTANT FILES REFERENCE MAP

| Feature | Backend | Frontend |
|---------|---------|----------|
| **Bookings** | [controlled/bookingController.js](back-end/controllers/bookingController.js) | [components/CustomerDashboard.jsx](front-end/src/components/CustomerDashboard.jsx) |
| **Billing** | [controllers/billingController.js](back-end/controllers/billingController.js) | [components/CustomerBillingHistory.jsx](front-end/src/components/CustomerBillingHistory.jsx) |
| **Services** | [controllers/servicesController.js](back-end/controllers/servicesController.js) | [components/ServiceCatalog.jsx](front-end/src/components/ServiceCatalog.jsx) |
| **Auth** | [middleware/authMiddleware.js](back-end/middleware/authMiddleware.js) | [context/AuthContext.js](front-end/src/context/AuthContext.js) |
| **API Routes** | [routes/bookingRoutes.js](back-end/routes/bookingRoutes.js) [billingRoutes.js](back-end/routes/billingRoutes.js) | [utils/apiService.js](front-end/src/utils/apiService.js) |
| **Models** | [models/index.js](back-end/models/index.js) | — |

---

## 13. KEY TAKEAWAYS FOR DEVELOPMENT

✅ **Customer ID Resolution:**
- From `req.user._id` (ObjectId) after JWT authentication
- Or from `req.user.userId` (numeric ID) stored in database
- Frontend gets it from `useAuth()` hook: `user._id` or `user.userId`

✅ **Scoping Queries:**
- All booking queries scoped to `userId` in booking controller
- All billing queries scoped to `userId` in billing controller
- Use `resolveAuthUserFilter(req.user)` for flexible ID matching

✅ **Invoice Format:**
- Generated with `invoiceNumber` pattern: `INV-{sequence}`
- Can include multiple line items (services/parts)
- Calculates: `finalTotal = subtotal + gst - discount + serviceCharge`

✅ **Booking Statuses:**
- Customer creates → `pending` or `scheduled`
- Admin can update → `in-progress` → `completed`
- Customer can cancel → `canceled`
- No-show if missed → `no-show`

✅ **Token Flow:**
- Frontend stores in `localStorage['authToken']`
- Every API request adds `Authorization: Bearer {token}` header
- Backend validates with `jwt.verify()` and extracts `user._id`
- Never send user ID from frontend for authenticated endpoints!
