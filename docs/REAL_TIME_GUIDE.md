# Real-Time Dispatch & Live Location Guide

Everything you need to make the "driver never got my request" problem disappear, see
passenger ↔ driver live locations on the map, and auto-center maps on the user's area —
with localhost setup, verification steps, pitfalls, and debugging tips.

## 1. Why a driver might not receive ride requests (and how to fix)

`ride:new` is only delivered to drivers who satisfy **all** of these conditions. Check
them in order.

| # | Condition | What can silently break it | Fix / verify |
|---|-----------|----------------------------|--------------|
| 1 | Driver has a **live `Location` doc** | `Location` has a 10-minute TTL index. If the driver never broadcasts (app closed, offline) their position expires and they vanish from the 10 km search. | Run `cd server && npm run seed` to seed positions near Howard County, **or** have the driver open `/driver` and slide the **On duty** switch on (the dashboard broadcasts `POST /api/drivers/location` every 2 s, which upserts a fresh doc). The dashboard now **syncs the switch from the server on load** (`GET /api/users/me`), so a reload shows the real `isAvailable` state, never a stale "off". Check: `mongosh mongodb://127.0.0.1:27017/ridetaxi --eval 'db.locations.countDocuments()'`. |
| 2 | Driver is **available** | `driverDetails.isAvailable` is `false`. | Verify: `db.users.findOne({email:"alex@ridetaxi.com"}).driverDetails`. Toggle with the **On duty switch** on the dashboard. |
| 3 | Vehicle type **matches the ride** | Matching filters on `driver.driverDetails.vehicleType` vs `ride.vehicleType` (one of the 9 fleet ids in `client/src/data/vehicles.js`). A sedan request never reaches an SUV-only driver. | Booking form must select the same vehicle the driver has, or the driver's vehicle type must match what the passenger picks. |
| 4 | Driver's socket is **in the `user:{id}` room** | The server joins rooms from `socket.handshake.auth` (`{ userId, role }`). If the socket connects without `auth` (or the old `authenticate` event is never emitted), the driver silently misses every `ride:new`. | This was a real pre-existing bug — rooms were never populated. The client now sends `socket.auth` on connect (`socketService.connectSocket`). |
| 5 | Socket is **connected** | Wrong socket URL / backend down / dev proxy misconfigured → no events, no error shown. | In dev the client connects same-origin (`/socket.io`) through the Vite proxy → backend port **5001**. Check the socket state in DevTools or with `curl http://localhost:5001/socket.io/?EIO=4&transport=polling`. |
| 6 | Not **rate-limited** | Global API limiter, auth limiter etc. can 429 you during heavy testing. | Dev `server/.env` already overrides to generous values (`RATE_LIMIT_API=6000`, `RATE_LIMIT_AUTH=600`, `RATE_LIMIT_LOGIN=1000`, `RATE_LIMIT_OTP=10`). See "Rate limits" in Pitfalls below. |

### The 10-line mental model

```
passenger POST /api/rides
  → rideService.createRide
    → findAdmins()  → notify every admin (in-app + `admins` room)
    → findNearbyDrivers({ lat, lng, radius: 10km, vehicleType })
        filters: role=driver, isAvailable, matching vehicleType
    → io.to(`user:{driverId}`).emit('ride:new', { ride })   // per driver
driver dashboard onRideNew → request card → Accept
```

## 2. Live location sharing (passenger ↔ driver)

Two symmetric socket events, both forwarded **only** to the ride's room so nobody else
sees positions:

- `driver:location { driverId, lat, lng, heading, speed }` → passenger's `/rides/track/:id`.
- `passenger:location { passengerId, lat, lng, heading, speed }` → driver's **Active ride panel**.

Server rules (`server/src/config/socket.js`):
- A client may only **join** `ride:{rideId}` if it is that ride's `passenger`, its
  assigned `driver`, or an `admin` (new authorization guard — without it anyone who
  guessed a rideId could eavesdrop on live locations).
- Position forwards are looked up against the driver/passenger's **active** ride
  (`accepted / arriving / in_progress`) — no active ride, no forwarding.
- Client broadcasts are throttled to **1 per 2 s** (`lastSent` refs in the dashboards).

Client wiring:
- Passenger: `RideTracking.jsx` subscribes via `onDriverLocation` and broadcasts its own
  `emitPassengerLocation` while the ride is active. A `driverRef` keeps the driver id
  current so the socket handler never reads a stale `ride` object (see Pitfall #2).
- Driver: `Dashboard.jsx` → `ActiveRidePanel.jsx` shows pickup/dropoff pins, the live
  passenger pin (`PIN_USER`, blue), your own pin, the route polyline, and the status
  buttons (Arriving at pickup → Start trip → Complete trip). The request feed hides while
  you're serving a ride.

## 3. Maps auto-display the user's current area

- `useGeolocation` (hooks/useGeolocation.js) resolves the browser position on mount.
- **Reservations** (`Reservations.jsx`): when position resolves, the pickup is auto-set to
  `Current location` and the map **flies to you** — a `CenterFollower` component animates the
  Leaflet map to the resolved position (a static `center` prop only applies on mount, so the
  follower re-centers on every fix). A green `.map-pin-start` marker confirms the pickup and a
  **blue `.map-pin-user` "You are here" dot** shows your live position (pulsing when active).
  A **LocateButton** ("Use my location") and an amber banner appear when no pickup is set yet
  or geolocation was denied — clicking it re-requests the browser position and re-centers.
- **Driver dashboard / ActiveRidePanel**: centers on the driver's own position.
- Browser permission prompt: allow geolocation for `localhost:5173` or override it in
  automated tests (see E2E below). If denied, the map falls back to the DEFAULT_CENTER
  (~Ellicott City, MD) and the amber banner offers the **Use my location** retry.

## 4. Localhost setup, test & verify

### Setup
```bash
cd client && npm install
cd ../server && npm install
cp .env.example .env            # add MONGO_URI, JWT_SECRET, etc.

# Terminal 1 — backend (port 5001)
cd server && npm run seed       # fresh users + driver positions (Howard County, MD)
cd server && npm run dev

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

> macOS: port 5000 is often taken by AirPlay/ControlCenter; the backend defaults to 5001
> and `client/vite.config.js` proxies to it. If you change it, update both.

### Verify the happy path end-to-end (manual)
1. **Driver** → open `http://localhost:5173/driver`, login `alex@ridetaxi.com` /
   `driver123`, slide the **On duty** switch on (watch the status flip to *On duty*).
2. **Passenger** (separate browser or incognito window — see Pitfall #1) → login
   `passenger@ridetaxi.com` / `pass123`, open `/reservations`. Allow geolocation and check
   the map centers on you and pickup reads **Current location**.
3. Pick the same vehicle Alex has (**Executive Sedan**), set a dropoff, submit. You land on
   `/rides/track/:id`.
4. Back on the driver screen: a request card appears within a second → **Accept**.
5. Driver screen now shows the **Active ride** map. Passenger screen shows the driver's
   live red pin + "Driver on the way".
6. Driver taps **Arriving at pickup → Start trip → Complete trip**. Passenger screen
   updates through each status; ride completes with the final fare.

### Automated verification (optional)
Socket-level + headless-browser E2E scripts live in
`/var/folders/z0/jy9n_94s04b2j11ql_7kk_xr0000gn/T/opencode/` (`e2e-location.js`,
`e2e-browser-live.js`). They cover:
- passenger→driver location forwarding (3 events, matched to the ride room),
- driver→passenger location forwarding,
- room isolation (a stranger cannot join `ride:{id}` and must receive 0 events),
- the full browser flow above, including Reservations auto-pickup.

Run them with the server + Mongo up; restart the backend first so in-memory rate limits
are fresh (see Pitfall #3).

## 5. Common pitfalls

1. **Two roles in one browser used to conflict.** Tokens are now stored **per role**
   (`rt_admin_*`, `rt_driver_*`, `rt_passenger_*`) with a per-tab active-role marker in
   sessionStorage, so the passenger, driver, and admin can all be signed in at once in
   different tabs — logging in as the admin no longer logs out the driver tab. (A `403
   Insufficient permissions` still auto-clears the offending token and redirects to
   `/login` if you ever hit a stale mixed session.)
2. **Stale closures in socket handlers.** A handler registered once that reads `ride`
   from its closure keeps the mount-time value (e.g. `ride?.driver?._id` was `null`, so the
   driver pin never appeared). Keep changing values in a `useRef` updated by a separate
   effect and read `ref.current` inside the handler.
3. **Rate limits are in-memory per instance** and don't reset on config changes: hitting
   429 during a test run doesn't mean the app is broken. `touch server/src/index.js` to
   restart nodemon and clear the counters. In dev, `server/.env` already raises the limits
   (`RATE_LIMIT_API=6000`, `RATE_LIMIT_AUTH=600`, `RATE_LIMIT_LOGIN=1000`) so normal testing
   never trips them. In production, back them with a shared store (Redis) if you run
   multiple instances.
4. **TTL wipes driver positions.** The `Location` collection auto-deletes after 10 min. If
   a driver's map shows no nearby drivers, re-seed or have the driver go online again.
5. **Socket rooms require handshake auth.** The server only trusts `socket.auth`
   (`{ userId, role }`) sent at connect time. An empty/absent auth means no `user:{id}`,
   `drivers`, or `admins` room membership → no dispatch, no ride:new.
6. **Vite proxy / ports.** Backend on 5001, frontend 5173; the socket connects through the
   frontend origin. If you move ports, update `vite.config.js` and the proxy targets.
7. **EADDRINUSE after crashes.** `lsof -ti:5001 | xargs kill -9` before restarting.

## 6. Debugging tips

- **DevTools → Network** filter `api|socket.io`: watch `ride:new` won't appear here (it's a
  socket event), but REST accept/location calls will. Check for 403/429/401 and the exact
  message in the response body.
- **socket.io event tracing**: in the browser console run
  `import('/src/services/socketService.js').then(m=>m.default.onAny((e,...a)=>console.log(e,a)))`
  — or add `localStorage.debug='socket.io-client:socket'` for the client debug logger.
- **Server side**: add a temporary `console.log` in `socket.js` `ride:new`/`driver:location`
  handlers, or check the nodemon terminal. `curl http://localhost:5001/api/health` returns
  `RateLimit-Remaining` headers — useful to confirm the limiter state.
- **Data checks** (`mongosh mongodb://127.0.0.1:27017/ridetaxi`):
  - `db.locations.find({}, {coordinates:1, updatedAt:1})` — driver positions fresh?
  - `db.rides.find({status:{$in:["pending","accepted","arriving","in_progress"]}},{status:1,driver:1})`
    — active rides and assigned drivers.
  - `db.users.find({role:"driver"}, {email:1, "driverDetails.isAvailable":1})` — availability.
- **Driver not in room**: confirm the client sent `socket.auth` (check the socket handshake
  packet in DevTools Network → WS frame).

## 7. Tools & libraries used

| Concern | Library | Notes |
|---------|---------|-------|
| Real-time transport | `socket.io` (server) + `socket.io-client` (client) | Rooms `user:{id}`, `drivers`, `admins`, `ride:{rideId}`; auth via handshake `auth`. |
| Maps | `leaflet` + `react-leaflet` + OpenStreetMap tiles | Free, no API key. Pins are inline SVG strings (`pinIcons.js`), route polyline is `#c62828`. |
| Routing / distance | OSRM (`router.project-osrm.org`) | Returns distance/duration/polyline used for fares + driver ETA. |
| Geocoding | Nominatim | Autocomplete in `LocationSearch`; 1 req/s rate limit, set a `User-Agent`. |
| Browser geolocation | `useGeolocation` hook | Wraps `navigator.geolocation`; resolves on mount. |
| E2E automation | `puppeteer-core` + Brave headless | CDP `overridePermissions` + `setGeolocation` simulate a device location for deterministic tests. |