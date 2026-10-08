# Interserver Simple Deploy — Romina Limousine Service

Deploy **everything on one InterServer VPS** — no Atlas, no Vercel, no Render. One box runs
MongoDB, the Node API, and serves the built website behind nginx.

> **Target:** Ubuntu **24.04 LTS** (noble) · Node **24** LTS · MongoDB **8.0**

---

## Step 1 — Buy VPS + Domain (5 min)

1. **interserver.net** → **VPS** → **Order**
   - **OS:** `Ubuntu 24.04 LTS`
   - **Plan:** **`3 Slices`** — 2 cores, **6 GB RAM**, 120 GB SSD ($9/mo). Plenty: ~1 GB runs the
     app, the rest is build headroom + MongoDB cache. `2 Slices` (4 GB) also works.
   - Save the email with your **IP** (e.g. `66.45.240.12`) and the **root password**.

2. Same panel → **Domains → Register New Domain** → buy your domain.

3. **Domains → Manage → your domain → DNS**
   - Delete old `A` records
   - `A` → `@` → `66.45.240.12`
   - `A` → `www` → `66.45.240.12`

---

## Step 2 — First Login (5 min)

```bash
ssh root@66.45.240.12
```

```bash
apt update && apt upgrade -y
apt install -y curl git gnupg nginx

# Node 24 LTS. NOT 20 — Node 20 reached end-of-life 2026-04-30 and gets no security patches.
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs
node -v                       # expect v24.x

# MongoDB 8.0.
# There is NO `apt install mongodb` — that package does not exist on any Ubuntu.
# MongoDB 7.0 has no repo for 24.04 ("noble"); only 8.0 does. Using the wrong
# repo line makes apt fail to resolve dependencies.
curl -fsSL https://pgp.mongodb.com/server-8.0.asc \
  | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
  | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
apt update && apt install -y mongodb-org
systemctl enable mongod && systemctl start mongod
systemctl status mongod --no-pager | head -3

# Certbot (available in noble's repos). The EFF-preferred alternative is the
# snap: `snap install certbot --classic` — but then remove the apt package first
# so the `certbot` command doesn't clash.
apt install -y certbot python3-certbot-nginx

# Swap — insurance so `npm run build` can never OOM the box
fallocate -l 2G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h                        # confirm Swap: 2.0Gi

npm install -g pm2
adduser deploy                 # set a password when asked
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.ssh
```

---

## Step 3 — Get the Code (2 min)

```bash
su - deploy
cd ~
git clone https://github.com/altafKhan-nep/Rominali-Mousine-Service.git ridetaxi
cd ridetaxi
```

---

## Step 4 — Environment (3 min)

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # run twice, keep both
cp server/.env.example server/.env
nano server/.env
```

```
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/ridetaxi
JWT_ACCESS_SECRET=<first random hex>
JWT_REFRESH_SECRET=<second random hex — must be different>
CLIENT_ORIGIN=https://yourdomain.com
APP_URL=https://yourdomain.com
TRUST_PROXY=true
RATE_LIMIT_API=2000

# Email — REQUIRED or the contact form, email verification and password reset
# silently do nothing (they only print to pm2 logs).
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your gmail>
SMTP_PASS=<16-char Google App Password>
SMTP_FROM=<your gmail>
```

> **App Password:** Google Account → Security → 2-Step Verification → **App passwords** →
> generate one for "Mail". Regular account passwords will not work with SMTP.
> Prefer testing over plain HTTP? Use `http://66.45.240.12` for `CLIENT_ORIGIN`/`APP_URL` for now.

`Ctrl+O`, `Enter`, `Ctrl+X`.

> **`client/.env` is optional.** `api.js` and `socketService.js` default to `/` (same origin),
> which is exactly what the nginx config below provides. Skip it unless you split domains.

---

## Step 5 — Build, Seed, Start (5 min)

```bash
cd ~/ridetaxi/client && npm install && npm run build
cd ../server && npm install && npm run seed

mkdir -p ~/ridetaxi/server/logs
cd ~/ridetaxi
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy   # run the sudo line it prints

curl http://localhost:5001/api/health           # → {"status":"ok"}
```

> ⚠️ **Never raise `instances` above 1 in `ecosystem.config.js`.** Socket.io rooms are
> per-process and there is no Redis adapter, so a second worker silently drops live tracking,
> the driver feed and notifications. It ships as `instances: 1, exec_mode: fork`.

**Seeded logins** — change the admin password immediately:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@rominalimo.com` | `admin123` |
| Passenger | `passenger@rominalimo.com` | `pass123` |
| Driver (sedan) | `alex@rominalimo.com` | `driver123` |
| Driver (SUV) | `maria@rominalimo.com` | `driver123` |
| Driver (Chevrolet) | `omar@rominalimo.com` | `driver123` |

---

## Step 6 — nginx (3 min)

```bash
sudo nano /etc/nginx/sites-available/ridetaxi
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com 66.45.240.12;

    root /home/deploy/ridetaxi/client/dist;
    index index.html;

    # Base64 avatars are ~683KB and nginx defaults to a 1MB cap
    client_max_body_size 2m;

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
    }
    location = /sw.js { add_header Cache-Control "no-cache"; }
    location / { try_files $uri $uri/ /index.html; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ridetaxi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable
curl http://localhost/api/health            # through nginx → {"status":"ok"}
```

---

## Step 7 — Test

- `http://yourdomain.com` → site loads
- `http://yourdomain.com/api/health` → `{"status":"ok"}`
- Book a ride → the driver account sees it within ~1s → tracking works

---

## Step 8 — HTTPS (5 min)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com     # choose Redirect
sudo certbot renew --dry-run                                     # verify auto-renew
```

Then switch `CLIENT_ORIGIN` + `APP_URL` in `server/.env` to `https://yourdomain.com` and:

```bash
pm2 reload ecosystem.config.js --env production
sudo systemctl reload nginx
```

---

## Step 9 — Backups (do this — a VPS is a single point of failure)

```bash
mkdir -p /home/deploy/backups
crontab -e
```

```
17 3 * * * mongodump --db ridetaxi --archive=/home/deploy/backups/ridetaxi-$(date +\%F).gz --gzip && find /home/deploy/backups -name '*.gz' -mtime +7 -delete
```

---

## Updating Later

```bash
cd ~/ridetaxi
git pull origin main
cd client && npm install && npm run build
cd ../server && npm install
cd ~/ridetaxi && pm2 reload ecosystem.config.js --env production
```

Or just run `bash scripts/deploy-interserver.sh`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Site doesn't open | Check the domain `A` record points to your VPS IP |
| `502 Bad Gateway` | `pm2 status` → `pm2 logs` → `curl localhost:5001/api/health` must be `ok` |
| `502` but health is `ok` | **AppArmor** (stricter on 24.04): `journalctl -xe \| grep -i denied`, then `sudo aa-complain /usr/sbin/nginx && sudo systemctl reload nginx` |
| Driver feed never updates | `instances` must be `1`; keep the `/socket.io/` block exactly as above |
| `CORS` error | `CLIENT_ORIGIN` must match the browser URL exactly, including `https://` |
| Emails never arrive | `SMTP_*` unset → check `pm2 logs` |
| `429 Too many requests` | Raise `RATE_LIMIT_API` |
| Build killed / OOM | Add swap (Step 2) or use a larger slice |
| `apt install mongodb` fails | Expected — use the MongoDB 8.0 repo from Step 2 |
| MongoDB won't install | You're on the `jammy` line; 24.04 needs `noble` + 8.0 |

---

*Companion: `INTERSERVER_DEPLOYMENT_GUIDE.md` (hardened/nginx tuning) · `TECHNICAL_GUIDE.md` (architecture) · `DEPLOYMENT_GUIDE.md` (Render + Vercel alternative).*
