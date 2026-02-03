# Cloudflare Tunnel + Nginx Setup Guide

This guide will help you set up Nginx as a reverse proxy for Cloudflare Tunnel on your Fedora Server.

## Prerequisites
- Cloudflare Tunnel already running ✓
- Root/sudo access to the server
- Domain: `citaks.my.id` with wildcard DNS configured

## Step 1: Install Nginx

```bash
# Install Nginx
sudo dnf install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

## Step 2: Create Project Directory

```bash
# Create directory structure
sudo mkdir -p /var/www/auto-gen/nginx
sudo mkdir -p /var/www/auto-gen/containers
sudo mkdir -p /var/www/auto-gen/data

# Set permissions (replace 'your-user' with your actual username)
sudo chown -R your-user:your-user /var/www/auto-gen
```

## Step 3: Deploy Configuration Files

Upload these files from your Windows dev environment to the server:

```bash
# From Windows (using scp or similar):
scp nginx-proxy/tunnel-proxy.conf your-user@server:/var/www/auto-gen/nginx/
scp nginx-proxy/proxy_map.conf your-user@server:/var/www/auto-gen/nginx/
scp scripts/generator.js your-user@server:/var/www/auto-gen/scripts/
scp scripts/nginx-updater.js your-user@server:/var/www/auto-gen/scripts/
```

Or use Git to clone the project directly on the server.

## Step 4: Link Nginx Configuration

```bash
# Create symlink to enable the site
sudo ln -s /var/www/auto-gen/nginx/tunnel-proxy.conf /etc/nginx/conf.d/tunnel-proxy.conf

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

## Step 5: Update Cloudflare Tunnel Config

Edit your tunnel config (usually at `~/.cloudflared/config.yml`):

```yaml
tunnel: <your-tunnel-id>
credentials-file: /home/your-user/.cloudflared/<uuid>.json

ingress:
  # Existing services (e.g., Nextcloud)
  - hostname: nextcloud.citaks.my.id
    service: http://localhost:8080
  
  # Route all other subdomains to auto-gen Nginx proxy
  - hostname: "*.citaks.my.id"
    service: http://localhost:8081
  
  # Catch-all
  - service: http_status:404
```

After editing, restart the tunnel:

```bash
sudo systemctl restart cloudflared
# OR if running manually:
# pkill cloudflared && cloudflared tunnel run <tunnel-name> &
```

## Step 6: Allow Script to Reload Nginx (Passwordless)

The generator script needs to reload Nginx after adding sites. Add sudo permission:

```bash
sudo visudo
```

Add this line at the end:

```
your-user ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
```

Save and exit (Ctrl+X, Y, Enter in nano).

## Step 7: Test the System

1. Create a test website from the dashboard
2. Check that `proxy_map.conf` was updated:
   ```bash
   cat /var/www/auto-gen/nginx/proxy_map.conf
   ```
3. Verify Nginx reloaded:
   ```bash
   sudo systemctl status nginx
   ```
4. Test accessing the site:
   ```bash
   curl https://testsite.citaks.my.id
   ```

## Troubleshooting

### Nginx won't start
```bash
# Check error logs
sudo journalctl -u nginx -n 50

# Common issue: SELinux blocking
sudo setsebool -P httpd_can_network_connect 1
```

### Tunnel not routing
```bash
# Check tunnel logs
sudo journalctl -u cloudflared -f

# Verify tunnel config
cloudflared tunnel info <tunnel-name>
```

### Port conflicts
```bash
# Check if port 8080 is in use
sudo ss -tlnp | grep 8080
```

## Security Notes

- The proxy runs on localhost:8080 (not exposed)
- All external traffic goes through Cloudflare Tunnel (encrypted)
- Nginx only accepts requests from localhost
- Containers are isolated and not directly accessible

## Next Steps

- Set up monitoring for Nginx and containers
- Configure rate limiting in Nginx
- Add SSL/TLS for container-to-nginx communication (optional)
