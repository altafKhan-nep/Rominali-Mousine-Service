# Ellicott City Airport Taxi — Product Overview

*Documentation for managers, marketing, and stakeholders.*

---

## 1. What It Is

**Ellicott City Airport Taxi** is a complete, production-grade ride-booking platform that
connects passengers, drivers, and a central dispatch (admin) team over the web. It powers a
real airport-taxi business: passengers book door-to-door rides across Maryland, DC, and
Virginia; drivers receive and accept nearby requests in real time; and the office dispatches
drivers from a single dashboard.

It is **not** a static brochure site. It is an operating system for the business — booking,
live tracking, payments, notifications, and back-office management all in one.

| Quick facts | |
|---|---|
| Legal brand | Ellicott City Airport Taxi |
| Phone | (410) 365-5556 |
| Email | chriskbonsu@gmail.com |
| Service area | Maryland, DC, Virginia (local + long distance, door-to-door) |
| Vehicle types | 9 — Executive/Economy Sedan, Economy/Premium/Luxury SUV, Van, Mini-Coach, School Bus, Motorcoach |
| Service types | 10 — airport, corporate, wedding, prom, shuttle, charter, night-out, funeral, school, valet |

---

## 2. How It Works

The product has four audiences, each with a distinct view:

1. **Visitors & passengers** land on a polished marketing site (Home, About, Services, Fleet,
   Contact, Careers), pick a service, and book a ride. Booking is an Uber-style flow:
   type a pickup and dropoff, pick a vehicle, see live nearby vehicles on a map and an
   instant fare estimate, then confirm.
2. **Drivers** go online on their dashboard, get live ride-request cards for nearby pickups
   that match their vehicle, and tap **Accept**. Their live position is streamed to the
   passenger during the trip.
3. **Passengers** follow the trip on a live-tracking map with ETA, driver identity, and
   fare. They can edit a pending ride, cancel, pay online, and rate after completion.
4. **Admin / dispatch** sees every ride, driver, user, payment, and setting in one CRM.
   When a passenger books, the admin is notified instantly and can **assign a driver** to a
   reservation (or remove one) — the entire system reacts in real time.

The booking → dispatch → tracking loop:

```
Passenger books  →  Nearby matching drivers notified + admin notified (instant)
                         │
        ┌────────────────┴─────────────────┐
        ▼                                  ▼
   Driver accepts                    Admin assigns a driver
        │                                  │
        └───────────┬──────────────────────┘
                    ▼
        Ride goes "accepted" → live tracking + ETA
                    ▼
        Driver arrives → in progress → completed
                    ▼
        Passenger pays online (or cash at the end) → rates → done
```

---

## 3. Key Features & Functions

### For passengers
- **Smart booking** with address autocomplete, a live map, and instant fare estimates
  (no phone call needed).
- **Live trip tracking** — watch the driver approach on a map with ETA and route.
- **Edit & cancel** — change pickup/dropoff/vehicle while a ride is still pending.
- **Online payments** — secure card checkout via Stripe (or cash at the end, no online
  charge), with instant refunds.
- **Ride history & ratings** — every trip logged, every completed trip rateable.
- **Accounts** — register/login by email, phone, Google, or Facebook; profiles with avatar;
  password reset and email verification.

### For drivers
- **Live ride-request feed** — only requests that are *nearby* and *match your vehicle*
  appear; accept in one tap.
- **One-tap availability** — go online/offline; your position is shared only while online.
- **Status control** — accept → arriving → in progress → complete; the passenger sees every
  step in real time.

### For the office / admin
- **Reservation notifications** — admin is alerted the moment any passenger books.
- **Dispatch** — assign any driver to a reservation, or remove/reassign them, live.
- **Full CRM** — rides, drivers, users, payments, and revenue analytics in one dashboard.
- **User management** — suspend/restore/delete accounts.
- **Payment reports** — totals by status with refund management.
- **Settings** — fare overrides, payment toggle, and support contact info, all editable
  without touching code.

### Platform-wide
- **Notifications** everywhere — in-app alert bell, plus optional email, SMS, and browser
  push so no one misses a request.
- **Branded experience** — professional red/black/gold design, elegant serif headings,
  a 3D taxi on the homepage, fully responsive on phones, tablets, and desktop.

---

## 4. Scalability

The architecture is deliberately simple, stateless, and horizontally scalable:

- **Stateless backend** — the API runs with no session state on any instance; any number of
  servers can sit behind a load balancer and serve any request.
- **JWT auth with server-side refresh tokens** — sessions can be revoked instantly (suspend,
  password reset) and scale without sticky sessions.
- **Real-time sockets** — live events are scoped to *rooms* (one per user, one per ride),
  so adding users does not mean broadcasting to everyone.
- **MongoDB geospatial queries** — "nearby drivers" uses native geospatial indexing, efficient
  even at thousands of active drivers.
- **Free, keyless external services** — OpenStreetMap (maps + geocoding) and OSRM (routing)
  keep per-ride cost near zero.

### Growth levers
- **Multiple admins** — the CRM supports an unlimited admin team; any admin can dispatch.
- **Many drivers** — every vehicle type in the fleet is supported and matched automatically.
- **New service areas** — adding a region is a config change, not a rewrite.
- **Internationalization-ready** — fares, currency, and messaging are already parameterized.

### Market impact
- Replaces phone-booked taxi calls with a modern, always-on digital channel.
- Captures higher-value segments (corporate, wedding, prom, funeral, school) with dedicated
  service pages and matching vehicles.
- Gives the office a competitive dispatch edge: **faster assignment, fewer lost bookings,
  real accountability** via live tracking and reports.
- One codebase serves marketing (public site), operations (booking/tracking), and management
  (CRM) — a full customer-company flywheel in a single product.

---

## 5. Business & Technical Snapshot (for stakeholders)

| Area | Detail |
|---|---|
| Access | Public marketing site; role-based apps for passenger / driver / admin |
| Platforms | Any modern browser — desktop, tablet, mobile (fully responsive) |
| Payments | **Cash at the end** (no online charge) or **online card via Stripe** (test mode: use `4242…` to succeed, `4000 0000 0000 0002` to decline); instant refunds. Falls back to a sandbox simulator when the Stripe key is unset |
| Maps | OpenStreetMap + Leaflet (free, no API key); live routing from OSRM |
| Accounts | Email/phone + password, Google & Facebook sign-in, phone-OTP ready (backend, frontend disabled) |
| Verification | Email verification + password reset emails |
| Security | JWT sessions, login throttling, per-IP rate limits, suspended-account blocking |
| Notifications | In-app bell, plus email, SMS (Twilio), and browser push (web-push) |
| Admin | Dispatch, rides, drivers, users, payments, revenue, settings |
| Backup/safety | Server-side refresh-token sessions can be revoked globally (e.g., on password reset) |
| Hosting shape | Node.js API + React frontend + MongoDB; runs on any cloud (Render, Vercel, AWS, etc.) |

---

## 6. Launch Checklist (non-technical)

- [ ] **Take live payments** — swap the Stripe **test** keys for **live** keys (and add the
      Stripe webhook for settlement edge cases), keep the **Cash** option as-is, and make sure
      `paymentsEnabled` is on in Admin → Settings.
- [ ] **Add real drivers** — invite drivers, set their vehicle type/plate, and train them on
      the driver dashboard.
- [ ] **Set support info** — update phone/email in Admin → Settings (shown to passengers).
- [ ] **Configure SMS & email** — add Twilio and SMTP credentials so notifications actually
      reach phones/inboxes.
- [ ] **Promote the booking link** — the marketing pages (Services, Fleet, Contact, Careers)
      are the sales front door; share them in local advertising and social media.
- [ ] **Train dispatch** — one 10-minute session on the Rides tab (assign/remove) unlocks the
      full reservation workflow.
- [ ] **Watch the numbers** — Overview tab shows revenue, active rides, drivers, and passengers
      at a glance.

---

*Companion document: `TECHNICAL_GUIDE.md` — architecture and implementation details for
engineering teams.*