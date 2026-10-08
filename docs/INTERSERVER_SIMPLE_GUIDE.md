# Interserver Simple Deploy — Romina Limousine Service (Interserver Only)

Deploy **everything on Interserver** — no Atlas, no Vercel, no Render. One VPS runs the database, API, and website. Domain also from Interserver.

> **You need:** Interserver account + VPS + Domain (all from Interserver). No other service.

---

## Step 1 — Buy VPS + Domain (5 min)

1. Go to **interserver.net** → **VPS** → **Standard VPS** → **Order**
   - **OS:** `Ubuntu 22.04`
   - **Plan:** `1 Slice` (1 core, 2GB RAM, 30GB — enough for build)
   - Keep the email with **IP** (e.g. `66.45.240.12`) and **root password**.

2. In same Interserver panel → **Domains** → **Register New Domain** → buy `yourdomain.com` (or use a free subdomain they give you for testing, like `yourdomain.interserver.net`).

3. Still in Interserver panel → **Domains → Manage → your domain → DNS**
   - Delete old `A` records
   - Add: `A` → `@` → `66.45.240.12` (your VPS IP)
   - Add: `A` → `www` → `66.45.240.12`
   - Save. Done — domain now points to your VPS. Wait 5 min.

---

## Step 2 — First Login (2 min)

On your computer, open terminal:

```bash
ssh root@66.45.240.12
# paste root password
```

Run these **once** (copy-paste all):

```bash
apt update && apt upgrade -y
apt install -y curl git nginx mongodb
systemctl enable mongod; systemctl start mongod
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
adduser deploy
# set a password for deploy when asked
usermod -aG sudo deploy
su - deploy
```

---

## Step 3 — Get the Code (2 min)

As `deploy` user:

```bash
cd ~
git clone https://github.com/altafKhan-nep/Rominali-Mousine-Service.git ridetaxi
cd ridetaxi
```

---

## Step 4 — Set Passwords (1 min)

```bash
# Make secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# run twice, copy two different strings

nano server/.env
```

In the editor, make it look like this (replace IP/domain if you use IP for now):

```
NODE_ENV=production
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/ridetaxi
JWT_ACCESS_SECRET=paste-first-string-here
JWT_REFRESH_SECRET=paste-second-string-here
CLIENT_ORIGIN=http://66.45.240.12
APP_URL=http://66.45.240.12
TRUST_PROXY=true
```

If you already set domain in Step 1, use `https://yourdomain.com` instead of `http://66.45.240.12` for both.

Press `Ctrl+O`, `Enter`, `Ctrl+X` to save.

```bash
nano client/.env
```

Make it:

```
VITE_API_URL=http://66.45.240.12
```

(Or `https://yourdomain.com` if domain is ready.)

`Ctrl+O`, `Enter`, `Ctrl+X`.

---

## Step 5 — Build & Start (3 min)

```bash
cd ~/ridetaxi/client && npm install && npm run build
cd ../server && npm install && npm run seed
pm2 start ecosystem.config.js --env production
pm2 save
curl http://localhost:5001/api/health
# should print {"status":"ok"}
```

---

## Step 6 — Make Website Public (2 min)

```bash
sudo nano /etc/nginx/sites-available/ridetaxi
```

Paste this (replace IP/domain if needed):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com 66.45.240.12;

    root /home/deploy/ridetaxi/client/dist;
    index index.html;

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
    }
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Save (`Ctrl+O`, `Enter`, `Ctrl+X`), then:

```bash
sudo ln -s /etc/nginx/sites-available/ridetaxi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

---

## Step 7 — Test

On your phone/computer, open:

- `http://66.45.240.12` → website loads
- `http://66.45.240.12/api/health` → `{"status":"ok"}`
- Book a ride → driver on other tab gets it in 1 sec → tracking works

If you used a domain, open `http://yourdomain.com` instead. For `https`, run once:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# choose Redirect
```

Then change both `.env` to `https://yourdomain.com` and rebuild:

```bash
cd ~/ridetaxi/client && npm run build
pm2 reload ecosystem.config.js --env production
sudo systemctl reload nginx
```

---

## Update Later

```bash
cd ~/ridetaxi
git pull origin main
cd client && npm install && npm run build
cd ../server && npm install
pm2 reload ecosystem.config.js --env production
```

That’s it — **only Interserver**, no extra. All data stays on your VPS (`127.0.0.1:27017/ridetaxi`).

---

## If It Doesn’t Work

| You see | Do this |
|---------|---------|
| Site doesn’t open | In Interserver panel, check domain `A` points to `66.45.240.12` → wait 5 min |
| `502 Bad Gateway` | `pm2 status` → `pm2 logs` → `curl http://localhost:5001/api/health` must be `ok` |
| `CORS` error | `server/.env` `CLIENT_ORIGIN` must exactly match the URL you open (with `http` or `https`) |
| `429 Too many requests` | Normal on heavy test — `server/.env` already `2000` for Interserver polling |

