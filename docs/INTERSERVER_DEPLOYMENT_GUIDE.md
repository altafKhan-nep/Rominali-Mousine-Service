# Interserver Deployment Guide — Romina Limousine Service

Production deployment of the MERN + Socket.io stack on an **InterServer VPS**: nginx terminates
SSL and serves the Vite build, PM2 keeps the API alive, MongoDB stores the data.

> **Why a VPS:** InterServer shared hosting (cPanel) is PHP-only. Node + WebSockets + PM2
> require a **Standard VPS** (KVM, root SSH).

> **Stack versions:** Ubuntu **24.04 LTS** (noble) · Node **24** LTS · MongoDB **8.0** · nginx

---

## 0. Architecture

```
Internet → nginx (443 SSL, gzip, static cache)
             ├─ /            → client/dist (React build)
             ├─ /api/        → PM2 → Node Express + Socket.io (127.0.0.1:5001)
             └─ /socket.io/  → PM2 → Socket.io  (Upgrade headers required)
          → MongoDB 8.0 (127.0.0.1:27017, local on the same VPS)
```

Single-origin by design: the client calls `/api` relatively (`api.js` → `API_ROOT = ''`), so
**no `VITE_API_URL` is needed** and there is no CORS preflight on the happy path.

### Sizing
| Plan | Cores | RAM | Verdict |
|---|---|---|---|
| 1 Slice | 1 | 2 GB | Runs, but `npm run build` is tight — swap required |
| 2 Slices | 1 | 4 GB | Fine |
| **3 Slices** | **2** | **6 GB** | **Recommended** ($9/mo) |
| 4 Slices | 2 | 8 GB | Works; you pay for unused RAM |

Steady-state usage is roughly 1–1.3 GB (Node ~200 MB, Mongo ~400 MB, nginx ~20 MB, OS ~400 MB).
The only real spike is `npm run build` (~1.5–2.5 GB). CPU stays idle — this is one Node process,
I/O-light and low-traffic — so **RAM is the constraint, not cores.** Note 3 and 4 slices both
have 2 cores; extra slices only add RAM/storage.

---

## 1. Order the VPS

1. https://www.interserver.net/vps/ → **Order** → **Standard VPS** → **Ubuntu 24.04 LTS**.
2. Pick **`3 Slices`** (2 cores, 6 GB RAM, 120 GB SSD, 6 TB transfer).
3. Add your SSH public key (or set a strong root password and save it).
4. You receive an email with the **IP** (e.g. `66.45.240.12`), **root password**, and a
   **Serial Console** link.
   ```bash
   ssh root@66.45.240.12
   ```

---

## 2. First Boot — Harden & Install (root)

```bash
# 1. Base
apt update && apt upgrade -y
apt install -y curl git gnupg ufw nginx build-essential

# 2. Node 24 LTS + PM2
#    NOT Node 20: it reached end-of-life 2026-04-30 and no longer receives
#    security patches. 24 is LTS until April 2028.
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
node -v            # v24.x
npm -v
npm install -g pm2

# 3. MongoDB 8.0 — the only version with a 24.04 ("noble") repo.
#    `apt install mongodb` does not exist on any Ubuntu, and MongoDB 7.0
#    publishes no noble repo, so the old jammy/7.0 line fails to resolve.
curl -fsSL https://pgp.mongodb.com/server-8.0.asc \
  | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
  | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
apt update && apt install -y mongodb-org
systemctl enable mongod && systemctl start mongod
systemctl status mongod --no-pager | head -3

# 4. Certbot (noble ships 2.9.0). EFF recommends the snap instead:
#    apt remove -y certbot python3-certbot-nginx
#    snap install certbot --classic && ln -s /snap/bin/certbot /usr/local/bin/certbot
apt install -y certbot python3-certbot-nginx

# 5. Swap — guarantees the build never OOMs
fallocate -l 2G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h

# 6. deploy user — never run Node as root
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.ssh

# 7. Firewall — SSH, HTTP, HTTPS only. 5001 stays closed.
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 8. PM2 boot hook (run the sudo line it prints)
pm2 startup systemd -u deploy --hp /home/deploy

su - deploy
```

---

## 3. Clone & Build

```bash
cd ~
git clone https://github.com/altafKhan-nep/Rominali-Mousine-Service.git ridetaxi
cd ridetaxi

# --- Backend env ---
cp server/.env.example server/.env
nano server/.env
```

```bash
# Generate two DIFFERENT secrets (48 bytes each):
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

```
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/ridetaxi
JWT_ACCESS_SECRET=<48 hex>
JWT_REFRESH_SECRET=<different 48 hex>
CLIENT_ORIGIN=https://yourdomain.com
APP_URL=https://yourdomain.com
TRUST_PROXY=true                 # behind nginx: keeps req.ip + rate limits correct
RATE_LIMIT_API=2000               # driver + CRM poll every 8s; default 600 will 429

# Email — without these the contact form, email verification and password
# reset silently do nothing (they only print to pm2 logs).
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your gmail>
SMTP_PASS=<16-char Google App Password>
SMTP_FROM=<your gmail>

# Optional feature unlocks
STRIPE_SECRET_KEY=sk_live_...        # real card payments (else sandbox simulator)
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT
```

```bash
# --- Frontend env: normally NOT needed (same-origin) ---
# client/.env only matters if the API lives on a different domain:
#   VITE_API_URL=https://api.yourdomain.com
#   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
#   VITE_GOOGLE_CLIENT_ID=...

# --- Install & build ---
cd client && npm ci && npm run build          # → client/dist
cd ../server && npm ci --omit=dev
npm run seed                                   # once: admin + driver/passenger accounts

# Smoke-test the built server before handing it to PM2
mkdir -p logs
NODE_ENV=production node src/index.js & sleep 4
curl http://localhost:5001/api/health          # {"status":"ok"}
kill %1
```

---

## 4. PM2

The repo ships `ecosystem.config.js`. Run it as-is:

```bash
cd ~/ridetaxi
pm2 start ecosystem.config.js --env production
pm2 save
pm2 status
pm2 logs --lines 30
curl http://localhost:5001/api/health
```

**What it configures, and why:**

| Setting | Value | Reason |
|---|---|---|
| `instances` | `1` | **Must stay 1.** Socket.io rooms are per-process and there is no Redis adapter, so a second worker silently drops live tracking, the driver feed and notifications for sockets on the other worker. |
| `exec_mode` | `fork` | Paired with `instances: 1`. `cluster` only makes sense with a Redis adapter. |
| `max_memory_restart` | `400M` | Restarts the API before it can OOM the box. |
| `exp_backoff_restart_delay` | `100` | Absorbs a slow Mongo wake-up on boot. |
| `error_file` / `out_file` | `./logs/…` | Relative to `cwd` (`./server`), so it works for any SSH user/path. |
| `autorestart` / `max_restarts` | on / 10 | Survives crashes without a restart loop. |

> `pm2 reload` on a single `fork` instance is a brief restart (sub-second), not a true
> zero-downtime rolling reload. To scale beyond one worker later, add
> `@socket.io/redis-adapter` **first** — then `instances` can rise safely.

---

## 5. nginx

```bash
sudo nano /etc/nginx/sites-available/ridetaxi
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com 66.45.240.12;

    # Rate-limit ONLY the login endpoint. Do NOT attach this to all of /api/ —
    # the driver app and admin CRM poll every 8s and would be throttled.
    limit_req_zone $binary_remote_addr zone=login:10m rate=20r/m;

    root /home/deploy/ridetaxi/client/dist;
    index index.html;

    # Base64 profile avatars are ~683KB; nginx defaults to a 1MB body cap.
    client_max_body_size 2m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss image/svg+xml;
    gzip_min_length 1024;

    location = /api/auth/login {
        limit_req zone=login burst=20 nodelay;
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSockets — the Upgrade headers are mandatory or live tracking dies.
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 600s;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # The service worker must never be cached, or users get a stale app.
    location = /sw.js { add_header Cache-Control "no-cache"; }

    location / { try_files $uri $uri/ /index.html; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ridetaxi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
curl http://localhost/api/health        # through nginx → {"status":"ok"}
```

---

## 6. Domain & SSL

1. **InterServer panel → Domains** → point `A` records at your VPS IP.
2. Wait for DNS (`dig yourdomain.com` shows your IP; 5 min – 2 h).
3. ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com   # Redirect
   sudo certbot renew --dry-run
   ```
4. Update `CLIENT_ORIGIN` and `APP_URL` in `server/.env` to `https://yourdomain.com`, then:
   ```bash
   pm2 reload ecosystem.config.js --env production
   sudo systemctl reload nginx
   ```

Verify: site loads, `/api/health` is `ok`, booking → driver feed → tracking works over the socket.

---

## 7. Backups

A VPS is a single point of failure. InterServer has no automatic snapshot of your database.

```bash
mkdir -p /home/deploy/backups
crontab -e
```
```
17 3 * * * mongodump --db ridetaxi --archive=/home/deploy/backups/ridetaxi-$(date +\%F).gz --gzip && find /home/deploy/backups -name '*.gz' -mtime +7 -delete
```
Restore: `gunzip -c ridetaxi-YYYY-MM-DD.gz.gz | mongorestore --db ridetaxi --drop`

---

## 8. Deploy Updates

```bash
cd ~/ridetaxi
git pull origin main
cd client && npm ci && npm run build
cd ../server && npm ci --omit=dev
cd ~/ridetaxi && pm2 reload ecosystem.config.js --env production
sudo systemctl reload nginx
pm2 logs --lines 20
```

Or `bash scripts/deploy-interserver.sh`.

---

## 9. Optimizations Already in the Repo

| Area | What | Why |
|---|---|---|
| **Build** | `vite.config.js` `manualChunks` (vendor/maps/query) + `lazy()` per route | Small initial bundle; build finishes fast, no OOM |
| **Images** | `client/public/images/*` served with `loading="lazy"` + `img-zoom` | Cuts bandwidth on metered transfer |
| **Cache** | `rideService.js` geocode cache 10m, route cache 5m, `AbortSignal.timeout(5000)` | Respects Nominatim's 1 req/s; no OSRM hang |
| **DB** | `Ride.js` indexes on `passenger+status`, `driver+status`, `driver+createdAt` | Active-ride lookup is indexed |
| **Socket auth** | JWT-only, rooms authorized per ride | No unauthenticated location broadcast |
| **Security** | `helmet`, `express-rate-limit` (+ `TRUST_PROXY=true`), rotating hashed refresh tokens | Correct client IP behind nginx; no replay |
| **PM2** | `instances: 1`, `fork`, `max_memory_restart 400M`, backoff | Correct for Socket.io on a single box |

---

## 10. Gotchas

| Symptom | Cause | Fix |
|---|---|---|
| `502` and health check is `ok` | **AppArmor** blocks nginx proxying (stricter on 24.04) | `journalctl -xe \| grep -i denied` → `sudo aa-complain /usr/sbin/nginx && sudo systemctl reload nginx` |
| `502` and health check fails | API not running | `pm2 status`, `pm2 logs`, `curl localhost:5001/api/health` |
| `502` from nginx on install | Port 5001 bound but no process | `ss -lntp \| grep 5001` |
| Driver feed never updates | `instances` > 1 (no Redis adapter) | Keep `instances: 1`; verify the `/socket.io/` block |
| `429` on login | nginx `limit_req` + Express limiter both firing | Raise `RATE_LIMIT_LOGIN`, or drop the nginx zone |
| `429` across the app | nginx rate limit applied to all of `/api/` | Scope it to `= /api/auth/login` only |
| `CORS` in console | `CLIENT_ORIGIN` ≠ actual origin | Match exactly, including `https://` |
| Emails never arrive | `SMTP_*` unset | Check `pm2 logs`; verify the Gmail App Password |
| Avatar upload `413` | nginx body cap | `client_max_body_size 2m;` |
| Stale app after deploy | service worker cached | `location = /sw.js { add_header Cache-Control "no-cache"; }` |
| `apt install mongodb` fails | Package doesn't exist anywhere | Use the MongoDB 8.0 repo (Step 2) |
| MongoDB won't install on 24.04 | Using `jammy`/7.0 | 7.0 has no noble repo — use `noble` + 8.0 |
| Build `Killed` | Not enough RAM | Add swap (Step 2) or use 3+ Slices |

---

## 11. Post-Launch Checklist

- [ ] `https://yourdomain.com/api/health` → `ok` through nginx
- [ ] Site loads and **booking → driver feed → tracking** works end-to-end (WebSocket)
- [ ] `pm2 status` shows **1** online; `pm2 logs` clean; `certbot renew --dry-run` succeeds
- [ ] `curl -I https://yourdomain.com/assets/index-*.js` → `cache-control: public, immutable`
- [ ] `npm run seed` run once; **admin password changed**
- [ ] `JWT_*_SECRET` long, random and different · `TRUST_PROXY=true` · `NODE_ENV=production`
- [ ] `SMTP_*` set and a test contact-form email arrives
- [ ] `mongodump` cron present; verify one restore
- [ ] `ufw` on: only 22 / 80 / 443

---

*Companion: `INTERSERVER_SIMPLE_GUIDE.md` (short path) · `BROWSER_TESTING_GUIDE.md` (QA) · `TECHNICAL_GUIDE.md` (architecture) · `DEPLOYMENT_GUIDE.md` (Render + Vercel alternative).*
