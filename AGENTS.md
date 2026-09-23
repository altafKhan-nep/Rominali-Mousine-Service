# RideTaxi - Developer Guide

## Quick Start

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Environment setup
cp .env.example .env  # Add MongoDB URI, JWT secrets

# Run dev servers (separate terminals)
cd client && npm run dev    # http://localhost:5173
cd server && npm run dev    # http://localhost:5001
```

> **macOS gotcha**: Port `5000` is often taken by ControlCenter/AirPlay. The backend defaults to **5001**. If you change it, also update `client/vite.config.js` proxy targets.

## Design System (professional red + black + gold — user-chosen, RED-led)

All design tokens live in `client/src/index.css` inside the Tailwind `@theme` block.
**Keep token NAMES stable** (`brand-*`, `accent-*`) — component classes reference them by name,
so you change a color value, never a class.

| Token family | Role | Key values |
|--------------|------|------------|
| `brand-*` | **RED = primary brand**: nav/hero/footer bands, CTAs, live dots, red accent text | `brand-500 #e53935`, `brand-600 #d7332f`, `brand-700 #c62828`, `brand-800 #a11c1c`, `brand-950 #57100f` |
| `accent-*` | Neutral blacks/grays = contrast + secondary UI (never primary) | `accent-400 #8f8f9a`, `accent-500 #667085`, `accent-900 #0b0d0f` |
| `gold-*` | Warm gold = premium highlights / ratings / hero accent words on red | `gold-300 #efc964`, `gold-400 #f4b942`, `gold-500 #eaa82b` |
| `ink` / `muted` | Text on off-white paper | `ink #0b0d0f`, `muted #667085`, `paper #f8f9fa` |
| Fonts | `--font-display` = **Fraunces** (serif, headings — elegant editorial), `--font-sans` = **Inter** (body, highly readable) | Google Fonts, loaded in `client/index.html` |

Usage rules:
- **Red leads**: `bg-brand-gradient` (deep red) is the primary surface for nav/hero/footer/CTA bands. CTAs use `btn-brand-gradient` (bright→deep red). `bg-brand-gradient-soft` (warm off-white wash) is the body background between bands. `text-brand-gradient` (red) highlights words/stats on light sections.
- **Gold accents on red**: hero accent words, live dots, stat numbers and phone numbers on red bands use `text-gold-300` / `bg-gold-400` (not red) so they pop against the red.
- **Black is a contrast accent only** — body headings (`ink`), dark icons, map pins; never a surface color.
- Pills everywhere (Uber-style touch targets): `rounded-full` inputs (`input-pill`), buttons, chips.
- Functional map colors are the ONLY allowed exceptions to the palette: pickup = circular green `map-pin-start` (#10b981), dropoff = red `map-pin-dropoff` (brand-700), driver = pulsing red `map-pin-driver` (brand-600), idle vehicles = `map-pin-vehicle` (white circle + black border). Route polyline is brand red `#c62828` (white casing) hardcoded in `BookingMap.jsx` and `RideTracking.jsx`.
- Depth comes from layered shadows: `.card-lift` (resting 2-layer shadow, float on hover) — no heavy borders.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 18 + Vite + React Router v6 | Fast dev, modern bundler |
| Styling | Tailwind CSS | Rapid responsive UI |
| Maps | Leaflet + OpenStreetMap | Free, no API key |
| Backend | Express.js + Socket.io | Real-time events |
| Database | MongoDB + Mongoose | Flexible schema, geospatial queries |
| Payments | Stripe (Payment Intents) + cash option; sandbox fallback | Real card charges, cash-at-end, no-key dev |
| Auth | Passport.js (local + OAuth2 + JWT strategies) | Stateless JWT, horizontally scalable |
| Email | Nodemailer (SMTP) | Optional — verification + password reset; console fallback in dev |
| Social | Passport Google/Facebook OAuth2 (redirect flow) | Server-side verification, no app secret needed for token flows |
| SMS/OTP | Twilio | Optional — phone code sign-in; console/devCode fallback in dev |
| Hardening | Helmet + express-rate-limit | Security headers + per-IP auth throttling |

## Project Structure

```
ride-booking/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Reusable UI (auth/, maps/, rides/, ui/, layout/, three/)
│   │   ├── pages/           # Route pages
│   │   │   ├── marketing/   # Public site: Home, About, Services, ServiceDetail, Fleet, Contact, Careers
│   │   │   ├── passenger/   # Reservations.jsx (booking), RideTracking, RideHistory
│   │   │   ├── driver/      # Dashboard.jsx
│   │   │   └── admin/       # Dashboard.jsx (Overview/Rides/Drivers/Users/Payments/Settings)
│   │   ├── data/            # services.js (10 services shared across marketing pages + nav + footer)
│   │   ├── hooks/           # useSocket, useGeolocation, useAuth
│   │   ├── context/         # AuthContext
│   │   └── services/        # api.js, authService.js, socketService.js, rideService.js, paymentService.js, notificationService.js, userService.js, adminService.js, settingsService.js
│   └── public/              # sw.js (web-push service worker)
├── server/                  # Express backend
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # Mongoose schemas (User, Ride, Location, RefreshToken, OtpCode, Payment, Notification, AppSetting)
│   │   ├── routes/          # API routes
│   │   ├── middleware/       # auth.js (Passport JWT protect + roles), error.js
│   │   ├── services/        # Business logic (rideService, driverService, authService, mailService, smsService, userService, paymentService, notificationService, settingsService)
│   │   ├── utils/           # tokens.js (opaque token + SHA-256 hash)
│   │   └── config/          # db.js, socket.js, passport.js (Local/Google/Facebook/JWT strategies)
│   └── .env.example
└── AGENTS.md
```

## Frontend Routes

| Path | Page | Access | Notes |
|------|------|--------|-------|
| `/` | marketing/Home.jsx | Public | Landing (hero + 3D taxi, booking card, testimonials, service areas) |
| `/about` | marketing/About.jsx | Public | Company story + "Why Choose Us" |
| `/services` | marketing/Services.jsx | Public | Full grid of 10 services (data/services.js) |
| `/services/:slug` | marketing/ServiceDetail.jsx | Public | Data-driven per-service page |
| `/fleet` | marketing/Fleet.jsx | Public | Vehicle cards (Sedan/SUV/Van) + charter CTA |
| `/contact` | marketing/Contact.jsx | Public | Quote form (mailto to Rominalimo2023@gmail.com) + info |
| `/careers` | marketing/Careers.jsx | Public | Driver application form + PDF links |
| `/reservations` | passenger/Reservations.jsx | Public* | Booking flow: autocomplete + map + drivers strip |
| `/login`, `/register` | pages/Login.jsx, Register.jsx | Public | Auth (email-or-phone, remember me, Google/Facebook) |
| `/forgot-password` | pages/ForgotPassword.jsx | Public | Email reset link |
| `/reset-password` | pages/ResetPassword.jsx | Public | New password (token from email) |
| `/verify-email` | pages/VerifyEmail.jsx | Public | Confirm email via emailed link |
| `/auth/social` | pages/SocialCallback.jsx | Public | OAuth redirect landing — stores tokens from query, hard-redirects to `/` |
| `/profile` | pages/Profile.jsx | auth | Edit name/phone, avatar, change password, enable web-push |
| `/rides/history` | passenger/RideHistory.jsx | passenger | Payments + pay/edit/track actions |
| `/rides/track/:id` | passenger/RideTracking.jsx | passenger | Live tracking + ETA + pay/refund/edit |
| `/driver` | driver/Dashboard.jsx | driver | Accept rides, location broadcast |
| `/admin` | admin/Dashboard.jsx | admin | Tabs: Overview, Rides, Drivers, Users, Payments, Settings |

\* `/reservations` is viewable by anyone, but the request button prompts login.

**Reservations flow** (`passenger/Reservations.jsx`):
1. `LocationSearch` (autocomplete → `GET /api/places/search`) sets pickup/dropoff.
2. `BookingMap` shows nearby vehicles (`GET /api/drivers/nearby`) once pickup is set.
3. Selecting a driver calls `GET /api/drivers/:id/eta` → draws dashed route to pickup + shows ETA strip.
4. Submit → `POST /api/rides` → navigate to `/rides/track/:id`.

## Real Business Info (from rominalimousineservice.com)

| Field | Value |
|-------|-------|
| Phone (primary) | (240) 351-0826 → `tel:2403510826` |
| Phone (secondary) | (914) 752-8910 → `tel:9147528910` |
| Email | Rominalimo2023@gmail.com |
| WhatsApp | https://wa.me/12403510826 |
| Facebook | https://www.facebook.com/profile.php?id=61590491044125 |
| Instagram | https://www.instagram.com/rominalimousine/ |
| Base | Maryland |  |
| Service area | Maryland, Virginia, Washington DC, Baltimore (local & long distance, door-to-door) |
| Airports | BWI, Dulles (IAD), Reagan National (DCA) + FBO/private terminals |
| Legal name | Romina Limousine Service |
| Established | 2026 |

All brand identity + contact channels are centralized in `client/src/data/site.js` (`BRAND_NAME`,
`PHONE_TEL`, `PHONE_DISPLAY`, `EMAIL`, `WHATSAPP`, `FACEBOOK`, `INSTAGRAM`) — marketing pages,
`Navbar.jsx` and `Footer.jsx` import these instead of hardcoding digits.

Used in `Footer.jsx` (contact column) and the `tel:`/`mailto:` CTAs on marketing pages.

## 3D Hero Taxi (Home page)

`pages/marketing/Home.jsx` embeds a WebGL taxi behind the hero content (desktop/tablet only).
It is lazy-loaded so the ~265KB gzip three.js bundle only downloads when a supported,
non-mobile viewport actually renders it.

| File | Purpose |
|------|---------|
| `components/three/HeroTaxiScene.jsx` | `<Canvas>` + Suspense + lights + rig |
| `components/three/TaxiRig.jsx` | GSAP entrance, idle bob, mouse parallax (all lerped) |
| `components/three/TaxiModel.jsx` | Loads `/models/taxi.glb` if present, else procedural taxi |
| `components/three/ProceduralTaxi.jsx` | Real 3D sedan built from primitives (body, glass, wheels, decals) |
| `components/three/TaxiLights.jsx` | Ambient + key + warm fill + cyan rim |
| `components/three/StudioEnvironment.js` | `RoomEnvironment` PMREM → soft paint/glass reflections (no HDR file) |
| `components/three/ShadowDisc.jsx` | Soft radial shadow attached to the taxi group |
| `hooks/useMediaQuery.js`, `useWebGLSupport.js`, `three/useModelAvailable.js` | Responsive / feature detection |

**Dependencies** (v10+ of the app): `three`, `@react-three/fiber`, `@react-three/drei`, `gsap`.

Rules:
- **GLB override**: drop a taxi model at `client/public/models/taxi.glb` — it is auto-detected
  (HEAD + content-type check) and normalized to ~4.6 units. A missing file 404s gracefully to the
  procedural model. No flat images, ever.
- **Layering**: taxi layer is `z-[6]`, `pointer-events-none`, `aria-hidden`; hero text + booking
  card are `z-10` above it. The card stays fully interactive.
- **Responsive**: hidden on `<768px` and when WebGL is unavailable; tablets get a compact variant.
- **Reduced motion**: `prefers-reduced-motion` disables entrance + parallax + idle; taxi is static.
- **Branding**: door decals ("Romina Limousine Service") + roof "ROMINA" sign are canvas textures
  rendered at runtime — no external font/asset downloads.
- **Paint**: procedural model is a glossy black sedan (`#1c1c21` PBR, white DRLs, red taillights)
  — a realistic black car. Keep it black (never red/amber).

## Key Commands

```bash
# Frontend
cd client && npm run dev        # Start dev server
cd client && npm run build      # Production build
cd client && npm run lint       # ESLint

# Backend
cd server && npm run dev        # Start with nodemon
cd server && npm run start      # Production
cd server && npm run seed       # Seed test data
```

## Data Models

### User
```js
{
  _id, name, email, phone, password: (hashed),
  role: "passenger" | "driver" | "admin",
  avatar, createdAt, updatedAt,          // avatar = base64 data-URL (no external storage)
  emailVerified: Boolean,                // default false
  isSuspended: Boolean,                  // default false — protect + login reject suspended users
  pushSubscriptions: [{ endpoint, keys: { p256dh, auth } }],  // web-push endpoints
  authProvider: "local" | "google" | "facebook" | "phone",
  tokenVersion: Number,                  // bumped on logout / password reset to revoke JWTs
  verificationToken: { token, expiresAt } | null,  // hashed, 24h
  resetToken: { token, expiresAt } | null,          // hashed, 1h
  driverDetails: {
    vehicleType: "executive-sedan" | "economy-sedan" | "economy-suv" | "premium-suv" | "luxury-suv" | "van" | "mini-coach" | "school-bus" | "motorcoach",
    plateNumber, licenseNo, isAvailable: Boolean
  }
}
```
Statics: `findByEmail` / `findByPhone` / `findByLogin` (email-or-phone regex autodetect, all `.select('+password')`).

Fleet ids are shared via `client/src/data/vehicles.js` (`VEHICLES` + `vehicleLabel` helper) and must
match the enum above — same ids are used for driver matching and fares.

### Ride
```js
{
  _id,
  passenger: ref(User),
  driver: ref(User) | null,
  pickup: { address, lat, lng },
  dropoff: { address, lat, lng },
  vehicleType,                    // one of the 9 fleet ids above
  serviceType,                    // one of the 10 service slugs (data/services.js): airport, corporate, wedding, prom, shuttle, charter, night-out, funeral, school, valet
  passengerCount, bags,
  status: "pending" | "accepted" | "arriving" | "in_progress" | "completed" | "cancelled",
  fare: { estimated, final, currency, distanceKm, durationMin },
  route: [{ lat, lng }],           // Polyline from OSRM
  timestamps: { requested, accepted, arrived, started, completed },
  payment: { method, status, transactionId }
}
```

### Location (driver positions)
```js
{
  driver: ref(User),
  coordinates: { lat, lng },
  heading, speed,
  updatedAt                        // TTL index for auto-cleanup
}
```

### RefreshToken (server-side sessions)
```js
{
  user: ref(User),
  tokenHash,                       // SHA-256 of the opaque refresh token
  expiresAt,                       // TTL index -> MongoDB auto-deletes expired
  revokedAt: Date | null,
  rememberMe, userAgent, ip,
  createdAt, updatedAt
}
```

### OtpCode (phone sign-in)
```js
{
  phone,                          // indexed
  codeHash,                       // SHA-256 of the 6-digit code
  expiresAt,                      // TTL index (10 min)
  attempts,                       // max 5 before the code is voided
  createdAt, updatedAt
}
```

### Payment (Stripe + cash + sandbox fallback)
```js
{
  user: ref(User), ride: ref(Ride),
  amount, currency,
  method: "card" | "wallet" | "cash",
  provider: "stripe" | "sandbox" | "cash",
  status: "pending" | "succeeded" | "failed" | "refunded" | "cash",
  transactionId,                  // unique + sparse; pi_… for Stripe, txn_… for sandbox
  idempotencyKey,                 // unique + sparse — caller key prevents double-charge
  failureReason, cardLast4,
  refundedAt, refundTransactionId,
  createdAt, updatedAt
}
```
**Cash**: `POST pay` with `{ method: "cash" }` records a no-charge payment (status
`cash`, provider `cash`); the passenger pays the driver at trip end. Never
refundable, allowed even when `paymentsEnabled=false`. Once a ride is settled
(either `succeeded` or `cash`) it is returned as-is — never charged again.

**Stripe (online card)**: when `STRIPE_SECRET_KEY` is set in `server/.env`,
card payments go through real Stripe Payment Intents. Flow:
1. `POST /api/rides/:rideId/payment-intent` → `{ clientSecret, amount }` (idempotent per ride).
2. Client confirms with the Payment Element (`stripe.confirmPayment`, `redirect: 'if_required'`).
3. `POST pay` with `{ method: "card", paymentIntentId }` — server retrieves the
   intent, verifies `status === 'succeeded'` and amount == ride fare, then records
   it (provider `stripe`, transactionId = `pi_…`).
Unconfirmed/declined intents are rejected (400). Refunds call `stripe.refunds.create`.
The account's Payment Method Configuration is applied automatically via
`automatic_payment_methods: { enabled: true }` — the `pmd_…` Payment Method
Domain id in `server/.env` is informational (dashboard config); do NOT pass it as
`payment_method_configuration` (that param needs a `pmc_…` id).

**Sandbox (fallback)**: when `STRIPE_SECRET_KEY` is unset, card payments use the
simulated gateway — card ending `0002` always declines, `0000` always succeeds,
otherwise ~95% success. Stripe is preferred once configured.

### Notification (in-app)
```js
{
  user: ref(User, indexed),
  type: "ride" | "payment" | "account" | "system",
  title, message,
  data: {},                        // e.g. { rideId } for deep links
  read: Boolean, readAt,
  createdAt
}
```
`notificationService.notify()` writes the row and fans out to the socket room
`user:{id}` (`notification:new`), plus email / SMS / web-push when configured.
`Notification` is the ONLY persisted record — external channels are fire-and-forget.

### AppSetting (admin-editable key/value)
```js
{ key: String, unique, value: Mixed }
```
Known keys (defaults in `settingsService.DEFAULTS`): `baseFare`, `perKm`,
`perMin` (fare overrides, `null` = built-in rates), `paymentsEnabled` (toggle),
`supportPhone`, `supportEmail`. `GET /api/settings` exposes a public subset.

## API Endpoints

### Auth
- `POST /api/auth/register` - Register (validates name/email/password >= 6/phone format; 409 on duplicate email). Creates unverified user + sends verification email; returns `verificationLink` in non-production.
- `POST /api/auth/login` - Login with **email OR phone** + password (Passport LocalStrategy). Body: `{ identifier, rememberMe }` (or `{ email }`/`{ phone }`). `rememberMe` = true → 30d refresh, else 7d.
- `POST /api/auth/refresh` - **Rotates** the opaque refresh token (old one is revoked atomically). Rejects replays/concurrent reuse (exactly one success). Rejects if `tokenVersion` changed.
- `POST /api/auth/logout` - **Auth required.** Body `{ refreshToken }` — revokes that device's session.
- `GET /api/auth/google` / `GET /api/auth/facebook` - Passport OAuth2 **redirect** start. 503 if provider not configured. On success the provider bounces back to the callback which issues tokens and redirects to `{CLIENT_ORIGIN}/auth/social?accessToken=&refreshToken=`.
- `GET /api/auth/google/callback` / `GET /api/auth/facebook/callback` - OAuth2 callback → find-or-create/link user → tokens → SPA.
- `POST /api/auth/otp/send` - Body `{ phone }`. Sends a 6-digit SMS code (Twilio, or console + `devCode` in dev). Rate-limited (5/10min/IP).
- `POST /api/auth/otp/verify` - Body `{ phone, code }`. One-time code (10 min TTL, 5 attempts). Find-or-creates a `phone`-provider user and issues tokens.
- `POST /api/auth/verify-email` - Body `{ token }`. Marks `emailVerified`, clears `verificationToken` (24h expiry).
- `POST /api/auth/resend-verification` - Body `{ email }`.
- `POST /api/auth/forgot-password` - Body `{ email }`. Sends reset link (1h expiry); returns `resetLink` in non-production.
- `POST /api/auth/reset-password` - Body `{ token, password }`. Also bumps `tokenVersion` (signs out all sessions).
- `GET /api/auth/me` - Current user profile (auth required)

### Rides
- `POST /api/rides` - Request ride (passenger)
- `GET /api/rides` - List rides (filtered by role)
- `GET /api/rides/:id` - Ride details
- `PATCH /api/rides/:id` - **Edit pending ride** (passenger): pickup/dropoff/vehicleType/serviceType/passengerCount/bags. Changed locations are re-geocoded + fare/route recomputed. Blocked once a driver accepts.
- `PATCH /api/rides/:id/accept` - Driver accepts
- `PATCH /api/rides/:id/status` - Update status (driver). Sets `fare.final` on completion.
- `PATCH /api/rides/:id/cancel` - Cancel ride
- `POST /api/rides/:id/rate` - Rate completed ride (passenger)
- `POST /api/rides/:rideId/pay` - Charge/settle a ride (passenger): `{ method: "cash" }`
  records a no-charge cash payment; `{ method: "card", paymentIntentId }` records a
  Stripe charge. Idempotent (see Payment model).
- `POST /api/rides/:rideId/payment-intent` - Stripe PaymentIntent `{ clientSecret, amount }`
  for the card tab of the pay modal (idempotent per ride).

### Users / Profile
- `GET /api/users/me` - Profile (name, email, phone, avatar, role)
- `PATCH /api/users/me` - Edit name / phone
- `POST /api/users/me/avatar` - Body `{ dataUrl }` (base64 image, ≤512KB). Stored in Mongo.
- `DELETE /api/users/me/avatar` - Remove avatar
- `PATCH /api/users/me/password` - Body `{ currentPassword, newPassword }` (≥6 chars). Keeps current session.

### Payments
- `POST /api/rides/:rideId/pay` - Settle a ride (see Rides above: cash or Stripe card)
- `GET /api/payments` - User's payments (with ride ref)
- `GET /api/payments/:id` - Payment detail
- `POST /api/payments/:id/refund` - Refund a succeeded payment (payer or admin); cash payments are rejected

### Notifications
- `GET /api/notifications` - User's notifications (50 newest)
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read` / `PATCH /api/notifications/read-all`
- `POST /api/notifications/subscribe` - Body `{ subscription }` (web-push; 503 if VAPID unset)
- `POST /api/notifications/unsubscribe` - Body `{ endpoint }`

### Drivers
- `GET /api/drivers/nearby?lat=&lng=&radius=&vehicleType=` - Find nearby drivers (returns driver + live coords)
- `GET /api/drivers/:id/eta?toLat=&toLng=` - Route + ETA from driver's last position (returns `distanceKm`, `durationMin`, `route` polyline, `from`)
- `PATCH /api/drivers/availability` - Toggle on/off duty

### Places
- `GET /api/places/search?q=` - Address autocomplete (Nominatim) for `LocationSearch`

### Settings (public)
- `GET /api/settings` - Public subset: `paymentsEnabled`, `supportPhone`, `supportEmail`, `vapidPublicKey`

### Admin/CRM
- `GET /api/admin/rides` - All rides with pagination
- `PATCH /api/admin/rides/:id/driver` - **Dispatch**: body `{ driverId }` assigns a driver (status → `accepted`, notified via socket + in-app); body `{ driverId: null }` removes the assigned driver (status → `pending`, back on the board). Rejects suspended drivers, drivers already on an active ride (409), and rides that are completed/cancelled.
- `GET /api/admin/drivers` - Driver list
- `GET /api/admin/analytics` - Dashboard stats
- `GET /api/admin/users?search=&role=&page=&limit=` - User list (search name/email/phone)
- `PATCH /api/admin/users/:id/suspend` / `PATCH /api/admin/users/:id/unsuspend` - Suspend/restore (kills active sessions)
- `DELETE /api/admin/users/:id` - Permanently delete a user + their rides/payments/locations (admins protected)
- `GET /api/admin/payments?status=&page=&limit=` - Payment reports + status summary
- `GET /api/admin/settings` / `PATCH /api/admin/settings` - App settings (fares, toggles, support info)

## Socket.io Events

### Client → Server
- **Socket auth is JWT-only.** Pass `{ token }` (access JWT) via `socket.auth` on connect, or `authenticate` `{ token }` to re-auth mid-connection. The legacy `{ userId, role }` trust fallback was **removed** — claiming a user id without a token gets you an anonymous socket that can never join `user:`/`ride:` rooms or emit locations. Drivers join the `drivers` room, admins the `admins` room.
- `authenticate` `{ token }` - Re-auth while connected: joins `user:{id}` room (drivers also `drivers`; admins `admins`)
- `ride:join` `{ rideId }` - Join `ride:{rideId}` room. **Authorized only for the ride's passenger, its assigned driver, or admins** (locations flow through these rooms — unauthenticated joins are rejected).
- `driver:location` `{ lat, lng, heading, speed }` - Driver position. **Server looks up the driver's active ride and forwards to `ride:{id}` room only.** Do NOT broadcast to all drivers/passengers.
- `passenger:location` `{ lat, lng, heading, speed }` - Passenger position. Mirror of `driver:location` — forwarded to the passenger's active `ride:{id}` room so the assigned driver sees them live.
- `ride:cancel` `{ rideId }` - Cancel ride (server re-validates)

### Server → Client
- `ride:update` `{ ride, status }` - Ride status changed (ride room; admins also receive via `admins` room for live dispatch UI)
- `ride:new` `{ ride }` - New pending ride → **only the nearby, available drivers whose vehicle matches** (per-driver `user:{id}` rooms; the ride's passenger + admin also see it via `notification:new`). Used for the driver feed.
- `ride:driverFound` `{ driver, ride }` - Driver assigned (via REST accept → socket)
- `ride:completed` `{ ride, fare }` - Fare final
- `driver:location` `{ driverId, lat, lng, heading, speed }` - Live driver position (ride room)
- `passenger:location` `{ passengerId, lat, lng, heading, speed }` - Live passenger position (ride room)
- `notification:new` `{ _id, type, title, message, data, read, createdAt }` - New in-app notification (user room)

## Seed Credentials

```bash
cd server && npm run seed   # resets users + driver positions
```

| Role | Email | Password |
|------|-------|----------|
| admin | `admin@rominalimo.com` | `admin123` |
| passenger | `passenger@rominalimo.com` | `pass123` |
| driver (sedan) | `alex@rominalimo.com` | `driver123` |

Driver positions are seeded near Howard County, MD (~39.20, -76.85). "Nearby drivers" queries use these seeded `Location` docs — no drivers online until you run the seed.

## Auth Flow

1. Register → user created `emailVerified:false` + `verificationToken` (hashed, 24h) → verification email sent (SMTP, or console + `verificationLink` in dev response). Account is auto-logged-in.
2. `POST /verify-email?token=` (`/verify-email` page) verifies the account; `VerifyEmailBanner` (App.jsx) shows "verify your email" with a resend button for any logged-in unverified user.
3. Login (`POST /api/auth/login`) is handled by **Passport LocalStrategy** (`usernameField: 'identifier'` → email-or-phone). On success the controller issues a 15m access JWT + an opaque refresh token.
4. Access token embeds `{ id, role, v: tokenVersion }`; `protect` uses the **Passport JWT strategy** and rejects when `v` changes (password reset / logout-all). `TOKEN_EXPIRED` code triggers the client refresh.
5. Refresh tokens are **opaque, stored hashed** in the `RefreshToken` collection with a TTL index (auto-cleanup). `POST /refresh` **atomically rotates** (`findOneAndUpdate` on `revokedAt: null`) → replaying or racing the same token yields exactly one success. `POST /logout` revokes that device's token. Password reset revokes all + bumps `tokenVersion`.
6. Social login is the **Passport OAuth2 redirect flow**: `/auth/google` → Google → `/auth/google/callback` → find-or-create/link user → redirect to `/auth/social?accessToken=&refreshToken=` (SPA stores tokens, hard-redirects to `/`). Strategies register only when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` or `FACEBOOK_APP_ID`/`FACEBOOK_APP_SECRET` are set; buttons render only when `VITE_GOOGLE_CLIENT_ID`/`VITE_FACEBOOK_APP_ID` are set in `client/.env`.
7. Phone OTP (`/otp/send` + `/otp/verify`) find-or-creates a `phone`-provider user and issues tokens. One-time code (10 min TTL, 5 attempts); without Twilio the code is logged and returned as `devCode`. OTP send is rate-limited per IP. **Currently disabled in the frontend** (no phone button on Login/Register) — backend endpoints remain for later re-enable.
8. On 401, `api.js` queued-refresh pattern calls `/refresh`, stores the rotated token, retries; on failure clears storage + redirects to `/login`. A `403 Insufficient permissions` also clears + redirects.
9. **Per-role client sessions**: `api.js` stores tokens under per-role keys (`rt_<role>_access` / `rt_<role>_refresh`) with a per-tab active-role marker in `sessionStorage`, so admin/driver/passenger can stay signed in simultaneously in different tabs without overwriting each other. `tokenStore.setActiveRole()` is set on login/register/social and after `getMe`.

> **Stateless & scalable**: every Passport strategy runs `session:false` — no session store, no sticky sessions, any instance serves any request. Rate limits are per-IP and in-memory per instance (use Redis or a shared store for multi-instance).

## Production Hardening (index.js)

- `helmet()` security headers; `express.json({ limit: '1mb' })`.
- `express-rate-limit`: global API limiter (default 600/15min), auth limiter (60/15min), login limiter (10/15min) — all configurable via `RATE_LIMIT_*` env vars. 429 when exceeded.
- `TRUST_PROXY=true` when behind nginx/Render/Vercel so `req.ip` and rate limits see the real client IP.
- Strict CORS to `CLIENT_ORIGIN` only.

## External API Dependencies (no keys, but need network)

- **Nominatim** (`rideService.geocode`) - free geocoding; sets `User-Agent: RominaLimousine/1.0`. Rate-limited (1 req/s).
- **OSRM** (`rideService.getRoute`) - free routing; returns distance/duration/polyline used for fares + map route.

## Development Phases

| Phase | What | Status |
|-------|------|--------|
| 1 | Auth + Booking Form + Basic Map | Done |
| 2 | Driver Dashboard + Accept Rides | Done |
| 3 | Real-time Tracking (Socket.io) | Done |
| 4 | Ride History + Ratings | Done |
| 5 | Admin CRM Dashboard | Done |
| 6 | Public marketing site (Home, Services, Careers) | Done |
| 7 | User Profile (avatar/password) + Ride Editing | Done |
| 8 | Sandbox Payments + Refunds | Done |
| 9 | Notifications (in-app + email + SMS + web-push) | Done |
| 10 | Admin Users/Payments/Settings management | Done |

## Key Patterns

### Geospatial Query (find nearby drivers)
```js
// MongoDB 2dsphere query
Location.find({
  coordinates: {
    $near: {
      $geometry: { type: "Point", coordinates: [lng, lat] },
      $maxDistance: radiusInMeters
    }
  }
}).populate('driver');
```

### Socket.io Room Pattern
```js
// Join ride-specific room
socket.join(`ride:${rideId}`);

// Broadcast to room
io.to(`ride:${rideId}`).emit('ride:update', { ride, status });
```

### Route Calculation (OSRM - free)
```js
// GET http://router.project-osrm.org/route/v1/driving/{lng},{lat};{lng},{lat}?overview=full
// Returns polyline geometry for map display
```

## Common Pitfalls

1. **Token refresh race condition**: Queue failed requests while refresh is in progress
2. **Location updates**: Throttle driver position updates to 1 per 2 seconds max
3. **Map markers**: Use `useMemo` for Leaflet markers to prevent re-render lag
4. **MongoDB geospatial**: Create `2dsphere` index on Location.coordinates
5. **CORS**: Backend must allow `http://localhost:5173` in dev
6. **Rename colors, not classes**: change values in `index.css` `@theme`, never Tailwind class names in components (see Design System)
7. **Don't hardcode new brand hexes in components**: route polyline `#b3221a` is the only allowed exception (Leaflet path options need raw hex)
8. **Payment idempotency**: the client sends a fresh `idempotencyKey` per attempt; a failed attempt's key is burned (409 on replay). `Payment.transactionId`/`idempotencyKey` are `sparse` unique — do not revert to non-sparse (duplicate-key crashes on pending/failed rows).
9. **`paymentsEnabled=false`**: `paymentService` rejects with 403; the UI surfaces the disable notice (PaymentModal fetches `GET /api/settings`). Re-enable via admin Settings tab.
10. **Suspension**: login (`passport.js`), every protected route (`middleware/auth.js`), and refresh rotation all reject `isSuspended` users; admin suspend also revokes their refresh tokens.
