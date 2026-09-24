# Self-hosting on Oracle Linux (8/9)

The app builds to a standalone Node server in `.output/` (no Cloudflare Workers needed).

Live deployment: **https://sol.moopit.fun** on `spaceguppy2`
(Oracle Linux 9.8, aarch64 / Ampere A1, public IP `150.136.12.212`).
First deployed 2026-09-24.

## 1. Install Node 22 + git
```bash
sudo dnf module reset -y nodejs && sudo dnf module enable -y nodejs:22
sudo dnf install -y nodejs git
```

## 2. Get the code and build
```bash
sudo useradd -r -m -d /opt/census census
sudo -u census git clone https://github.com/bubbabright/sol-system-census.git /opt/census/app
cd /opt/census/app          # /opt/census is 0700 — if cd fails, run the next steps via: sudo -u census bash -lc 'cd /opt/census/app && ...'
sudo -u census npm install  # NOT `npm ci`: repo ships bun.lock only, no package-lock.json
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
Install Caddy only if it is not already running (`systemctl is-active caddy`):
```bash
sudo dnf install -y 'dnf-command(copr)' && sudo dnf copr enable -y @caddy/caddy
sudo dnf install -y caddy
```

**Append** a site block — never `tee` over `/etc/caddy/Caddyfile`; on spaceguppy2 it
already serves `thriller.moopit.fun` and `moopit.fun` (Dashy). Back up first:
```bash
sudo cp -a /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak-$(date +%Y%m%d-%H%M%S)-pre-census
sudo tee -a /etc/caddy/Caddyfile >/dev/null <<'EOF'

# Sol System Census - TanStack Start node server (systemd census.service).
sol.moopit.fun {
	encode gzip zstd

	reverse_proxy 127.0.0.1:3000

	log

	header {
		-Server
		X-Content-Type-Options nosniff
		Referrer-Policy strict-origin-when-cross-origin
	}
}
EOF
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo setsebool -P httpd_can_network_connect 1   # SELinux: allow proxying (already on for spaceguppy2)
sudo systemctl reload caddy
```

## 5. DNS (Cloudflare)
`moopit.fun` is on Cloudflare. Add, in the moopit.fun zone:

| Type | Name | Content          | Proxy   |
|------|------|------------------|---------|
| A    | sol  | 150.136.12.212   | Proxied |

Same shape as `thriller`. Caddy's first ACME attempt fails with
`urn:ietf:params:acme:error:dns` if the record doesn't exist yet — harmless, it retries
and gets the cert once DNS resolves.

## 6. Open ports (both layers!)
Already open on spaceguppy2 (firewalld has http/https; Caddy serves 80/443). For a fresh VM:
```bash
sudo firewall-cmd --permanent --add-service=http --add-service=https
sudo firewall-cmd --reload
```
Also in the OCI Console: VCN -> Subnet -> Security List -> add ingress rules
for TCP 80 and 443 from 0.0.0.0/0.

## Updating
```bash
sudo -u census bash -lc 'cd /opt/census/app && git pull && npm install && npm run build:node' \
  && sudo systemctl restart census
```

## Checks
```bash
systemctl is-active census caddy
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
curl -s -o /dev/null -w '%{http_code}\n' https://sol.moopit.fun/
sudo journalctl -u census -n 50 --no-pager
```

Note: on an ARM (Ampere A1) VM everything above works unchanged.
