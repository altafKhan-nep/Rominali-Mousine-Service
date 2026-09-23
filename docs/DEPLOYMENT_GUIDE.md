# Deployment Guide — Ellicott City Airport Taxi (100% free hosting)

Deploy the full stack (React frontend + Express/Socket.io backend + MongoDB) to the
internet for free using:

| Layer | Host | Free plan | What you get |
|-------|------|-----------|--------------|
| Database | **MongoDB Atlas** | M0 shared cluster | 512 MB storage, always on |
| Backend | **Render** | Free web service | Node + **WebSockets**, ~15 min idle sleep, 750 h/month |
| Frontend | **Vercel** | Hobby | Static hosting of the Vite build, custom domains |

All three are no-card-required. The repo is already deploy-ready: the client reads the
backend origin from `VITE_API_URL` (used for **both** REST and Socket.io), and the server
reads `PORT`, `CLIENT_ORIGIN`, `MONGO_URI`, `TRUST_PROXY`, etc. from env vars — nothing is
hardcoded.

> **Time estimate:** ~30 minutes, mostly account creation.

---

## 1. MongoDB Atlas (database)

1. Create a free account at https://www.mongodb.com/cloud/atlas/register → free M0 cluster.
   It takes ~2 min to provision.
2. Go to **Database Access** → **Add New Database User**: username + a strong password
   (save these — you'll paste them into the connection string).
3. Go to **Network Access** → **Add IP Address** → **Allow access from anywhere**
   (`0.0.0.0/0`). Free tier doesn't support IP-whitelisting cleanly; use this for the
   public site (MongoDB itself is still password-protected).
4. Go to **Clusters** → your cluster → **Connect** → **Drivers** → copy the connection
   string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Add the database name before the query string so the app's collections live in one db:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ridetaxi?retryWrites=true&w=majority
   ```
   This value is **`MONGO_URI`**.

> `npm run seed` works against the hosted DB too (it wipes + reseeds demo users) — run it
> once after the backend is up if you want the demo accounts on production.

---

## 2. Render — backend web service

1. Create a free account at https://render.com → **New +** → **Web Service** → connect the
   GitHub repo containing this project.
2. Service settings:
   | Field | Value |
   |-------|-------|
   | Name | `ridetaxi-api` (anything) |
   | **Root Directory** | `server` |
   | Environment | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Instance type | **Free** |
3. **Add the environment variables** (Render → your service → **Environment**):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | *(leave unset — Render injects its own)* |
   | `MONGO_URI` | the Atlas string from step 1 |
   | `JWT_ACCESS_SECRET` | long random string (see below) |
   | `JWT_REFRESH_SECRET` | a *different* long random string |
   | `ACCESS_TOKEN_EXPIRY` | `15m` |
   | `REFRESH_TOKEN_EXPIRY` | `7d` |
   | `REMEMBER_ME_EXPIRY` | `30d` |
   | `CLIENT_ORIGIN` | `https://<your-frontend>.vercel.app` (set after step 3) |
   | `APP_URL` | `https://<your-render-service>.onrender.com` |
   | `TRUST_PROXY` | `true` (Render sits behind a proxy — this keeps `req.ip` + rate limits correct) |
   | `RATE_LIMIT_API` | `600` (or raise it for a busy site) |
   | `RATE_LIMIT_AUTH` | `60` |
   | `RATE_LIMIT_LOGIN` | `20` (default is 10/15 min — bump it so real customers aren't locked out) |
   | `RATE_LIMIT_OTP` | `5` |
   | `STRIPE_SECRET_KEY` | your `sk_test_…` key (from local `server/.env`) |
   | `STRIPE_PAYMENT_METHOD_DOMAIN` | your `pmd_…` value (informational) |
   | `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | *(optional)* enable web-push |
   | `SMTP_HOST/PORT/SECURE/USER/PASS/FROM` | *(optional)* real emails (see §5) |
   | `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET`, `TWILIO_*` | *(optional)* leave empty to disable |

   Generate the JWT secrets, e.g.:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Run twice and use two different values.

4. Deploy → after it builds you get a URL like `https://ridetaxi-api.onrender.com`.
   Verify:
   ```bash
   curl https://ridetaxi-api.onrender.com/api/health   # → {"status":"ok"}
   ```
   (First request can take 30–60 s while the free instance wakes up.)

> **Free tier notes**
> - Render free web services **sleep after ~15 min** without traffic and cold-start in
>   ~30–60 s. Keep it warm with a free **UptimeRobot** ping: add an HTTP monitor for
>   `https://<your-api>.onrender.com/api/health` every 5 min. That also puts you back in
>   the monthly 750-hour limit with margin.
> - The instance filesystem is **ephemeral** — fine here, all data lives in Atlas.
> - **WebSockets work** on free services, so live tracking works in production.

---

## 3. Vercel — frontend

1. Create a free account at https://vercel.com → **Add New…** → **Project** → import the
   same GitHub repo.
2. Project settings:
   | Field | Value |
   |-------|-------|
   | **Root Directory** | `client` |
   | Framework Preset | Vite (auto-detected) |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
3. **Environment Variables** (Vercel → Project → Settings → Environment Variables):
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://<your-render-service>.onrender.com` — **no trailing slash** |
   | `VITE_STRIPE_PUBLISHABLE_KEY` | your `pk_test_…` key (from local `client/.env`) |
   | `VITE_GOOGLE_CLIENT_ID` / `VITE_FACEBOOK_APP_ID` | *(optional)* social buttons |
4. Deploy → you get `https://<project>.vercel.app`. Copy this URL back into Render's
   `CLIENT_ORIGIN` and redeploy the backend (or just edit the env var — Render auto-restarts).

> Setting `VITE_API_URL` makes every REST call **and** the Socket.io connection go straight
> to your Render backend (CORS is allowed because `CLIENT_ORIGIN` matches). Leave it unset
> only when the frontend and backend share one origin.

---

## 4. Verify the live site

1. Open `https://<your-frontend>.vercel.app` — marketing pages, hero, booking card load.
2. **Reservations**: allow geolocation → map flies to you, pickup auto-fills with your real
   reverse-geocoded address, nearby drivers load (seed them first if you want the demo
   drivers).
3. **Real-time**: open the driver dashboard in a second tab → slide **On duty** → request a
   ride as the passenger in the first tab → the driver's tab gets the request card within a
   second → accept → live pins move both ways.
4. **Payments**: complete a ride → **Pay** → choose **Card/online** → enter Stripe test card
   `4242 4242 4242 4242` → succeeds. Or choose **Cash**.
5. **Admin**: `https://<frontend>.vercel.app/admin` → Overview / Rides / Payments / Settings
   all load with live socket updates.

---

## 5. Optional extras before you tell customers

- **Real email (verification + password reset).** Set the `SMTP_*` vars on Render using a
  Gmail account + App Password:
  1. Enable 2-Step Verification, then create an App Password at
     https://myaccount.google.com/apppasswords.
  2. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`,
     `SMTP_USER=<gmail>`, `SMTP_PASS=<16-char app password>`,
     `SMTP_FROM=Ellicott City Airport Taxi <gmail>`.
  Without SMTP, dev-only console fallbacks are used, so links may not actually reach users.
- **Web push.** `npx web-push generate-vapid-keys --json` → set the VAPID keys on Render;
  the bell icon then offers browser notifications.
- **Live Stripe payments.** Swap `sk_test_…`/`pk_test_…` for **live** keys (Stripe account
  verification required) and add the Stripe **webhook** for settlement edge cases. Until
  then the site runs in Stripe test mode — test cards succeed but no real money moves.
- **Custom domain.** Buy a domain (e.g. via Namecheap/Cloudflare) and add it in both Vercel
  (frontend, ~5 min) and Google OAuth console if using social login. Update `CLIENT_ORIGIN`
  on Render to the new domain.
- **Seat the demo data.** Run `npm run seed` once on Render (Render → service → **Shell**)
  to create the admin/passenger/driver accounts, or create real accounts via the UI.

---

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Page loads but data calls fail | `VITE_API_URL` missing/wrong, or backend sleeping | Set it to the Render URL (no trailing `/`); redeploy. First hit wakes the backend |
| `CORS` errors in console | `CLIENT_ORIGIN` on Render ≠ the actual frontend origin (incl. `https://`) | Set `CLIENT_ORIGIN=https://<your-frontend>.vercel.app` and redeploy backend |
| Live tracking / request feed doesn't update | Socket.io can't reach the backend | Ensure `VITE_API_URL` is set on Vercel (socket uses it); backend must be awake |
| `429 Too many requests` | Rate limits (esp. login=10) | Raise `RATE_LIMIT_*` on Render |
| Cold-start lag after idle | Free tier sleeps after ~15 min | UptimeRobot pings keep it warm |
| Mixed-content warnings | Frontend http / backend https (or vice versa) | Both must be `https` (default on Vercel/Render) |
| Email never arrives | SMTP unset | Set `SMTP_*` (Gmail app password) — see §5 |

---

## 7. Post-launch checklist

- [ ] Backend `/api/health` returns `ok`
- [ ] Frontend live at `https://<project>.vercel.app`
- [ ] Booking → live driver feed → tracking works end-to-end
- [ ] Card (test `4242…`) + cash payments work
- [ ] Admin dashboard live-updates on new rides
- [ ] UptimeRobot monitor on `/api/health`
- [ ] SMTP configured (verification/reset emails actually send)
- [ ] JWT secrets are long/random and different
- [ ] Decide: keep demo accounts or disable the seed

*Companion docs: `BROWSER_TESTING_GUIDE.md` (manual QA), `TECHNICAL_GUIDE.md`
(architecture), `REAL_TIME_GUIDE.md` (sockets/location).*