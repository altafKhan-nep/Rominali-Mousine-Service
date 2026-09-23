#!/bin/bash
set -e
echo "=== Interserver Deploy ==="
echo "1. Pull"
git pull origin main
echo "2. Client build"
cd client && npm ci && npm run build && cd ..
echo "3. Server deps"
cd server && npm ci --omit=dev && cd ..
echo "4. PM2 reload"
pm2 reload ecosystem.config.js --env production
echo "5. Nginx reload"
sudo nginx -t && sudo systemctl reload nginx
echo "6. Health"
sleep 2
curl -s http://localhost:5001/api/health | head -n 1
curl -s http://localhost/api/health | head -n 1
echo "Done — https://ellicottcityairporttaxi.com"
