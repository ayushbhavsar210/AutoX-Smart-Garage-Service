# AutoX Backend + MongoDB Architecture Review (Production-Ready)

## 1) Frontend Review (Forms, API Integration, Validation)

### A. Form/API integration status

Current frontend forms are mostly **local-state/localStorage simulation** and not connected to backend APIs.

- Connected conditionally:
  - `front-end/src/components/contact.jsx` → calls `REACT_APP_CONTACT_ENDPOINT` only if env var exists.
- Local/mock (no real API call):
  - `front-end/src/components/Register.jsx`
  - `front-end/src/components/AdminLogin.jsx`
  - `front-end/src/components/BookService.jsx`
  - `front-end/src/components/ServiceBooking.jsx`
  - `front-end/src/components/BookingWizard.jsx`
  - `front-end/src/components/BreakdownRequest.jsx`
  - `front-end/src/components/BreakdownCall.jsx`
  - `front-end/src/components/RepairSchedule.jsx`
  - `front-end/src/components/RepairStatus.jsx`
  - `front-end/src/components/ModsQuote.jsx`

### B. Validation gaps in frontend forms

- `Register.jsx`: basic checks exist, but OTP is generated and verified entirely client-side.
- `BookService.jsx` / `ServiceBooking.jsx`: HTML `required` only; no strict phone/plate/date business rules.
- `BreakdownRequest.jsx` / `RepairSchedule.jsx`: only required attributes, no regex/range checks.
- `contact.jsx`: no explicit field shape checks before submission other than browser input types.

### C. Backend data structures required by frontend forms

To support current UX flows end-to-end, backend should accept/normalize these domain payloads:

- Registration/Auth: `{ fullName, email, phone, password, role? }`
- Vehicle: `{ userId, plate, make, model, year, fuelType?, color? }`
- Booking: `{ userId?, vehicleId?, serviceId?, customerName, phone, email?, scheduledAt/date+timeSlot, notes? }`
- Breakdown: `{ userId?, vehicleId?, location, coordinates?, description?, phone }`
- Repair schedule/status: `{ userId?, vehicle, registration?, preferredDate, preferredTime, pickupDrop, issue? }`
- Mod quote/order: `{ userId, modId, vehicleId?, additionalNotes?, quotePrice?, scheduleDate? }`
- Contact: `{ name, email, phone?, service?, message }`

---

## 2) Backend Review (Routes, Validation, Security, Error Handling)

### A. Route/API structure observations

- Routes are mounted at root (`app.use('/', routes)`), resulting in mixed naming styles:
  - `/auth/*`, `/users/*`, `/bookings/*`, `/api/bookings/*`, etc.
- There are functional aliases for many resources.
- Most controllers use MongoDB native driver and manual numeric IDs (`id`, `userId`) mixed with Mongo `_id`.

### B. Request/response structure issues

- Response shape is mostly `{ success, message?, data? }` but not strictly uniform.
- ID strategy is inconsistent:
  - Some endpoints use numeric IDs (`bookings`, `vehicles`, `services`).
  - `users/:id` uses Mongo ObjectId in controller.
- Public create endpoints accept broad payloads and persist values directly.

### C. Missing backend validations

High-priority gaps:

1. Missing auth on admin-sensitive routes
- Services CRUD, inventory, settings, analytics/reporting, billing/payment operations are not role-protected.

2. Incomplete semantic validation
- Date fields, enum states, currency codes, coordinate ranges, and plate/phone formats are weakly validated.

3. Mass-assignment risks
- Several update/create operations use `req.body` too broadly (overposting risk).

4. Inconsistent validator coverage
- Some alias routes skip validation middleware.

### D. Security risks

Critical:
- Passwords stored/compared as plaintext.
- JWT secret falls back to `dev-secret` if env missing.
- OTP/reset tokens returned in API responses.
- No role-based authorization enforcement for privileged operations.
- No request throttling/rate-limiting on auth and sensitive endpoints.

High:
- Payment verification lacks strong cryptographic signature verification flow.
- PII leakage risk from unauthenticated list endpoints.
- Base64 uploads in DB can cause bloat/DoS without size constraints.

### E. Error handling review

- Central `errorMiddleware` exists and gives consistent JSON error envelope.
- Controllers usually `try/catch` + `next(error)`.
- Improvement needed:
  - Structured error codes (`code`, `details`) for clients.
  - Request correlation IDs and audit logs.
  - Distinct operational vs programmer error handling.

---

## 3) Complete MongoDB Architecture

## A. Required collections

1. users
2. otp_codes
3. password_resets
4. vehicles
5. services
6. bookings
7. mechanics
8. assignments
9. breakdown_calls
10. repairs
11. inventory_parts
12. part_orders
13. modifications
14. mod_quotes
15. mod_orders
16. billing_records
17. payments
18. packages
19. package_renewals
20. notifications
21. notification_logs
22. contact_submissions
23. upload_assets
24. settings
25. locations
26. service_rates
27. reports
28. report_schedules
29. reviews

## B/C/D. Schema structures (type + required/optional)

### 1) users
- `_id`: ObjectId (required)
- `userId`: Number (optional, legacy external ID)
- `fullName`: String (required)
- `email`: String (required, unique)
- `phone`: String (optional)
- `passwordHash`: String (required)
- `role`: String enum (required, default `customer`)
- `isActive`: Boolean (required, default `true`)
- `profilePhotoUrl`: String (optional)
- `lastLoginAt`: Date (optional)
- `createdAt`, `updatedAt`: Date (required)

### 2) otp_codes
- `_id`: ObjectId (required)
- `userId`: ObjectId (optional)
- `email`: String (optional)
- `phone`: String (optional)
- `otpHash`: String (required)
- `purpose`: String enum (required)
- `used`: Boolean (required)
- `expiresAt`: Date (required, TTL)
- `verifiedAt`: Date (optional)
- `createdAt`, `updatedAt`: Date (required)

### 3) password_resets
- `_id`: ObjectId (required)
- `userId`: ObjectId (required)
- `tokenHash`: String (required, unique)
- `used`: Boolean (required)
- `expiresAt`: Date (required, TTL)
- `usedAt`: Date (optional)
- `createdAt`, `updatedAt`: Date (required)

### 4) vehicles
- `_id`: ObjectId (required)
- `userId`: ObjectId (required)
- `plate`: String (required, unique)
- `make`: String (required)
- `model`: String (required)
- `year`: Number (required)
- `color`: String (optional)
- `fuelType`: String (optional)
- `odometerKm`: Number (optional)
- `isPrimary`: Boolean (required)
- `createdAt`, `updatedAt`: Date (required)

### 5) services
- `_id`: ObjectId (required)
- `serviceCode`: String (required, unique)
- `name`: String (required)
- `description`: String (optional)
- `category`: String (required)
- `basePrice`: Number (required)
- `estimatedDurationMinutes`: Number (optional)
- `active`: Boolean (required)
- `createdAt`, `updatedAt`: Date (required)

### 6) bookings
- `_id`: ObjectId (required)
- `bookingNo`: String (required, unique)
- `userId`: ObjectId (optional for guest booking)
- `vehicleId`: ObjectId (optional)
- `serviceId`: ObjectId (optional)
- `customerName`: String (required)
- `email`: String (optional)
- `phone`: String (optional)
- `vehicleNumber`: String (optional)
- `scheduledAt`: Date (required)
- `notes`: String (optional)
- `amount`: Number (required/default)
- `status`: String enum (required)
- `canceledAt`: Date (optional)
- `statusUpdatedAt`: Date (optional)
- `previousScheduledAt`: Date (optional)
- `rescheduledAt`: Date (optional)
- `createdAt`, `updatedAt`: Date (required)

### 7) mechanics
- `_id`: ObjectId (required)
- `mechanicCode`: String (required, unique)
- `fullName`: String (required)
- `phone`: String (required)
- `expertise`: [String] (optional)
- `yearsExperience`: Number (optional)
- `rating`: Number (required/default)
- `availability`: Boolean (required)
- `status`: String enum (required)
- `assignedJobs`: Number (required/default)
- `currentLocation.lat`: Number (optional)
- `currentLocation.lng`: Number (optional)
- `currentLocation.updatedAt`: Date (optional)
- `createdAt`, `updatedAt`: Date (required)

### 8) assignments
- `_id`: ObjectId (required)
- `bookingId`: ObjectId (required)
- `mechanicId`: ObjectId (required)
- `notes`: String (optional)
- `status`: String enum (required)
- `progress[]`: Array of `{ status:String, note?:String, at:Date }` (optional)
- `createdAt`, `updatedAt`: Date (required)

### 9) breakdown_calls
- `_id`: ObjectId (required)
- `ticketNo`: String (required, unique)
- `userId`: ObjectId (optional)
- `vehicleId`: ObjectId (optional)
- `location`: String (required)
- `coordinates`: GeoJSON Point (optional)
- `description`: String (optional)
- `status`: String enum (required)
- `assignedMechanicId`: ObjectId (optional)
- `etaMinutes`: Number (optional)
- `createdAt`, `updatedAt`: Date (required)

### 10) repairs
- `_id`: ObjectId (required)
- `repairNo`: String (required, unique)
- `userId`: ObjectId (optional)
- `bookingId`: ObjectId (optional)
- `name`: String (required)
- `phone`: String (required)
- `email`: String (optional)
- `vehicle`: String (required)
- `registration`: String (optional)
- `preferredDate`: Date (required)
- `preferredTime`: String (required)
- `pickupDrop`: Boolean (required/default)
- `issue`: String (optional)
- `status`: String enum (required)
- `eta`: String (optional)
- `lastUpdate`: String (optional)
- `createdAt`, `updatedAt`: Date (required)

### 11) inventory_parts
- `_id`: ObjectId (required)
- `sku`: String (required, unique)
- `name`: String (required)
- `category`: String (required)
- `price`: Number (required)
- `stock`: Number (required)
- `minStock`: Number (required/default)
- `active`: Boolean (required/default)
- `createdAt`, `updatedAt`: Date (required)

### 12) part_orders
- `_id`: ObjectId (required)
- `orderNo`: String (required, unique)
- `partId`: ObjectId (required)
- `quantity`: Number (required)
- `supplier`: String (required)
- `status`: String enum (required)
- `expectedDelivery`: Date (optional)
- `createdAt`, `updatedAt`: Date (required)

### 13) modifications
- `_id`: ObjectId (required)
- `modCode`: String (required, unique)
- `name`: String (required)
- `description`: String (optional)
- `basePrice`: Number (required)
- `active`: Boolean (required/default)
- `createdAt`, `updatedAt`: Date (required)

### 14) mod_quotes
- `_id`: ObjectId (required)
- `quoteNo`: String (required, unique)
- `userId`: ObjectId (required)
- `modId`: ObjectId (required)
- `vehicleId`: ObjectId (optional)
- `additionalNotes`: String (optional)
- `quotePrice`: Number (optional)
- `status`: String enum (required)
- `createdAt`, `updatedAt`: Date (required)

### 15) mod_orders
- `_id`: ObjectId (required)
- `orderNo`: String (required, unique)
- `modQuoteId`: ObjectId (required)
- `userId`: ObjectId (required)
- `scheduleDate`: Date (optional)
- `status`: String enum (required)
- `createdAt`, `updatedAt`: Date (required)

### 16) billing_records
- `_id`: ObjectId (required)
- `invoiceNumber`: String (required, unique)
- `userId`: ObjectId (required)
- `bookingId`: ObjectId (optional)
- `amount`: Number (required)
- `currency`: String (required, ISO code)
- `status`: String enum (required)
- `verified`: Boolean (required)
- `verifiedAt`: Date (optional)
- `refundReason`: String (optional)
- `refundedAt`: Date (optional)
- `createdAt`, `updatedAt`: Date (required)

### 17) payments
- `_id`: ObjectId (required)
- `paymentId`: String (required, unique)
- `userId`: ObjectId (required)
- `bookingId`: ObjectId (optional)
- `invoiceId`: ObjectId (optional)
- `amount`: Number (required)
- `method`: String (required)
- `status`: String enum (required)
- `gatewayProvider`: String (required/default)
- `gatewayPaymentId`: String (optional)
- `gatewayOrderId`: String (optional)
- `gatewaySignature`: String (optional, sensitive)
- `verifiedAt`: Date (optional)
- `refundedAt`: Date (optional)
- `refundReason`: String (optional)
- `createdAt`, `updatedAt`: Date (required)

### 18) packages
- `_id`: ObjectId (required)
- `packageCode`: String (required, unique)
- `userId`: ObjectId (required)
- `status`: String enum (required)
- `startedAt`: Date (required)
- `expiresAt`: Date (optional)
- `lastRenewedAt`: Date (optional)
- `createdAt`, `updatedAt`: Date (required)

### 19) package_renewals
- `_id`: ObjectId (required)
- `renewalNo`: String (required, unique)
- `packageId`: ObjectId (required)
- `userId`: ObjectId (required)
- `amount`: Number (required/default)
- `paymentMethod`: String (required/default)
- `status`: String enum (required/default)
- `renewedAt`: Date (required)
- `createdAt`, `updatedAt`: Date (required)

### 20) notifications
- `_id`: ObjectId (required)
- `userId`: ObjectId (required)
- `title`: String (required)
- `message`: String (required)
- `type`: String enum (required/default)
- `read`: Boolean (required/default)
- `readAt`: Date (optional)
- `createdAt`, `updatedAt`: Date (required)

### 21) notification_logs
- `_id`: ObjectId (required)
- `channel`: String enum (required)
- `userId`: ObjectId (optional)
- `email`: String (optional)
- `phoneNumber`: String (optional)
- `subject`: String (optional)
- `message`: String (required)
- `status`: String enum (required/default)
- `sentAt`: Date (optional)
- `createdAt`, `updatedAt`: Date (required)

### 22) contact_submissions
- `_id`: ObjectId (required)
- `name`: String (required)
- `email`: String (required)
- `phone`: String (optional)
- `service`: String (optional)
- `message`: String (required)
- `status`: String enum (required/default)
- `createdAt`, `updatedAt`: Date (required)

### 23) upload_assets
- `_id`: ObjectId (required)
- `userId`: ObjectId (required)
- `type`: String (required)
- `fileName`: String (required)
- `mimeType`: String (required)
- `sizeBytes`: Number (optional)
- `storageProvider`: String (required/default)
- `storagePath`: String (required)
- `publicUrl`: String (required)
- `createdAt`, `updatedAt`: Date (required)

### 24) settings
- `_id`: ObjectId (required)
- `key`: String (required, unique)
- `value`: Mixed (required)
- `description`: String (optional)
- `createdAt`, `updatedAt`: Date (required)

### 25) locations
- `_id`: ObjectId (required)
- `locationCode`: String (required, unique)
- `name`: String (required)
- `address`: String (required)
- `city`: String (required)
- `state`: String (optional)
- `country`: String (required/default)
- `coordinates`: GeoJSON Point (optional)
- `active`: Boolean (required/default)
- `createdAt`, `updatedAt`: Date (required)

### 26) service_rates
- `_id`: ObjectId (required)
- `rateCode`: String (required, unique)
- `category`: String (required)
- `baseRate`: Number (required)
- `unit`: String enum (required/default)
- `active`: Boolean (required/default)
- `createdAt`, `updatedAt`: Date (required)

### 27) reports
- `_id`: ObjectId (required)
- `reportId`: String (required, unique)
- `reportType`: String (required)
- `periodStart`: Date (required)
- `periodEnd`: Date (required)
- `generatedBy`: ObjectId (optional)
- `summary`: Mixed (optional)
- `downloadUrl`: String (optional)
- `createdAt`, `updatedAt`: Date (required)

### 28) report_schedules
- `_id`: ObjectId (required)
- `reportType`: String (required)
- `frequency`: String enum (required)
- `email`: String (required)
- `status`: String enum (required/default)
- `nextRun`: Date (required)
- `createdAt`, `updatedAt`: Date (required)

### 29) reviews
- `_id`: ObjectId (required)
- `userId`: ObjectId (required)
- `bookingId`: ObjectId (optional)
- `rating`: Number (required)
- `comment`: String (optional)
- `createdAt`, `updatedAt`: Date (required)

## E. Relationships between collections

- `users` 1:N `vehicles`
- `users` 1:N `bookings`
- `services` 1:N `bookings`
- `vehicles` 1:N `bookings` (optional for guest)
- `bookings` 1:1 or 1:N `assignments`
- `mechanics` 1:N `assignments`
- `users` 1:N `billing_records`
- `bookings` 1:N `billing_records`
- `billing_records` 1:N `payments`
- `users` 1:N `notifications`
- `users` 1:N `contact_submissions`
- `users` 1:N `upload_assets`
- `users` 1:N `packages`
- `packages` 1:N `package_renewals`
- `modifications` 1:N `mod_quotes`
- `mod_quotes` 1:1 or 1:N `mod_orders`
- `inventory_parts` 1:N `part_orders`

## F. Indexing suggestions

Must-have indexes:

- Users: `{ email: 1 } unique`, `{ phone: 1 }`, `{ role: 1, isActive: 1 }`
- Bookings: `{ userId: 1, createdAt: -1 }`, `{ status: 1, scheduledAt: 1 }`, `{ bookingNo: 1 } unique`
- Vehicles: `{ userId: 1, plate: 1 } unique`, `{ plate: 1 } unique`
- Billing: `{ invoiceNumber: 1 } unique`, `{ userId: 1, createdAt: -1 }`, `{ status: 1, verified: 1 }`
- Payments: `{ paymentId: 1 } unique`, `{ userId: 1, createdAt: -1 }`, `{ status: 1 }`
- Notifications: `{ userId: 1, read: 1, createdAt: -1 }`
- Breakdown: `2dsphere` index on `coordinates`
- OTP/Reset tokens: TTL on `expiresAt`

## G. Production-level improvements

1. Security
- Hash passwords (`bcrypt`), never store plaintext.
- Remove token/OTP value from API responses.
- Enforce strong JWT secret and secret rotation.
- Add RBAC middleware (`admin`, `manager`, `support`, `mechanic`).

2. Data integrity
- Move to ObjectId-based references as primary internal IDs.
- Keep old numeric IDs only as legacy `externalId` fields.
- Introduce schema-level enums and custom validators.

3. Reliability
- Add MongoDB transactions for multi-write flows:
  - booking + assignment,
  - payment + billing update,
  - package renewal + package status update.

4. Observability
- Add request ID, structured logs, audit logs, and security logs.
- Add API metrics (p95 latency, error rate, auth failures).

5. API quality
- Unify route prefixing (`/api/v1/*`).
- Standardize response contracts and error codes.

---

## 4) Mongoose Models Generated

Production-ready model definitions are created in:
- `back-end/models/index.js`

This file includes all core schemas listed above, with:
- required/optional field constraints,
- enums,
- indexes (unique, compound, geospatial, TTL),
- timestamps,
- password hashing helpers for `User`.

---

## 5) ER Diagram (Text Format)

```text
User ||--o{ Vehicle : owns
User ||--o{ Booking : places
Service ||--o{ Booking : selected_in
Vehicle ||--o{ Booking : used_for
Booking ||--o{ Assignment : has
Mechanic ||--o{ Assignment : receives
Booking ||--o{ BillingRecord : billed_as
BillingRecord ||--o{ Payment : paid_by
User ||--o{ Notification : receives
User ||--o{ UploadAsset : uploads
User ||--o{ ContactSubmission : submits
User ||--o{ Package : subscribes
Package ||--o{ PackageRenewal : renewed_by
User ||--o{ BreakdownCall : requests
Vehicle ||--o{ BreakdownCall : involved
Mechanic ||--o{ BreakdownCall : assigned_to
User ||--o{ ModQuote : requests
Modification ||--o{ ModQuote : quoted_for
ModQuote ||--o{ ModOrder : converted_to
InventoryPart ||--o{ PartOrder : replenished_by
User ||--o{ Review : writes
Booking ||--o{ Review : rates
```

---

## 6) Optimization + Scalability (50,000+ users)

### Query and storage optimization
- Use pagination (`cursor` or `createdAt + _id`) on all list endpoints.
- Avoid base64 file storage in Mongo; use object storage (S3/Cloudinary) + URL references.
- Add projection in read-heavy endpoints to avoid over-fetching.
- Use partial indexes for active/status-based filters.

### Throughput and horizontal scale
- Introduce Redis for OTP/session/rate-limit cache and hot dashboard counters.
- Queue async work (email, SMS, report generation) via BullMQ/RabbitMQ.
- Read replicas for analytics/reporting workloads.
- Archive old notifications/logs/reports with retention policies.

### Reliability and governance
- Add idempotency keys for payment and booking create endpoints.
- Add optimistic locking/versioning for concurrent updates.
- Add backup/restore drills and PITR strategy.
- Add schema migration process (versioned migrations + backward-compatible deploys).
