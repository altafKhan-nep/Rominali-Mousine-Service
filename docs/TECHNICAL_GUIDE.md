# Ellicott City Airport Taxi — Technical Guide

*Documentation for engineering / development teams: architecture, setup, integration,
maintenance, and operations.*

---

## 1. Architecture Overview

Monorepo with two independent packages plus a docs folder:

```
ride-booking/
├── client/                  # React 18 + Vite SPA
├── server/                  # Express.js + Socket.io API
├── docs/                    # This documentation set
└── AGENTS.md                # Living developer guide (kept in sync with code)
```

```
Browser SPA (React + Vite)
   │  REST /api/*  (axios, Bearer JWT)          Socket.io (rooms)
   ▼                                             ▼
Express API  ─────────────►  Socket.io server (user:{id}, ride:{id}, drivers, admins)
   │
   ├── Passport (local / google / facebook / jwt)
   ├── Mongoose  ─────────►  MongoDB (geospatial 2dsphere, TTL indexes)
   ├── Nodemailer (SMTP) / Twilio (SMS) / web-push
   └── External: Nominatim (geocode), OSRM (routing)
```

### Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React 18, Vite 5, React Router v6, Tailwind CSS | Fast dev server, tree-shaken builds |
| Maps | Leaflet + react-leaflet, OpenStreetMap tiles | No API key |
| 3D hero | three.js + @react-three/fiber + @react-three/drei + GSAP | Lazy-loaded, ~266 KB gzip; procedural taxi with optional `/models/taxi.glb` override |
| Backend | Express 4, Socket.io 4 | Stateless (`session:false`) |
| DB | MongoDB + Mongoose 8 | Geospatial + TTL indexes |
| Auth | Passport.js (local, google-oauth20, facebook, jwt) | 15-min JWT access + opaque rotating refresh tokens |
| Email/SMS/Push | Nodemailer, Twilio, web-push | Fire-and-forget; console fallbacks in dev |
| Hardening | helmet, express-rate-limit, cors (strict) | See §7 |

---

## 2. Getting Started (Local Dev)

### Prerequisites
- Node.js 18+ (dev is on 25.x), npm
- MongoDB running locally (`mongodb://127.0.0.1:27017/ridetaxi`) or a Mongo Atlas URI
- (Optional) Google/Facebook OAuth client IDs, Twilio, SMTP, VAPID keys — app runs without them

### Install & run
```bash
# 1. Install both packages
cd client && npm install
cd ../server && npm install

# 2. Environment
cp server/.env.example server/.env     # edit: MONGO_URI, JWT secrets
cp client/.env.example client/.env     # edit: VITE_GOOGLE_CLIENT_ID, VITE_FACEBOOK_APP_ID

# 3. Seed test data (resets users + driver positions)
cd server && npm run seed

# 4. Run (two terminals)
cd client && npm run dev     # http://localhost:5173 (Vite proxies /api + /socket.io → :5001)
cd server && npm run dev     # http://localhost:5001 (nodemon)
```

> **macOS gotcha**: port `5000` is often taken by ControlCenter/AirPlay. The backend defaults
> to **5001**. If you change the port, update the Vite proxy targets in `client/vite.config.js`
> and `CLIENT_ORIGIN`/`APP_URL` in `server/.env`.

### Seed credentials

| Role | Email | Password |
|---|---|---|
| admin | `admin@ellicot.com` | `admin123` |
| passenger | `passenger@ellicot.com` | `pass123` |
| driver (Executive Sedan) | `alex@ellicot.com` | `driver123` |
| driver (Premium SUV) | `sam@ellicot.com` | `driver123` |

Driver `Location` docs are seeded near Howard County, MD (~39.20, -76.85). The `nearby
drivers` queries only return results once the seed (or driver location broadcasts) populate
`locations`.

### Key scripts
| Package | Script | Purpose |
|---|---|---|
| server | `dev` / `start` | nodemon / production start |
| server | `seed` | Reset users + driver positions |
| server | `lint` | ESLint (`eslint src`) |
| client | `dev` / `build` / `preview` | Vite dev / production build / preview |
| client | `lint` | ESLint (`eslint src`) |

---

## 3. Data Model (MongoDB)

All schemas in `server/src/models/`.

### User
```
{ _id, name, email, phone, password (bcrypt), role: passenger|driver|admin,
  avatar (base64 data-URL, ≤512 KB), emailVerified, isSuspended,
  pushSubscriptions: [{ endpoint, keys }], authProvider: local|google|facebook|phone,
  tokenVersion (incremented to revoke JWTs),
  verificationToken {token,expiresAt} (24h), resetToken {token,expiresAt} (1h),
  driverDetails: { vehicleType, plateNumber, licenseNo, isAvailable } }
```
- Statics: `findByEmail`, `findByPhone`, `findByLogin` (email-or-phone regex autodetect),
  all `.select('+password')`.
- `vehicleType` enum must match `client/src/data/vehicles.js` ids (used for matching + fares).

### Ride
```
{ passenger: ref, driver: ref|null,
  pickup/dropoff: { address, lat, lng },
  vehicleType (9 fleet ids), serviceType (10 slugs),
  passengerCount, bags,
  status: pending|accepted|arriving|in_progress|completed|cancelled,
  fare: { estimated, final, currency, distanceKm, durationMin },
  route: [{lat,lng}] (OSRM polyline), timestamps: { requested, accepted, arrived, started, completed, cancelled },
  payment: { method, status, transactionId }, rating: { score, comment, createdAt } }
```

### Location (driver positions)
```
{ driver (unique ref), coordinates: {type:'Point', coordinates:[lng,lat]},
  heading, speed, updatedAt }
```
- `2dsphere` index on `coordinates`; TTL index on `updatedAt` (expires after 10 min).

### RefreshToken (server-side sessions)
```
{ user, tokenHash (SHA-256 of opaque token), expiresAt (TTL), revokedAt, rememberMe, userAgent, ip }
```
- 30-day lifetime with `rememberMe`, else 7 days. Atomic rotation on every `/refresh`.

### OtpCode
```
{ phone (indexed), codeHash, expiresAt (TTL 10 min), attempts (max 5) }
```

### Payment
```
{ user, ride, amount, currency, method: card|wallet|cash,
  provider: stripe|sandbox|cash,
  status: pending|succeeded|failed|refunded|cash,
  transactionId (unique sparse), idempotencyKey (unique sparse),
  failureReason, cardLast4, refundedAt, refundTransactionId }
```
- **Cash**: `POST pay { method: "cash" }` records a no-charge payment (status/provider
  `cash`); never refundable; allowed even when `paymentsEnabled=false`.
- **Stripe** (when `STRIPE_SECRET_KEY` set): `POST /rides/:id/payment-intent` → confirm with
  the Payment Element → `POST pay { method: "card", paymentIntentId }` verifies the intent
  (status `succeeded` + amount) then records it (`pi_…`). Unconfirmed intents → 400.
  Payment Method Configuration is applied via `automatic_payment_methods`; do not pass the
  `pmd_…` domain id as `payment_method_configuration` (needs a `pmc_…` id).
- **Sandbox** (no Stripe key): card `0002` always declines, `0000` always succeeds, else
  ~95% success.
- A settled payment (succeeded **or** cash) for a ride is returned as-is (no double-charge);
  a repeated `idempotencyKey` → 409.
- `transactionId`/`idempotencyKey` are **sparse unique** — do NOT revert to non-sparse
  (duplicate-key crashes on pending/failed rows).

### Notification
```
{ user (indexed), type: ride|payment|account|system, title, message, data, read, readAt, createdAt }
```
- The **only persisted** record of a notify; external channels (email/SMS/push) are fire-and-forget.

### AppSetting
```
{ key (unique), value }
```
- Known keys: `baseFare`, `perKm`, `perMin` (fare overrides; `null` = built-in rates),
  `paymentsEnabled`, `supportPhone`, `supportEmail`. `GET /api/settings` exposes the public subset.

---

## 4. API Surface

All routes under `/api`; JSON body; auth via `Authorization: Bearer <accessToken>`.

### Auth (`/api/auth`)
| Endpoint | Purpose |
|---|---|
| `POST /register` | Register (email-or-phone, pw ≥6); auto-login; returns `verificationLink` in non-prod |
| `POST /login` | LocalStrategy via `identifier` (email or phone); `rememberMe` → 30d refresh |
| `POST /refresh` | **Rotates** opaque refresh token atomically (exactly-one-success on replays) |
| `POST /logout` | Revoke that device's session (auth required) |
| `GET /google`, `GET /facebook` (+ `/callback`) | OAuth2 redirect flow; issues tokens to SPA |
| `POST /otp/send`, `POST /otp/verify` | Phone sign-in (backend ready; frontend disabled) |
| `POST /verify-email`, `POST /resend-verification` | Email verification (24h tokens) |
| `POST /forgot-password`, `POST /reset-password` | Reset (1h token; bumps `tokenVersion`) |
| `GET /me` | Current profile |

### Rides / Payments / Users / Notifications / Drivers / Places / Settings
| Endpoint | Notes |
|---|---|
| `POST /rides` | Create; geocodes + OSRM + fare; **notifies nearby matching drivers (socket `ride:new`) and all admins** |
| `GET /rides`, `GET /rides/:id` | Role-filtered listing; detail |
| `PATCH /rides/:id` | Edit **while pending only**; re-geocodes + recomputes fare/route |
| `PATCH /rides/:id/accept` | Driver accepts (409 if no longer pending) |
| `PATCH /rides/:id/status` | Driver transitions arriving/in_progress/completed; sets `fare.final` |
| `PATCH /rides/:id/cancel` | Passenger or assigned driver |
| `POST /rides/:id/rate` | Rate a completed ride (passenger) |
| `POST /rides/:rideId/pay` | Settle: `{method:"cash"}` (no-charge) or `{method:"card", paymentIntentId}` (Stripe); idempotent |
| `POST /rides/:rideId/payment-intent` | Stripe PaymentIntent `{clientSecret, amount}` for the card tab (idempotent per ride) |
| `GET /payments`, `POST /payments/:id/refund` | Payment history; refund succeeded card payments (cash rejected) |
| `GET/PATCH /users/me`, `POST/DELETE /users/me/avatar`, `PATCH /users/me/password` | Profile |
| `GET /notifications`, `PATCH .../read`, `.../read-all`, `POST .../subscribe`, `.../unsubscribe` | In-app + web-push |
| `GET /drivers/nearby?lat&lng&radius&vehicleType` | Geospatial search (returns driver + coords) |
| `GET /drivers/:id/eta?toLat&toLng` | OSRM route + ETA from driver position |
| `PATCH /drivers/availability`, `POST /drivers/location`, `GET /drivers/stats` | Driver ops |
| `GET /places/search?q=` | Nominatim autocomplete |
| `GET /settings` | Public subset: `paymentsEnabled`, `supportPhone`, `supportEmail`, `vapidPublicKey` |

### Admin/CRM (`/api/admin`, guarded `protect + requireRole('admin')`)
| Endpoint | Purpose |
|---|---|
| `GET /rides`, `GET /drivers`, `GET /users`, `GET /payments` | Lists (pagination, search) |
| `PATCH /rides/:id/driver` | **Dispatch**: `{driverId}` assigns (status→accepted, socket+notify); `{driverId:null}` removes (→pending). Rejects suspended drivers, drivers already on an active ride (409), non-driver roles, and completed/cancelled rides |
| `PATCH /users/:id/suspend|unsuspend`, `DELETE /users/:id` | User lifecycle (admins protected; suspend revokes refresh tokens) |
| `GET /analytics`, `GET/PATCH /settings`, `PATCH /drivers/:id` | Ops: stats, settings, availability toggle |

---

## 5. Socket.io Protocol

Rooms: `user:{id}` (all users), `drivers` (drivers), `admins` (admins), `ride:{rideId}`.

> The client authenticates by passing `{ userId, role }` in `socket.auth` on connect;
> the server joins rooms from `socket.handshake.auth` (`server/src/config/socket.js`).

### Client → Server
| Event | Payload | Purpose |
|---|---|---|
| `authenticate` | `{userId, role}` | Join `user:{id}` (+ `drivers` / `admins`) |
| `ride:join` | `{rideId}` | Join `ride:{id}` room — authorized only for the ride's passenger, its assigned driver, or admins |
| `driver:location` | `{lat, lng, heading, speed}` | Driver position — server looks up active ride and forwards to that `ride:{id}` only (throttle client-side to 1/2 s) |
| `ride:cancel` | `{rideId}` | Client-triggered cancel (re-validated server-side) |

### Server → Client
| Event | Payload | Audience |
|---|---|---|
| `ride:new` | `{ride}` | **Nearby available drivers whose vehicle matches** (per-driver `user:{id}` rooms, 10 km) **and** all admins (`admins` room) — drives the driver request feed + admin board |
| `ride:update` | `{ride, status}` | `ride:{id}` room + `admins` room |
| `ride:driverFound` | `{driver, ride}` | `ride:{id}` (driver accepted or dispatched) |
| `ride:completed` | `{ride, fare}` | `ride:{id}` |
| `driver:location` | `{driverId, lat, lng, heading, speed}` | `ride:{id}` |
| `notification:new` | serialized notification | `user:{id}` (drives the alert bell) |

---

## 6. Integration & Extension Points

- **New vehicle/service types**: add to `client/src/data/vehicles.js` (fleet ids) and the
  matching enums in `server/src/models/{User,Ride}.js`; update fares in
  `rideService.estimateFare`. Ids must stay stable (stored on docs, used for matching).
- **Payment provider swap**: Stripe is live when `STRIPE_SECRET_KEY` is set
  (`paymentService.createPaymentIntent`/`processStripePayment`); otherwise the sandbox
  simulator is used. The `Payment` model + idempotency semantics carry over for any provider.
- **Real SMS/email**: set Twilio + SMTP env vars; dev falls back to console + returned codes.
- **Web push**: set VAPID keys (`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`); subscription endpoint
  already exists (`POST /api/notifications/subscribe`).
- **Driver dispatch**: REST `PATCH /api/admin/rides/:id/driver` + socket `ride:update`;
  UI in the admin Rides tab and the driver request feed (`client/src/pages/driver/Dashboard.jsx`).
- **Geocoding/routing**: `rideService.geocode` (Nominatim) + `rideService.getRoute` (OSRM) —
  free, keyless, network-dependent; both are rate-limited upstream.

---

## 7. Security & Operations

### Hardening (`server/src/index.js`)
- `helmet()` security headers; `express.json({ limit: '1mb' })`.
- Rate limits (all configurable via `RATE_LIMIT_*` env):
  - global API: default 600/15 min/IP (dev override `RATE_LIMIT_API=6000`)
  - auth endpoints: 60/15 min/IP (dev override `RATE_LIMIT_AUTH=600`)
  - login: **prod 10/15 min, dev 100/15 min** per IP (dev override `RATE_LIMIT_LOGIN=1000`)
  - OTP send: 5/10 min/IP (dev override `RATE_LIMIT_OTP=10`)
- Strict CORS to `CLIENT_ORIGIN` only. `TRUST_PROXY=true` when behind a reverse proxy
  (nginx/Render/Vercel) so `req.ip` and rate limits see the real client IP.

### Auth model
- 15-min access JWT `{id, role, v: tokenVersion}`; `protect` (Passport JWT) rejects stale
  `v` and suspended users (`ACCOUNT_SUSPENDED`).
- Opaque refresh tokens stored hashed (SHA-256) with atomic rotation — replaying a token
  yields exactly one success. Logout revokes one device; password reset revokes all + bumps
  `tokenVersion`. Admin suspend also revokes refresh sessions.
- All Passport strategies run `session:false` → stateless, horizontally scalable, no
  sticky sessions.

### Client auth flow
- `api.js` stores tokens **per role** (`rt_<role>_access/refresh`) with a per-tab
  active-role marker in `sessionStorage` — so admin/driver/passenger can be signed in
  simultaneously in different tabs without clobbering each other. On a fresh tab, the app
  restores the tab's role marker first, then falls back to any remembered session.
- A queued-refresh interceptor: on 401, in-flight requests wait, one `/refresh` rotates the
  token, then all retry. On refresh failure, storage is cleared and the user is redirected
  to `/login`.
- A `403 Insufficient permissions` (the active role's token is stale/wrong) also clears
  that role's storage and redirects to `/login`, so the SPA never lingers in a broken
  half-authenticated state.

### Known limitations
- Rate limits are **in-memory per instance** (use Redis or a shared store for multi-instance).
- Socket rooms are per-instance too — pair with sticky sessions or a Socket.io adapter (Redis)
  when horizontally scaling real-time.
- External geocoding/routing depends on free public services (Nominatim 1 req/s; OSRM).
- Email/SMS/push delivery is best-effort (fire-and-forget); the in-app Notification row is
  the source of truth.
- Web push requires VAPID keys configured, else `subscribe` returns 503.
- Avatar images are stored as base64 in Mongo (≤512 KB enforced).
- Stripe payments run in **test mode** with the current test keys — flip to live keys only
  when ready to take real money (and add a Stripe webhook/`CHECKOUT` handling for settlement
  edge cases in production).

---

## 8. Maintenance

### Common tasks
- **Reset demo data**: `cd server && npm run seed` (wipes + reseeds users and driver positions).
- **Add a driver**: admin Users tab or direct DB insert (`role: 'driver'`, `driverDetails`
  with `isAvailable: true`); seed a `Location` doc or have them go online to broadcast.
- **Update fares**: Admin → Settings (`baseFare`, `perKm`, `perMin`) or edit `estimateFare`.
- **Toggle payments**: Admin → Settings → `paymentsEnabled`. When off, `paymentService`
  returns 403 and the UI shows a disable notice.
- **Cleanup is automatic**: expired refresh tokens and driver locations are removed by Mongo
  TTL indexes.

### Deploy checklist
- [ ] Set `NODE_ENV=production`, `CLIENT_ORIGIN`, `APP_URL`, JWT secrets, `MONGO_URI`.
- [ ] `TRUST_PROXY=true` behind a reverse proxy.
- [ ] `cd client && npm run build` and serve `client/dist` (or deploy to a static host).
- [ ] Run `cd server && npm start` behind the proxy (or a platform like Render).
- [ ] Set OAuth callback URLs to `<APP_URL>/api/auth/{google,facebook}/callback`.

### Performance notes
- Map markers/components use `useMemo`/`useRef` to avoid Leaflet re-render lag.
- Driver location broadcasts are throttled to 1 per 2 s (client + server).
- MongoDB needs the `2dsphere` index on `Location.coordinates` (created by Mongoose on boot).
- Fleet/nearby queries filter vehicle type on the **populated driver**, not on `Location`
  (the schema has no `vehicleType` field).

---

## 9. Directory Map (key files)

| Path | Contents |
|---|---|
| `server/src/index.js` | App bootstrap: helmet, CORS, rate limits, routes, socket mount |
| `server/src/config/` | `db.js`, `socket.js`, `passport.js` |
| `server/src/controllers/` | Route handlers (auth, ride, driver, admin, payment, notification, user, place, settings) |
| `server/src/services/` | Business logic (`rideService`, `driverService`, `authService`, `paymentService`, `notificationService`, `mailService`, `smsService`, `settingsService`, `userService`) |
| `server/src/middleware/` | `auth.js` (protect + requireRole), `error.js` (asyncHandler) |
| `server/src/models/` | Mongoose schemas |
| `server/src/utils/tokens.js` | Opaque token generation + SHA-256 hashing |
| `client/src/context/AuthContext.jsx` | Auth state + socket connect |
| `client/src/services/` | `api.js` (axios + queued refresh), `socketService.js`, and per-domain clients |
| `client/src/pages/` | `marketing/`, `passenger/`, `driver/`, `admin/`, plus auth pages |
| `client/src/data/` | `services.js`, `vehicles.js` (shared service + fleet catalogs) |
| `client/src/components/` | `maps/` (Leaflet + pin icons), `rides/`, `auth/`, `layout/`, `ui/`, `three/` |
| `AGENTS.md` | Living developer guide — keep in sync when behavior changes |

---

*Companion document: `PRODUCT_OVERVIEW.md` — business-facing overview for managers and
marketing.*