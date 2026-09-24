# Self-hosting on Oracle Linux (8/9)

The app builds to a standalone Node server in `.output/` (no Cloudflare needed).

## 1. Install Node 22 + git
```bash
sudo dnf module reset -y nodejs && sudo dnf module enable -y nodejs:22
sudo dnf install -y nodejs git
```

## 2. Get the code and build
```bash
sudo useradd -r -m -d /opt/census census
sudo -u census git clone <your-repo-url> /opt/census/app
cd /opt/census/app
sudo -u census npm ci
sudo -u census npm run build:node      # outputs .output/
```
Test: `PORT=3000 npm start` then `curl localhost:3000`.

## 3. Run as a service
`/etc/systemd/system/census.service`:
```ini
[Unit]
Description=Sol System Census
After=network.target

[Service]
User=census
WorkingDirectory=/opt/census/app
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3000
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload && sudo systemctl enable --now census
```

## 4. HTTPS with Caddy (auto certificates)
```bash
sudo dnf install -y 'dnf-command(copr)' && sudo dnf copr enable -y @caddy/caddy
sudo dnf install -y caddy
echo 'census.example.com {
  reverse_proxy 127.0.0.1:3000
}' | sudo tee /etc/caddy/Caddyfile
sudo setsebool -P httpd_can_network_connect 1   # SELinux: allow proxying
sudo systemctl enable --now caddy
```
Point your domain's A record at the VM's public IP first.

## 5. Open ports (both layers!)
```bash
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
```
Also in the OCI Console: VCN -> Subnet -> Security List -> add ingress rules
for TCP 80 and 443 from 0.0.0.0/0.

## Updating
```bash
cd /opt/census/app && sudo -u census git pull && sudo -u census npm ci \
  && sudo -u census npm run build:node && sudo systemctl restart census
```

Note: on an ARM (Ampere A1) VM everything above works unchanged.
