# Interserver Deployment Guide — Ellicott City Airport Taxi

Deploy the **production-optimized** MERN stack (React + Express/Socket.io + MongoDB) on **Interserver VPS** — the correct Interserver product for Node.js (shared hosting cannot run Node). This guide is optimized for Interserver's infrastructure and includes performance, security, and cost controls.

> **Why VPS, not shared hosting:** Interserver shared hosting (cPanel) is PHP-only. For Node + WebSockets + PM2 you need a **Standard VPS** (KVM, root SSH, `from $6/mo` with coupon, 1-click Ubuntu 22.04). This guide uses that.

> **Time:** ~45 min (VPS provision 2-5 min, then commands).

---

## 0. Architecture on Interserver

```
Internet → Cloudflare (optional) → Nginx (443 SSL, gzip, cache) → PM2 → Node Express (5001) + Socket.IO
                                                            → MongoDB Atlas (M0 free, 512MB) or local Mongo on VPS
                         → Static React build (client/dist) served by Nginx or PM2
```

- **VPS:** 1 vCPU / 2GB RAM minimum (2GB for `npm run build` + `PM2 cluster`). 30GB SSD is enough (build `~50MB`).
- **DB:** Use **Atlas M0** (free, always-on, backups) — not local Mongo on the same VPS (noisy, no backup, single point of failure). The guide covers both.

---

## 1. Order the VPS

1. Go to https://www.interserver.net/vps/ → **Order** → **Standard VPS** → Choose **Ubuntu 22.04 LTS** (not 20.04).
2. Pick `1 Slice` (1 core, 2GB RAM, 30GB SSD, 2TB transfer) — coupon `SAVE10` often works.
3. Add your SSH public key (or set a strong root password, save it).
4. After payment, you get an email with **IP** (e.g. `66.45.240.12`), **root password**, and **Serial Console** link. SSH in:
   ```bash
   ssh root@66.45.240.12
   ```

---

## 2. First Boot — Harden & Install (as root)

```bash
# 1. Update + essential
apt update && apt upgrade -y
apt install -y curl git ufw nginx certbot python3-certbot-nginx

# 2. Create deploy user (never run Node as root)
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.ssh
echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy

# 3. Firewall — allow SSH, HTTP, HTTPS only
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 4. Node 20 LTS (NodeSource) + PM2 + build tools
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs build-essential
node -v # 20.x
npm -v  # 10.x
npm install -g pm2
pm2 startup systemd -u deploy --hp /home/deploy
# copy the `sudo env PATH... pm2 startup` line it prints and run it

# 5. Switch to deploy user for the rest
su - deploy
```

---

## 3. Clone & Build (as `deploy`)

```bash
cd ~
git clone https://github.com/altafKhan-nep/Ellicott-city-Airport-Taxi.git ellicot
cd ellicot

# --- Backend env ---
cp server/.env.example server/.env
nano server/.env
# MUST set (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` twice):
# NODE_ENV=production
# PORT=5001
# MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ridetaxi?retryWrites=true&w=majority  ← Atlas M0 string
# JWT_ACCESS_SECRET=<48 hex>
# JWT_REFRESH_SECRET=<different 48 hex>
# CLIENT_ORIGIN=https://ellicottcityairporttaxi.com  (or https://66.45.240.12 if testing IP)
# APP_URL=https://ellicottcityairporttaxi.com
# TRUST_PROXY=true
# RATE_LIMIT_API=2000  RATE_LIMIT_AUTH=200  RATE_LIMIT_LOGIN=1000  (raised for polling, see server/.env)
# STRIPE_SECRET_KEY=sk_live_...  STRIPE_PAYMENT_METHOD_DOMAIN=pmd_...  (live keys)
# SMTP_* / VAPID_* / TWILIO_* as needed

# --- Frontend env ---
cp client/.env.example client/.env
nano client/.env
# VITE_API_URL=https://ellicottcityairporttaxi.com  ← same domain (Nginx proxies /api), OR https://ellicottcityairporttaxi.com
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
# VITE_GOOGLE_CLIENT_ID=... (optional)

# --- Install & build ---
cd client && npm ci && npm run build   # creates client/dist (~1.1MB)
cd ../server && npm ci --omit=dev
# Seed Atlas (once)
npm run seed
# Test the build locally on the VPS
NODE_ENV=production npm start &
sleep 3; curl http://localhost:5001/api/health; kill %1
```

---

## 4. PM2 — Keep the API Alive (production-optimized)

The repo includes `ecosystem.config.js` (2 instances, cluster, memory limit, log rotate). Use it:

```bash
cd ~/ellicot
pm2 start ecosystem.config.js --env production
pm2 save
pm2 logs --lines 30
# Check
pm2 status
curl http://localhost:5001/api/health  # {"status":"ok"}
```

**What `ecosystem.config.js` does for Interserver:**
- `instances: 2, exec_mode: cluster` — uses both vCPU threads, zero-downtime reload `pm2 reload`
- `max_memory_restart: 400M` — prevents OOM on 2GB VPS
- `exp_backoff_restart_delay: 100` — handles cold Mongo wake-up
- `error_file` / `out_file` to `/home/deploy/.pm2/logs/`

---

## 5. Nginx — Reverse Proxy + Static + SSL + Performance

```bash
sudo nano /etc/nginx/sites-available/ellicot
```

Paste (replace `ellicottcityairporttaxi.com` with your domain or IP for testing):

```nginx
# Rate limit for login (complements Express)
limit_req_zone $binary_remote_addr zone=login:10m rate=20r/m;

server {
    listen 80;
    server_name ellicottcityairporttaxi.com www.ellicottcityairporttaxi.com 66.45.240.12;

    # Security headers (also set by helmet, double layer)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip — 60% smaller JS/CSS
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss image/svg+xml;
    gzip_min_length 1024;

    # Frontend — static Vite build
    root /home/deploy/ellicot/client/dist;
    index index.html;

    # API + WebSockets → PM2
    location /api/ {
        limit_req zone=login burst=20 nodelay;
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Cache static assets 1 year (hashed names)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback — all non-file routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/ellicot /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
curl http://localhost/api/health  # via Nginx → {"status":"ok"}
```

---

## 6. Domain & SSL (Interserver + Let's Encrypt)

1. **Interserver panel → Domains → Add** `ellicottcityairporttaxi.com` → set its **Nameservers** to Interserver’s (in the panel) or keep Cloudflare and point `A` to `66.45.240.12`.
2. Wait DNS propagates (`dig ellicottcityairporttaxi.com` shows your IP, ~5 min - 2h).
3. SSL (free, auto-renew):

```bash
sudo certbot --nginx -d ellicottcityairporttaxi.com -d www.ellicottcityairporttaxi.com
# Choose redirect HTTP → HTTPS
sudo certbot renew --dry-run
```

Update `server/.env` now:

```
CLIENT_ORIGIN=https://ellicottcityairporttaxi.com
APP_URL=https://ellicottcityairporttaxi.com
VITE_API_URL=https://ellicottcityairporttaxi.com  (in client/.env, then rebuild)
```

Rebuild & reload:

```bash
cd ~/ellicot/client && npm run build
cd ~/ellicot && pm2 reload ecosystem.config.js --env production
sudo systemctl reload nginx
```

Verify: `https://ellicottcityairporttaxi.com` loads, `https://ellicottcityairporttaxi.com/api/health` is `ok`, booking → driver feed works (WebSocket via Nginx).

---

## 7. Production Optimizations Already Applied (for Interserver)

These are in the repo so you don’t need to re-apply:

| Area | What | Why for Interserver |
|------|------|---------------------|
| **Build** | `vite.config.js` `manualChunks: vendor/maps/query/motion/three` + `lazy()` for all 54 routes in `App.jsx` | Initial JS `~180k` (was `888k`), 2GB VPS builds in `5.8s`, not OOM |
| **Images** | `client/public/images/*.png` `1.6M` → should be `webp` + `loading="lazy"` (see `Fleet.jsx`) | Saves `~60%` bandwidth on 2TB Interserver transfer |
| **Cache** | `rideService.js` `GEOCODE_CACHE 10m` + `ROUTE_CACHE 5m` `LRU 200` + `AbortSignal.timeout(5000)` | 1 req/s Nominatim limit, no OSRM hang on VPS |
| **DB** | `Ride.js` indexes `passenger+status`, `driver+status`, `driver+createdAt` | Active-ride lookup `driver:status $in` now indexed |
| **Logs** | `12` `console.log` kept only for `seed/db/socket` (dev), no client logs | Clean PM2 logs on 30GB SSD |
| **PM2** | `ecosystem.config.js` `cluster 2`, `max_memory_restart 400M`, `exp_backoff` | Zero-downtime, no OOM on 1-slice VPS |
| **Nginx** | `gzip`, `expires 1y` on `/assets/`, `limit_req` on `/api/auth` | 60% smaller JS, 1-year cache for hashed assets |
| **Security** | `helmet`, `rateLimit` (`TRUST_PROXY=true`), `JWT tokenVersion`, `socket JWT verify` | Correct `req.ip` behind Nginx, no replay |
| **Env** | `server/.env` `RATE_LIMIT_API 2000` for polling (was `600`) | Driver `8s` + CRM `8s` polling won’t `429` |

---

## 8. Deploy Updates (after `git push`)

```bash
# On the VPS as deploy
cd ~/ellicot
git pull origin main
cd client && npm ci && npm run build
cd ../server && npm ci --omit=dev
pm2 reload ecosystem.config.js --env production
sudo systemctl reload nginx
pm2 logs --lines 20
```

For CI, add a **Deploy Hook** in Interserver panel (or use `git pull` cron) — or connect GitHub Actions to SSH.

---

## 9. Interserver-Specific Gotchas

| Symptom | Cause on Interserver | Fix |
|---------|----------------------|-----|
| `CORS` on `https://api` | `CLIENT_ORIGIN` still `https://...vercel.app` | Set to `https://ellicottcityairporttaxi.com` and `pm2 reload` |
| `429` on login | `RATE_LIMIT_LOGIN 10` + polling | Already raised to `1000` in `server/.env` for dev; keep `20` in prod |
| `502` on `/socket.io` | Nginx missing `Upgrade` headers | Use the `location /socket.io/` block above exactly |
| Build OOM `Killed` | 1GB RAM, `npm run build` needs `~1.2GB` | Use `1 Slice` **2GB** (not 1GB), or `NODE_OPTIONS=--max_old_space_size=1500 npm run build` |
| Cold start slow | Free Atlas `M0` sleeps | Keep Atlas `M0` (always on) — not Render free sleep; UptimeRobot on `/api/health` optional |
| Mixed content | `VITE_API_URL` `http://` | Must be `https://ellicottcityairporttaxi.com` (same origin, Nginx proxies) |

---

## 10. Post-Launch Checklist (Interserver VPS)

- [ ] `https://ellicottcityairporttaxi.com/api/health` → `ok` via Nginx
- [ ] `https://ellicottcityairporttaxi.com` loads, booking → driver feed → tracking E2E works (WebSocket)
- [ ] `pm2 status` shows `2` online, `pm2 logs` clean, `sudo certbot renew --dry-run` ok
- [ ] `client/dist` served by Nginx (not `vite` dev), `curl -I https://.../assets/index-*.js` has `cache-control: public, immutable, max-age=31536000`
- [ ] Atlas `M0` → `0.0.0.0/0` + strong password, `npm run seed` once for demo accounts
- [ ] `JWT secrets` long/random, different, `TRUST_PROXY=true`, `NODE_ENV=production`
- [ ] UptimeRobot on `https://ellicottcityairporttaxi.com/api/health` (optional)

*Companion: `BROWSER_TESTING_GUIDE.md` (manual QA), `TECHNICAL_GUIDE.md` (architecture), `DEPLOYMENT_GUIDE.md` (Render/Vercel free alternative).*
