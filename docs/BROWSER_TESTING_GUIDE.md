# RideTaxi — Manual Browser Testing Guide

Step-by-step instructions to test the whole app **from your browser**, with the exact
accounts, URLs, inputs, and "what you should see" for every step.

## 1. Before you start

### 1.1 Requirements
- Node.js + npm
- MongoDB running locally (`mongosh mongodb://127.0.0.1:27017/ridetaxi` should connect)
- Brave / Chrome / any modern browser

### 1.2 Start the app
```bash
# 1) Install dependencies (first time only)
cd client && npm install
cd ../server && npm install

# 2) Seed users + driver positions (resets data; do this before every full test run)
cd server && npm run seed

# 3) Terminal 1 — backend (API port 5001)
cd server && npm run dev

# 4) Terminal 2 — frontend (web app port 5173)
cd client && npm run dev
```
Open **http://localhost:5173** — you should see the red/black/gold landing page with the
3D taxi hero.

> **macOS gotcha:** port 5000 is taken by AirPlay/ControlCenter. This app uses **5001**.
> If you change the port, also update `client/vite.config.js`.

### 1.3 Test accounts (created by `npm run seed`)

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Passenger | `passenger@ellicot.com` | `pass123` | Books rides, pays, tracks |
| Driver (Executive Sedan) | `alex@ellicot.com` | `driver123` | Receives + accepts rides |
| Driver (Premium SUV) | `sam@ellicot.com` | `driver123` | Used to test vehicle matching |
| Admin | `admin@ellicot.com` | `admin123` | Dispatch, users, payments, settings |

The login page has **quick-fill buttons** (`Passenger` / `Driver` / `Admin`) that fill the
email + password for you.

### 1.4 Multi-role testing — each role can use its own tab
Tokens are stored **per role** (`rt_admin_*`, `rt_driver_*`, `rt_passenger_*`) and each tab
tracks its own active role in sessionStorage, so an admin and a driver can be signed in at
the same time in different tabs of the same browser without logging each other out.

**Convenient setup:** no incognito windows needed.
- Tab A (normal): **passenger**
- Tab B (normal): **driver**
- Tab C (normal): **admin**

All three stay logged in simultaneously; reloading any tab keeps its own session.

### 1.5 Allow browser geolocation
The app asks for your location (used to auto-center the map and set pickup). Allow it on
`http://localhost:5173`. If you deny it, an **amber banner** appears on `/reservations`
with a **"Use my location"** button to retry; the map falls back to Ellicott City, MD.

---

## 2. Public marketing pages (no login)

Open each URL in the normal window (logged out) and check:

| URL | Check |
|-----|-------|
| `/` | Hero + 3D black taxi (desktop), booking card, testimonial, "Book now" links |
| `/about` | Company story + "Why Choose Us" grid |
| `/services` | Grid of **10** services |
| `/services/airport` | Per-service page driven by `data/services.js` (try other slugs: `corporate`, `wedding`, `prom`, `shuttle`, `charter`, `night-out`, `funeral`, `school`, `valet`) |
| `/fleet` | Vehicle cards (Sedan/SUV/Van) + charter CTA |
| `/contact` | Quote form; submit opens your mail app addressed to `chriskbonsu@gmail.com` |
| `/careers` | Driver application form (mailto to same address) |

Footer (every page): phone **`(410) 365-5556`** (clickable `tel:`), email
`chriskbonsu@gmail.com`, address **9019 Early April Way, Ellicott City, MD**.

---

## 3. Authentication

### 3.1 Register (normal window, logged out)
1. `/register`
2. Fill Name, Email (e.g. `tester@example.com`), Phone (optional), Password (≥ 6 chars).
3. Submit → you are **auto-logged in** and a *"verify your email"* banner appears.
4. In **development** the response shows a verification link on screen (or in the server
   terminal) — click it (opens `/verify-email?token=…`).
5. The banner disappears → account is verified. ✅

### 3.2 Login
1. `/login`, quick-fill **Passenger**, password `pass123`, **Sign in**.
2. You land on `/` with the **Client Portal / Profile / Sign out** menu.
3. Try the **email-or-phone** field: also works with `+1 555 010 1000` (passenger's phone).
4. Tick **Remember me** → after logout, refresh tokens last 30 days instead of 7.

### 3.3 Wrong password
- Enter a bad password → red error *"Invalid credentials"*.
- After 10+ rapid failed logins per IP you get a **429** (login limiter) — wait or restart
  the backend.

### 3.4 Forgot / reset password
1. `/forgot-password`, enter `passenger@ridetaxi.com`.
2. In dev, the reset link is returned in the API response / server terminal — open it
   (`/reset-password?token=…`).
3. Set a new password → you are signed out of all sessions (security feature).
4. Log in again with the new password. ✅

### 3.5 Logout
- **Sign out** in the top menu → back to logged-out state; `/profile` and `/rides/history`
  now redirect to `/login`.

---

## 4. Booking flow (passenger) — the core journey

Setup: **Window A** logged in as passenger.

1. Go to **`/reservations`**.
2. Allow geolocation → within a second the map **flies to your area**, the pickup box
   auto-fills with **"Current location"** (green pickup pin on the map), and a **blue "You
   are here" dot** marks your live position. ✅
3. Type a dropoff in the **"Search dropoff address"** box (e.g. `BWI Airport`) and pick an
   autocomplete result → blue pin + a route line appear.
4. In **Vehicle**, choose **Executive Sedan** (Alex's vehicle — this is what makes the
   driver test below work). A strip of nearby drivers appears below the map.
5. Click a driver card → dashed **route to pickup** is drawn + an **ETA strip** appears.
6. Set passenger count / bags / notes, then **Request taxi**.
7. You are redirected to **`/rides/track/:id`** and the ride shows status **pending**.
   ✅ Ride is created.

> Not logged in? The button says **"Sign in to book"** and prompts login.

---

## 5. Live ride with a driver (real-time test)

Setup: **Window A** = passenger (logged in), **Window B (incognito)** = driver (Alex).

1. In **Window B**, open `/driver`, quick-fill **Driver** (`alex@ridetaxi.com`),
   password `driver123`. Slide the **On duty** switch on → status flips to *On duty* and the
   map shows your own live pin. (Reload the page — the switch stays *On* because the
   dashboard syncs availability from the server on load.)
2. In **Window A**, submit the ride from Section 4 (or book again if it's done).
3. In **Window B**, a **request card** appears within ~1 second: pickup → dropoff,
   distance, ETA, price, vehicle. Press **Accept**. ✅ (Feed disappears; an **Active ride**
   panel appears.)
4. Active ride panel shows: map with pickup + dropoff pins, your red pin, the route, and
   the passenger's details.
5. In **Window A** (tracking page): status becomes **accepted**, the driver's **live red
   pin** moves toward pickup, and a **"Driver on the way"** strip shows an ETA. ✅
6. In **Window B**, tap **Arriving at pickup** → passenger sees *arriving*.
7. Tap **Start trip** → passenger sees *in progress*.
8. Tap **Complete trip** → ride completes; **final fare** is set. ✅
9. In **Window A**: status *completed*, payment chip shows **Unpaid** → press **Pay** (see
   Section 7 for card numbers).
10. **Optional reverse check:** while the ride is active, Window A shows the driver's live
    marker; Window B's Active ride map shows the passenger's **live blue pin** the moment
    the passenger's page is open. ✅

**Cancel path (optional):** while pending, the passenger can press **Cancel ride** (edit +
cancel); a pending ride can also be **Edit**-ed (change pickup/dropoff) from the tracking
page or `/rides/history`.

---

## 6. Driver dispatch WITHOUT a browser driver (admin feature)

If you don't want to run a second window, the **admin can assign a driver**:

1. **Window C (incognito)**: `/login`, quick-fill **Admin**, password `admin123`, go to
   **`/admin`** → **Rides** tab.
2. Confirm the new ride is listed as **pending**.
3. Click the **Assign** dropdown for that ride and pick **Alex** → status becomes
   **accepted** and the driver gets an in-app notification + live update. ✅
4. Use **Remove** to put it back to **pending** (it reappears on the drivers' feed). ✅

---

## 7. Payments (cash + Stripe card)

The pay modal offers **two options**: *Card / online* (real Stripe) and *Cash*.
When `STRIPE_SECRET_KEY` is set, card charges go to **Stripe test mode** — use Stripe's
test cards, no real money is moved. Without the key the app falls back to the sandbox
simulator (card ending `0000` succeeds, `0002` declines).

### Pay by cash (no online charge)
1. Complete a ride (Section 5). On the tracking page or in `/rides/history` press **Pay**.
2. In the modal tap **Cash** → **Confirm cash payment** → *Cash payment* panel: *"No card
   was charged. Pay $… in cash to your driver."* ✅
3. The ride chip shows **Cash** (gold) and there is **no** refund button. ✅

### Pay by card (Stripe)
1. Press **Pay** again on a new completed ride. The **Card / online** tab is pre-selected
   and Stripe's secure card form loads.
2. Enter a Stripe test card:
   - `4242 4242 4242 4242`, any future expiry (e.g. `12/30`), any CVC → **succeeds** ✅
   - `4000 0000 0000 0002` → **declines** (error shown, no charge recorded) ✅
3. Press **Pay $…** → *Payment succeeded*, status becomes **Paid**. ✅
4. Re-pay the same ride → no double charge (idempotent). ✅

### Refund (card only)
- On the tracking page of a **paid** completed ride, press **Request refund** (confirm the
  dialog) → status becomes **Refunded** and the Stripe charge is refunded. ✅
- Cash payments cannot be refunded (rejected by the server). ✅

### Admin view (`/admin` → Payments)
- Summary cards include **Cash**, **Succeeded**, **Refunded**, etc. Cash rows show
  method `cash`; Stripe card rows carry a **Stripe** badge and `pi_…` transaction ids. ✅

> If the admin turned payments off (Settings tab), the modal shows a **payments disabled**
> notice and online card is rejected — cash still works. Re-enable in admin Settings.

---

## 8. Driver dashboard extras (Window B)

- **On duty / Off duty** is a **toggle switch** (not a button). Slide off → request feed
  clears; you stop receiving new rides. The status dot pulses red when *On duty*.
- **Stats** cards (Total rides / Completed / Earnings) update after completed rides —
  Earnings is formatted to **2 decimals** (`$812.80`, never `$812.8000000000003`).
- Accepting while already serving a ride → server rejects with
  `409 You already have an active ride`.
- Try booking **Premium SUV** with the passenger → the request only goes to **Sam**
  (SUV driver). If Alex (sedan) is your only driver, the feed stays empty until Sam comes
  online — this is **correct vehicle matching**, not a bug.

---

## 9. Admin dashboard (Window C, `/admin`)

| Tab | What to test |
|-----|--------------|
| **Overview** | Stat cards (rides, active now, drivers) + recent rides list |
| **Rides** | Table of all rides; **Assign/Remove driver** dropdown per ride (Section 6); live refresh when a new ride is created |
| **Drivers** | List with vehicle type, availability, status |
| **Users** | Search box (name/email/phone); **Suspend** a user → they're kicked out of sessions and can't log in; **Unsuspend**; **Delete** (admins are protected from deletion) |
| **Payments** | Status filter (pending/succeeded/failed/refunded/cash), totals, Stripe vs cash badge |
| **Settings** | Edit `baseFare`, `perKm`, `perMin` (null = built-in rates); toggle **paymentsEnabled**; update **supportPhone/supportEmail**; **Save** |

After saving settings, verify the change: e.g. toggle **paymentsEnabled off** → a
passenger paying gets the disabled notice (Section 7 note).

---

## 10. Notifications, Profile, History

### Notifications (bell icon, top bar)
- New ride / dispatch / payment events show a gold **unread badge**.
- Open the bell → click a notification → deep-links (e.g. to the ride tracking page).
- **Mark all read** clears the badge. ✅

### Profile (`/profile`)
- Edit **name / phone** → **Save changes**.
- **Avatar**: upload an image (PNG/JPG ≤ 512 KB) → preview updates; remove works.
- **Change password** (needs current password; ≥ 6 chars) → keeps you logged in.

### Ride history (`/rides/history`)
- Lists all rides with status/payment chips, fare, vehicle.
- Active rides get **Track**, pending rides get **Edit**, completed+unpaid get **Pay**.

---

## 11. Full test matrix (quick checklist)

| # | Flow | Who | Pass = |
|---|------|-----|--------|
| 1 | Public pages | guest | All 8 routes render, footer info correct |
| 2 | Register + verify email | guest | Auto-login + banner clears |
| 3 | Login (email & phone) + remember me | guest | Lands on `/` with session |
| 4 | Forgot/reset password | guest | New password works, sessions revoked |
| 5 | Reservations auto-location | passenger | Map flies to area, pickup = "Current location", blue "You are here" dot |
| 6 | Book a ride | passenger | Redirect to tracking, status pending |
| 7 | Driver online + accept | driver | Feed card → Active ride panel |
| 8 | Live location both ways | passenger+driver | Live pins on both screens |
| 9 | Status transitions | driver | arriving → in_progress → completed |
| 10 | Admin assign/remove driver | admin | pending ↔ accepted, live refresh |
| 11 | Pay success + fail | passenger | Stripe `4242…` succeeds / `4000 0000 0000 0002` declines (sandbox `0000`/`0002` without a key) |
| 12 | Refund | passenger | Refunded state |
| 13 | Pay by cash | passenger | "Cash" chip, no charge, no refund button |
| 13 | Vehicle matching | driver(s) | Request reaches only matching driver |
| 14 | Admin suspend + delete | admin | User locked out / removed |
| 15 | Settings toggle (paymentsEnabled) | admin | Passenger sees disabled notice |
| 16 | Notifications + deep links | any | Badge, click-through works |
| 17 | Profile avatar + password | passenger | Updates persist |
| 18 | Ride history actions | passenger | Track/Edit/Pay render correctly |

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `403 Insufficient permissions` | Same-role token replaced (e.g. logged into the same role twice in the same tab) | Re-login in that tab; the app auto-clears the bad token + redirects to `/login`. Different roles in separate tabs no longer conflict |
| Driver never gets a request | Driver has no fresh `Location` (10-min TTL) or is offline, or vehicle mismatch | Run `npm run seed`; driver must slide the **On duty** switch on; check vehicle type matches |
| 429 Too Many Requests | In-memory rate limits hit during heavy testing | Dev `server/.env` already overrides to `RATE_LIMIT_API=6000` etc.; `touch server/src/index.js` to restart nodemon and clear counters (config untouched) |
| `EADDRINUSE: :5001` | Backend already running / crashed | `lsof -ti:5001 \| xargs kill -9` then restart |
| Map shows Ellicott City, not my area | Geolocation denied in browser | Allow location for `localhost:5173` (lock icon in address bar) |
| Social login buttons don't appear | Google/Facebook credentials unset in `server/.env` + `client/.env` | Add the provider keys; Google also needs redirect URI `http://localhost:5001/api/auth/google/callback` in the Google Console |
| Verification/reset email never arrives | SMTP not configured | In dev the link is printed in the API response / server terminal |

### Useful one-liners
```bash
# backend up?
curl http://localhost:5001/api/health        # shows RateLimit-Remaining header

# driver positions present?
mongosh mongodb://127.0.0.1:27017/ridetaxi --eval 'db.locations.countDocuments()'

# any active rides?
mongosh mongodb://127.0.0.1:27017/ridetaxi --eval \
  'db.rides.find({status:{$in:["pending","accepted","arriving","in_progress"]}},{status:1,driver:1}).count()'
```