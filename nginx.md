# Implementation Plan: DigitalOcean Host Nginx Setup for LangGraph Server

## Goal Description

Deploy a production-ready Nginx reverse proxy configuration directly on a DigitalOcean Linux VPS host (`/etc/nginx/sites-available/`).
The Nginx server will act as the single secure public ingress for the LangGraph server (running via Docker or Node on port 2024), while completely preventing public internet exposure to port 2024.

---

## Architecture & Security Model

```
[ Client / Frontend ]
          │
          │ HTTPS (443) / HTTP (80)
          ▼
┌─────────────────────────────────────────────────────────┐
│          DigitalOcean VPS Host: Nginx Ingress          │
│  - Public IP: Ports 80 & 443 only                       │
│  - SSL/TLS Termination via Let's Encrypt               │
│  - SSE buffering disabled (zero-latency streaming)     │
│  - WebSocket connection upgrade support                 │
└────────────────────────────┬────────────────────────────┘
                             │
                             │ Loopback Only (127.0.0.1:2024)
                             ▼
┌─────────────────────────────────────────────────────────┐
│            LangGraph Server (ai-agent-langgraph)        │
│  - Bound EXCLUSIVELY to 127.0.0.1                       │
│  - Port 2024 NOT reachable from public internet         │
└─────────────────────────────────────────────────────────┘
```

### Critical Security Rule: Preventing Direct Exposure

On a DigitalOcean VPS:

1. **Docker loopback binding**: In `docker-compose.yml`, the port mapping must be:
   ```yaml
   ports:
     - '127.0.0.1:2024:2024'
   ```
   _(If written as `2024:2024` without `127.0.0.1`, Docker binds to `0.0.0.0` and configures `iptables` PREROUTING rules that bypass UFW firewall!)_
2. **UFW Firewall Rule**:
   Ensure only ports `80`, `443`, and `22` (SSH) are allowed publicly:
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw deny 2024
   sudo ufw enable
   ```

---

## User Review Required

> [!IMPORTANT]
> **Domain Name & SSL**:
> The Nginx configuration below uses `agent.josephdev.com.ng` (the domain configured in `README.md` and `langgraph.json`).
> If you are using a different domain or subdomain, simply replace `agent.josephdev.com.ng` with your domain.
>
> We provide two configuration options:
>
> 1. **Complete HTTPS Configuration** (If you already have SSL certificates or use Certbot).
> 2. **Initial HTTP Bootstrap Configuration** (If you need to stand up Nginx first before running Certbot to generate the SSL certificate).

---

## Proposed Nginx Configuration Files

### 1. Ready-to-Copy Complete Nginx Virtual Host (HTTPS + HTTP Redirect)

File path on your VPS: `/etc/nginx/sites-available/agent.josephdev.com.ng`

```nginx
# 1. Connection Upgrade Map for WebSockets
# (Placed in http context or at top of file in Debian/Ubuntu)
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

# 2. HTTP Server Block: Certbot challenge & HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name agent.josephdev.com.ng;

    # Certbot ACME webroot challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# 3. HTTPS Server Block: Reverse Proxy to LangGraph
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name agent.josephdev.com.ng;

    # SSL Certificates (issued via Certbot)
    ssl_certificate /etc/letsencrypt/live/agent.josephdev.com.ng/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/agent.josephdev.com.ng/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Allow payload transfers up to 50MB (message histories / file uploads)
    client_max_body_size 50M;

    location / {
        # Proxy to LangGraph listening on loopback
        proxy_pass http://127.0.0.1:2024;
        proxy_http_version 1.1;

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # WebSocket support (LangGraph Studio & live thread inspections)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # CRITICAL FOR LANGGRAPH SSE STREAMING:
        # Disable response & request buffering so tokens stream immediately
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_cache off;
        chunked_transfer_encoding on;

        # Timeouts: Set to 1 hour to prevent 504 Gateway Timeouts during long LLM agent workflows
        proxy_connect_timeout 60s;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        send_timeout 3600s;
    }
}
```

---

### 2. Initial Setup Configuration (If you haven't issued SSL yet)

If Certbot has not yet issued the certificate for your domain, you cannot start Nginx with `ssl_certificate` pointing to nonexistent files. Use this bootstrap configuration first:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name agent.josephdev.com.ng;

    location / {
        proxy_pass http://127.0.0.1:2024;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffering off;
        proxy_request_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

Then run `sudo certbot --nginx -d agent.josephdev.com.ng` which will automatically configure SSL!

---

## Step-by-Step Server Setup Instructions

### Step 1: Create the Nginx Configuration on DigitalOcean Host

```bash
sudo nano /etc/nginx/sites-available/agent.josephdev.com.ng
# (Paste the Nginx configuration above and save)
```

### Step 2: Enable the Site & Test Syntax

```bash
sudo ln -sf /etc/nginx/sites-available/agent.josephdev.com.ng /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Issue SSL with Let's Encrypt (Certbot)

If you haven't obtained an SSL certificate yet:

```bash
sudo certbot --nginx -d agent.josephdev.com.ng
```

### Step 4: Ensure LangGraph is Isolated to 127.0.0.1

In your project directory on the server, check `docker-compose.yml`:

```yaml
langgraph:
  ...
  ports:
    - "127.0.0.1:2024:2024"
```

Restart the container if needed:

```bash
docker compose up -d langgraph
```

---

## Verification Plan

### Automated / CLI Verification

1. **Verify port 2024 is NOT exposed externally**:
   From your local laptop or an outside terminal:
   ```bash
   curl -m 4 http://<VPS_IP>:2024/ok
   ```
   _Expected result_: Connection timed out or connection refused.
2. **Verify LangGraph responds via Nginx**:
   ```bash
   curl -i https://agent.josephdev.com.ng/ok
   ```
   _Expected result_: `HTTP/2 200 OK` with `{"status":"ok"}`.
3. **Verify SSE streaming without buffering**:
   ```bash
   curl -i -N -H "Accept: text/event-stream" https://agent.josephdev.com.ng/threads
   ```
   _Expected result_: Immediate response headers without delay or buffering.
4. **Verify CORS preflight for frontend**:
   ```bash
   curl -i -X OPTIONS https://agent.josephdev.com.ng/assistants/search \
     -H 'Origin: https://josephdev.com.ng' \
     -H 'Access-Control-Request-Method: POST'
   ```
